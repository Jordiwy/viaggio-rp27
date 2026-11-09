import "./styles.css";
import "./shell.css";
import Sync from "./sync.js";

const $ = (id) => document.getElementById(id);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

/* ---------- Pantallas de acceso ---------- */

function gate(view) {
  document.body.classList.remove("booting");
  $("boot").hidden = true;
  $("gate").hidden = false;
  for (const s of $("gate").querySelectorAll("[data-view]")) s.hidden = s.dataset.view !== view;
}

async function share(text, url) {
  if (navigator.share) {
    try { await navigator.share({ title: "Viatge", text, url }); return true; } catch { return false; }
  }
  await copy(url);
  return true;
}
async function copy(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove(); return true;
  }
}
const inviteText = (name, trip) =>
  `${name}, te he preparado la app de nuestro viaje (${trip}). Ábrela en Safari y añádela a la pantalla de inicio desde Compartir → Añadir a pantalla de inicio.`;

function setupFlow() {
  gate("setup");
  $("setup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), err = $("setup-err"), btn = e.target.querySelector("button");
    err.hidden = true; btn.disabled = true; btn.textContent = "Creando…";
    try {
      const tripName = f.get("tripName").trim(), guest = f.get("guest").trim();
      const r = await Sync.setup(tripName, f.get("owner").trim(), guest);
      Sync.useToken(r.ownerToken);
      const link = Sync.linkFor(r.guestToken);
      $("done-guest").textContent = guest;
      $("done-link").textContent = link;
      $("done-share").onclick = () => share(inviteText(guest, tripName), link);
      $("done-copy").onclick = async () => { await copy(link); $("done-copy").textContent = "Copiado"; };
      $("done-enter").onclick = () => location.replace("/?k=" + r.ownerToken);
      gate("done");
    } catch (x) {
      err.textContent = x.message || "No se ha podido crear el viaje.";
      err.hidden = false; btn.disabled = false; btn.textContent = "Crear el viaje";
    }
  });
}

/* ---------- Arranque ---------- */

async function boot() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

  if (!Sync.token) {
    try { const h = await Sync.health(); h.needsSetup ? setupFlow() : gate("nolink"); }
    catch { gate("nolink"); }
    return;
  }

  // El enlace se queda en la dirección para que «Añadir a pantalla de inicio» lo conserve.
  const url = new URL(location.href);
  if (url.searchParams.get("k") !== Sync.token) {
    url.searchParams.set("k", Sync.token);
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  }
  $("manifest").href = "/manifest.webmanifest?k=" + encodeURIComponent(Sync.token);

  let authFailed = false;
  Sync.on("auth", () => { authFailed = true; gate("invalid"); });
  $("gate-retry").onclick = () => location.reload();

  if (!Sync.fromCache()) {
    await Sync.refresh(true);
    if (authFailed) return;
    if (!Sync.state) { $("boot").querySelector("p").textContent = "Sin conexión. Vuelve a intentarlo cuando tengas internet."; return; }
  }

  await import("./app.js");
  await import("./surprise.js");
  document.body.classList.remove("booting");
  $("boot").hidden = true;
  account();
  installHint();
  Sync.start();
}

/* ---------- Perfil ---------- */

function initials(n) { const p = (n || "?").trim().split(/\s+/); return ((p[0] || "?")[0] + (p[1] ? p[1][0] : "")).toUpperCase(); }
function seen(t) {
  if (!t) return "Todavía no ha entrado";
  const s = (Date.now() - t) / 1000;
  if (s < 120) return "Conectado ahora";
  if (s < 3600) return "Visto hace " + Math.floor(s / 60) + " min";
  if (s < 86400) return "Visto hace " + Math.floor(s / 3600) + " h";
  return "Visto hace " + Math.floor(s / 86400) + " días";
}

