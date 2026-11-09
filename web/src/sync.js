/*
 * Sincronización con la API.
 *
 * La app trabaja sobre un objeto plano `mine` (lo que ve y edita este usuario):
 *   w_<plan>      "1" si le apetece ese plan            → /api/wishes/:plan
 *   <decisión>    opción votada (cena, pizza, …)        → /api/votes/:decision
 *   it_<día>      plan del día (compartido)             → /api/itinerary/:day
 *   note          notas (compartidas)                   → /api/note
 * Cada vez que la app guarda, se calcula la diferencia con lo último confirmado por el
 * servidor y se envía solo eso. Si no hay conexión, queda pendiente y se reintenta.
 */

const TOKEN_KEY = "viatge.token";
const CACHE_KEY = "viatge.cache.v1";
const DECISIONS = ["cena", "pizza", "domingo", "gelato"];
const DAYS = ["jueves", "viernes", "sabado", "domingo"];
const POLL_MS = 15000;

const clone = (o) => JSON.parse(JSON.stringify(o ?? null));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function readToken() {
  const url = new URL(location.href);
  const k = url.searchParams.get("k");
  if (k && /^[A-Za-z0-9_-]{20,100}$/.test(k)) {
    try { localStorage.setItem(TOKEN_KEY, k); } catch {}
    return k;
  }
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
}

class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