function account() {
  const btn = $("me-btn"), sheet = $("account");
  btn.hidden = false;
  const SYNC = { idle: "Todo guardado", saving: "Guardando…", offline: "Sin conexión", error: "Error al guardar" };

  function paint() {
    const s = Sync.state; if (!s) return;
    $("me-ini").textContent = initials(s.me.name);
    btn.style.setProperty("--c", s.me.color);
    $("acc-av").textContent = initials(s.me.name); $("acc-av").style.background = s.me.color;
    $("acc-title").textContent = "Hola, " + s.me.name;
    $("acc-trip").textContent = s.trip.name;
    $("acc-sync").textContent = SYNC[Sync.status] || SYNC.idle;
    if (document.activeElement !== $("name-in")) $("name-in").value = s.me.name;
    const ul = $("acc-members"); ul.innerHTML = "";
    for (const m of s.members) {
      const li = document.createElement("li");
      li.innerHTML = '<span class="acc-av sm"></span><span><b></b><small></small></span>';
      li.querySelector(".acc-av").textContent = initials(m.name); li.querySelector(".acc-av").style.background = m.color;
      li.querySelector("b").textContent = m.name + (m.id === s.me.id ? " (tú)" : "");
      li.querySelector("small").textContent = (m.role === "owner" ? "Organiza · " : "") + (m.id === s.me.id ? "Conectado ahora" : seen(m.lastSeen));
      ul.appendChild(li);
    }
    const inv = $("acc-invite"); inv.hidden = s.me.role !== "owner";
    if (s.me.role === "owner") {
      const box = $("acc-links"); box.innerHTML = "";
      for (const m of s.members.filter((x) => x.id !== s.me.id)) {
        const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.textContent = "Nuevo enlace para " + m.name;
        b.onclick = async () => {
          if (!confirmTwice(b)) return;
          b.disabled = true;
          try {
            const token = await Sync.newLink(m.id), link = Sync.linkFor(token);
            await share(inviteText(m.name, s.trip.name), link);
            b.textContent = "Enlace nuevo creado ✓";
          } catch { b.textContent = "No se ha podido crear"; }
          b.disabled = false;
        };
        box.appendChild(b);
      }
    }
  }
  function confirmTwice(b) {
    if (b.dataset.armed) return true;
    b.dataset.armed = "1"; const t = b.textContent; b.textContent = "Pulsa otra vez: el enlace anterior dejará de funcionar";
    setTimeout(() => { if (b.dataset.armed) { delete b.dataset.armed; b.textContent = t; } }, 5000);
    return false;
  }

  function open() {
    paint(); sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("lock");
    try { history.pushState({ acc: 1 }, "", location.href); } catch {}
    setTimeout(() => $("acc-back").focus({ preventScroll: true }), 50);
  }
  function close(fromPop) {
    if (!sheet.classList.contains("open")) return;
    sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("lock");
    if (!fromPop && history.state && history.state.acc) history.back();
    btn.focus({ preventScroll: true });
  }
  btn.onclick = open;
  $("acc-back").onclick = () => close(false);
  addEventListener("popstate", () => { if (sheet.classList.contains("open") && !(history.state && history.state.acc)) close(true); });
  $("name-form").onsubmit = async (e) => {
    e.preventDefault(); const v = $("name-in").value.trim(); if (!v) return;
    try { await Sync.rename(v); paint(); } catch {}
  };
  $("my-link").onclick = async () => { await copy(Sync.linkFor(Sync.token)); $("my-link").textContent = "Copiado"; };
  $("sign-out").onclick = () => {
    const b = $("sign-out");
    if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Pulsa otra vez para salir"; return; }
    Sync.signOut();
  };
  Sync.on("state", paint);
  Sync.on("status", (st) => { btn.dataset.status = st; $("acc-sync").textContent = SYNC[st] || SYNC.idle; });
  paint();
}

function installHint() {
  if (!isIOS || standalone) return;
  try { if (localStorage.getItem("viatge.install-dismissed")) return; } catch {}
  $("install").hidden = false;
  $("install-x").onclick = () => { $("install").hidden = true; try { localStorage.setItem("viatge.install-dismissed", "1"); } catch {} };
}

boot();