const Sync = {
  token: readToken(),
  state: null,          // última respuesta completa de /api/state
  mine: {},             // vista local editable
  synced: {},           // lo último confirmado por el servidor
  versions: {},         // versión de cada día del plan
  packing: {},
  status: "idle",       // idle | saving | offline | error
  listeners: { state: [], status: [], conflict: [], auth: [] },
  labeler: () => null,
  _queue: Promise.resolve(),
  _pending: 0,
  _timer: null,

  on(ev, fn) { this.listeners[ev].push(fn); },
  emit(ev, ...a) { for (const fn of this.listeners[ev]) { try { fn(...a); } catch (e) { console.error(e); } } },
  setStatus(s) { if (this.status !== s) { this.status = s; this.emit("status", s); } },

  async api(method, path, body) {
    let res;
    try {
      res = await fetch(path, {
        method,
        headers: { "content-type": "application/json", authorization: "Bearer " + this.token },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      });
    } catch {
      throw new ApiError(0, "offline", "Sin conexión.");
    }
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      if (res.status === 401) this.emit("auth", data?.message || "Enlace no válido.");
      throw new ApiError(res.status, data?.error || "error", data?.message || "Error.");
    }
    return data;
  },

  /* ---------- Estado ---------- */

  fromCache() {
    const c = loadCache();
    if (!c || c.token !== this.token) return false;
    this.state = c.state; this.mine = c.mine || {}; this.synced = c.synced || {};
    this.versions = c.versions || {}; this.packing = c.packing || {};
    return !!this.state;
  },
  persist() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        token: this.token, state: this.state, mine: this.mine, synced: this.synced,
        versions: this.versions, packing: this.packing,
      }));
    } catch {}
  },

  /** Convierte el estado del servidor en el objeto plano que usa la app. */
  project(s) {
    const meId = s.me.id, mine = {};
    for (const w of s.wishes) if (w.memberId === meId) mine["w_" + w.plan] = "1";
    for (const v of s.votes) if (v.memberId === meId) mine[v.decision] = v.option;
    this.versions = {};
    for (const d of DAYS) {
      const it = s.itinerary[d];
      if (it) { mine["it_" + d] = it.items; this.versions[d] = it.version; } else this.versions[d] = 0;
    }
    if (s.note && s.note.body) mine.note = s.note.body;
    return mine;
  },

  /** Lo que ha elegido cada miembro (para mostrar los votos y corazones del otro). */
  everyone() {
    const s = this.state, all = {}, profiles = {};
    if (!s) return { all, profiles, uid: null };
    for (const m of s.members) {
      all[m.id] = {};
      profiles[m.id] = { name: m.name, color: m.color, isMe: m.id === s.me.id, role: m.role, lastSeen: m.lastSeen };
    }
    for (const w of s.wishes) if (all[w.memberId]) all[w.memberId]["w_" + w.plan] = "1";
    for (const v of s.votes) if (all[v.memberId]) all[v.memberId][v.decision] = v.option;
    all[s.me.id] = Object.assign({}, this.mine);
    return { all, profiles, uid: s.me.id };
  },

  async refresh(force) {
    if (!this.token) return;
    if (this._pending) return;                       // primero se envía lo pendiente
    const since = force || !this.state ? -1 : this.state.rev;
    let s;
    try { s = await this.api("GET", "/api/state?since=" + since); }
    catch (e) { if (e.status === 0) this.setStatus("offline"); return; }
    if (this.status === "offline" || this.status === "error") this.setStatus("idle");
    if (s.unchanged) return;
    if (this._pending) return;
    this.state = s;
    this.mine = this.project(s);
    this.synced = clone(this.mine);
    this.packing = s.packing || {};
    this.persist();
    this.emit("state", s);
  },

  start() {
    const tick = () => { if (document.visibilityState === "visible") this.flush().then(() => this.refresh()); };
    clearInterval(this._timer);
    this._timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    addEventListener("online", tick);
    return this.refresh(true);
  },

  /* ---------- Envío de cambios ---------- */

  push(mine) {
    this.mine = clone(mine);
    this.persist();
    return this.flush();
  },

  flush() {
    this._queue = this._queue.then(() => this._send()).catch((e) => console.error(e));
    return this._queue;
  },

  async _send() {
    const keys = new Set([...Object.keys(this.mine), ...Object.keys(this.synced)]);
    const changes = [...keys].filter((k) => !same(this.mine[k], this.synced[k]) && this._route(k));
    if (!changes.length) { if (this.status === "saving") this.setStatus("idle"); return; }
    this._pending = changes.length;
    this.setStatus("saving");
    for (const k of changes) {
      const value = clone(this.mine[k]);
      try {
        const r = await this._route(k)(value);
        if (r && r.version !== undefined) this.versions[k.slice(3)] = r.version;
        if (value === null || value === undefined) delete this.synced[k]; else this.synced[k] = value;
        if (this.state && r && r.rev) this.state.rev = r.rev;
        this._pending--;
        this.persist();
      } catch (e) {
        this._pending = 0;
        if (e.status === 0) { this.setStatus("offline"); return; }
        if (e.code === "conflict") {
          this.setStatus("idle");
          await this.refresh(true);
          this.emit("conflict", k.slice(3));
          return;
        }
        this.setStatus("error");
        console.error(k, e);
        // Se descarta el cambio que el servidor no acepta y se vuelve a lo confirmado.
        if (k in this.synced) this.mine[k] = clone(this.synced[k]); else delete this.mine[k];
        this.emit("state", this.state);
        return;
      }
    }
    this._pending = 0;
    this.setStatus("idle");
  },

  _route(k) {
    if (k.startsWith("w_")) {
      const plan = k.slice(2);
      return (v) => this.api("PUT", "/api/wishes/" + plan, { on: !!v, label: this.labeler(k, v) || undefined });
    }
    if (k.startsWith("it_")) {
      const day = k.slice(3);
      if (!DAYS.includes(day)) return null;
      return (v) => v
        ? this.api("PUT", "/api/itinerary/" + day, { items: v, version: this.versions[day] ?? 0, summary: summarize(this.synced[k] ?? (this.defaults && this.defaults[day]), v) })
        : this.api("DELETE", "/api/itinerary/" + day).then((r) => ({ ...r, version: 0 }));
    }
    if (k === "note") return (v) => this.api("PUT", "/api/note", { body: v || "" });
    if (DECISIONS.includes(k)) {
      return (v) => this.api("PUT", "/api/votes/" + k, { option: v || null, label: (v && this.labeler(k, v)) || undefined });
    }
    return null;
  },

  async pack(item, done) {
    this.packing[item] = done;
    this.persist();
    try { await this.api("PUT", "/api/packing/" + item, { done }); }
    catch (e) { if (e.status === 0) this.setStatus("offline"); }
  },

  /* ---------- Cuenta ---------- */

  health() { return fetch("/api/health", { cache: "no-store" }).then((r) => r.json()); },
  async setup(tripName, owner, guest) {
    const r = await fetch("/api/setup", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripName, owner, guest }),
    });
    const data = await r.json();
    if (!r.ok) throw new ApiError(r.status, data.error, data.message);
    return data;
  },
  rename(name) { return this.api("PATCH", "/api/me", { name }).then(() => this.refresh(true)); },
  newLink(memberId) { return this.api("POST", "/api/members/" + memberId + "/link").then((r) => r.token); },
  linkFor(token) { return location.origin + "/?k=" + token; },
  useToken(token) {
    this.token = token;
    try { localStorage.setItem(TOKEN_KEY, token); localStorage.removeItem(CACHE_KEY); } catch {}
  },
  signOut() {
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(CACHE_KEY); } catch {}
    location.replace("/");
  },
};

/** Resumen legible de un cambio en el plan de un día, para el historial. */
function summarize(before, after) {
  const names = (a) => (Array.isArray(a) ? a : []).map((x) => x.n);
  const b = names(before), a = names(after);
  if (!before) return "ha cambiado el plan";
  const added = a.filter((n) => !b.includes(n)), removed = b.filter((n) => !a.includes(n));
  const parts = [];
  if (added.length) parts.push("ha añadido " + added.join(", "));
  if (removed.length) parts.push("ha quitado " + removed.join(", "));
  return (parts.join(" y ") || "ha cambiado las horas").slice(0, 160);
}

window.Sync = Sync;
export default Sync;
