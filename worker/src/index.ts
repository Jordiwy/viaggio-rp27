import { Hono, type Context } from "hono";
import type { z } from "zod";
import {
  COLORS, DAYS, type Env, type Member,
  itinerarySchema, keySchema, nameSchema, newId, newToken, noteSchema,
  packSchema, setupSchema, sha256, voteSchema, wishSchema,
} from "./lib";

type Vars = { me: Member };
type C = Context<{ Bindings: Env; Variables: Vars }>;

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

/* ---------- Utilidades ---------- */

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

async function body<T extends z.ZodTypeAny>(c: C, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try { raw = await c.req.json(); } catch { throw new HttpError(400, "bad_json", "El cuerpo no es JSON válido."); }
  const r = schema.safeParse(raw);
  if (!r.success) throw new HttpError(400, "invalid", r.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; "));
  return r.data;
}

function param(c: C, name: string): string {
  const v = c.req.param(name) ?? "";
  if (!keySchema.safeParse(v).success) throw new HttpError(400, "bad_key", "Identificador no válido.");
  return v;
}

const now = () => Date.now();

/** Sube la revisión del viaje y apunta el cambio en el historial, en el mismo lote. */
function bump(env: Env, me: Member, kind: string | null, data: unknown) {
  const stmts = [env.DB.prepare("UPDATE trips SET rev = rev + 1 WHERE id = ?").bind(me.trip_id)];
  if (kind) {
    stmts.push(
      env.DB.prepare("INSERT INTO activity (trip_id, member_id, kind, data, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(me.trip_id, me.id, kind, JSON.stringify(data), now()),
    );
  }
  return stmts;
}

async function rev(env: Env, tripId: string): Promise<number> {
  const r = await env.DB.prepare("SELECT rev FROM trips WHERE id = ?").bind(tripId).first<{ rev: number }>();
  return r?.rev ?? 0;
}

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.code, message: err.message }, err.status as 400);
  console.error(err);
  return c.json({ error: "server", message: "Error del servidor." }, 500);
});

/* ---------- Públicas ---------- */

app.get("/api/health", async (c) => {
  const t = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM trips").first<{ n: number }>();
  return c.json({ ok: true, needsSetup: (t?.n ?? 0) === 0 });
});

/** Primer arranque: crea el viaje y los dos enlaces. Solo funciona con la base de datos vacía. */
app.post("/api/setup", async (c) => {
  const b = await body(c, setupSchema);
  const t = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM trips").first<{ n: number }>();
  if ((t?.n ?? 0) > 0) throw new HttpError(409, "already_setup", "El viaje ya está creado.");
  const tripId = newId("trip");
  const ownerToken = newToken(), guestToken = newToken();
  const ts = now();
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO trips (id, name, rev, created_at) VALUES (?, ?, 1, ?)").bind(tripId, b.tripName, ts),
    c.env.DB.prepare("INSERT INTO members (id, trip_id, name, role, color, token_hash, created_at) VALUES (?, ?, ?, 'owner', ?, ?, ?)")
      .bind(newId("mem"), tripId, b.owner, COLORS[0], await sha256(ownerToken), ts),
    c.env.DB.prepare("INSERT INTO members (id, trip_id, name, role, color, token_hash, created_at) VALUES (?, ?, ?, 'guest', ?, ?, ?)")
      .bind(newId("mem"), tripId, b.guest, COLORS[1], await sha256(guestToken), ts),
  ]);
  return c.json({ ownerToken, guestToken }, 201);
});

/* ---------- Autenticación por enlace personal ---------- */

app.use("/api/*", async (c, next) => {
  const h = c.req.header("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token || token.length > 100) throw new HttpError(401, "no_token", "Falta el enlace de acceso.");
  const me = await c.env.DB.prepare(
    "SELECT id, trip_id, name, role, color, last_seen FROM members WHERE token_hash = ?",
  ).bind(await sha256(token)).first<Member>();
  if (!me) throw new HttpError(401, "bad_token", "Este enlace ya no es válido.");
  c.set("me", me);
  await next();
  c.header("Cache-Control", "no-store");
});

/* ---------- Estado completo (y sincronización) ---------- */

app.get("/api/state", async (c) => {
  const me = c.get("me"), db = c.env.DB, ts = now();
  if (!me.last_seen || ts - me.last_seen > 60_000) {
    await db.prepare("UPDATE members SET last_seen = ? WHERE id = ?").bind(ts, me.id).run();
  }
  const since = Number(c.req.query("since") ?? -1);
  const current = await rev(c.env, me.trip_id);
  if (since === current) return c.json({ rev: current, unchanged: true });

  const [trip, members, itin, votes, wishes, note, pack, act] = await db.batch([
    db.prepare("SELECT id, name FROM trips WHERE id = ?").bind(me.trip_id),
    db.prepare("SELECT id, name, role, color, last_seen FROM members WHERE trip_id = ? ORDER BY created_at").bind(me.trip_id),
    db.prepare("SELECT day, items, version, updated_at, updated_by FROM itinerary WHERE trip_id = ?").bind(me.trip_id),
    db.prepare("SELECT member_id, decision, option FROM votes WHERE trip_id = ?").bind(me.trip_id),
    db.prepare("SELECT member_id, plan FROM wishes WHERE trip_id = ?").bind(me.trip_id),
    db.prepare("SELECT body, updated_at, updated_by FROM notes WHERE trip_id = ?").bind(me.trip_id),
    db.prepare("SELECT item, done FROM packing WHERE member_id = ?").bind(me.id),
    db.prepare("SELECT id, member_id, kind, data, created_at FROM activity WHERE trip_id = ? ORDER BY id DESC LIMIT 40").bind(me.trip_id),
  ]);

  const itinerary: Record<string, unknown> = {};
  for (const r of itin.results as any[]) {
    itinerary[r.day] = { items: JSON.parse(r.items), version: r.version, updatedAt: r.updated_at, updatedBy: r.updated_by };
  }
  const n = (note.results as any[])[0];
  return c.json({
    rev: current,
    trip: trip.results[0],
    me: { id: me.id, name: me.name, role: me.role, color: me.color },
    members: (members.results as any[]).map((m) => ({ id: m.id, name: m.name, role: m.role, color: m.color, lastSeen: m.last_seen })),
    itinerary,
    votes: (votes.results as any[]).map((v) => ({ memberId: v.member_id, decision: v.decision, option: v.option })),
    wishes: (wishes.results as any[]).map((w) => ({ memberId: w.member_id, plan: w.plan })),
    note: n ? { body: n.body, updatedAt: n.updated_at, updatedBy: n.updated_by } : null,
    packing: Object.fromEntries((pack.results as any[]).map((p) => [p.item, !!p.done])),
    activity: (act.results as any[]).map((a) => ({ id: a.id, memberId: a.member_id, kind: a.kind, data: JSON.parse(a.data), at: a.created_at })),
  });
});

/* ---------- Plan de cada día (compartido, con control de versiones) ---------- */

app.put("/api/itinerary/:day", async (c) => {
  const me = c.get("me"), day = c.req.param("day");
  if (!(DAYS as readonly string[]).includes(day)) throw new HttpError(400, "bad_day", "Día no válido.");
  const b = await body(c, itinerarySchema);
  const row = await c.env.DB.prepare("SELECT version FROM itinerary WHERE trip_id = ? AND day = ?")
    .bind(me.trip_id, day).first<{ version: number }>();
  const currentVersion = row?.version ?? 0;
  if (b.version !== undefined && b.version !== currentVersion) {
    throw new HttpError(409, "conflict", "El plan de este día ha cambiado mientras lo editabas.");
  }
  const version = currentVersion + 1;
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO itinerary (trip_id, day, items, version, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (trip_id, day) DO UPDATE SET items = excluded.items, version = excluded.version,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(me.trip_id, day, JSON.stringify(b.items), version, now(), me.id),
    ...bump(c.env, me, "itinerary", { day, summary: b.summary ?? null }),
  ]);
  return c.json({ ok: true, version, rev: await rev(c.env, me.trip_id) });
});

app.delete("/api/itinerary/:day", async (c) => {
  const me = c.get("me"), day = c.req.param("day");
  if (!(DAYS as readonly string[]).includes(day)) throw new HttpError(400, "bad_day", "Día no válido.");
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM itinerary WHERE trip_id = ? AND day = ?").bind(me.trip_id, day),
    ...bump(c.env, me, "itinerary_reset", { day }),
  ]);
  return c.json({ ok: true, rev: await rev(c.env, me.trip_id) });
});

/* ---------- Votos, corazones, notas y maleta ---------- */

app.put("/api/votes/:decision", async (c) => {
  const me = c.get("me"), decision = param(c, "decision");
  const b = await body(c, voteSchema);
  const stmt = b.option
    ? c.env.DB.prepare(
        `INSERT INTO votes (trip_id, member_id, decision, option, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (member_id, decision) DO UPDATE SET option = excluded.option, updated_at = excluded.updated_at`,
      ).bind(me.trip_id, me.id, decision, b.option, now())
    : c.env.DB.prepare("DELETE FROM votes WHERE member_id = ? AND decision = ?").bind(me.id, decision);
  await c.env.DB.batch([stmt, ...bump(c.env, me, "vote", { decision, option: b.option, label: b.label ?? null })]);
  return c.json({ ok: true, rev: await rev(c.env, me.trip_id) });
});

app.put("/api/wishes/:plan", async (c) => {
  const me = c.get("me"), plan = param(c, "plan");
  const b = await body(c, wishSchema);
  const stmt = b.on
    ? c.env.DB.prepare("INSERT OR IGNORE INTO wishes (trip_id, member_id, plan, created_at) VALUES (?, ?, ?, ?)")
        .bind(me.trip_id, me.id, plan, now())
    : c.env.DB.prepare("DELETE FROM wishes WHERE member_id = ? AND plan = ?").bind(me.id, plan);
  await c.env.DB.batch([stmt, ...bump(c.env, me, b.on ? "wish" : null, { plan, label: b.label ?? null })]);
  return c.json({ ok: true, rev: await rev(c.env, me.trip_id) });
});

app.put("/api/note", async (c) => {
  const me = c.get("me");
  const b = await body(c, noteSchema);
  const last = await c.env.DB.prepare("SELECT kind, member_id, created_at FROM activity WHERE trip_id = ? ORDER BY id DESC LIMIT 1")
    .bind(me.trip_id).first<{ kind: string; member_id: string; created_at: number }>();
  // Al escribir se guarda varias veces: solo se apunta una entrada en el historial cada 10 minutos.
  const logIt = !(last && last.kind === "note" && last.member_id === me.id && now() - last.created_at < 600_000);
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO notes (trip_id, body, updated_at, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT (trip_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(me.trip_id, b.body, now(), me.id),
    ...bump(c.env, me, logIt ? "note" : null, {}),
  ]);
  return c.json({ ok: true, rev: await rev(c.env, me.trip_id) });
});

app.put("/api/packing/:item", async (c) => {
  const me = c.get("me"), item = param(c, "item");
  const b = await body(c, packSchema);
  await c.env.DB.prepare(
    `INSERT INTO packing (member_id, item, done, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (member_id, item) DO UPDATE SET done = excluded.done, updated_at = excluded.updated_at`,
  ).bind(me.id, item, b.done ? 1 : 0, now()).run();
  return c.json({ ok: true });
});

/* ---------- Perfil e invitaciones ---------- */

app.patch("/api/me", async (c) => {
  const me = c.get("me");
  const b = await body(c, nameSchema);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE members SET name = ? WHERE id = ?").bind(b.name, me.id),
    ...bump(c.env, me, null, null),
  ]);
  return c.json({ ok: true });
});

/** Genera un enlace nuevo para un miembro (el anterior deja de funcionar). Solo el organizador. */
app.post("/api/members/:id/link", async (c) => {
  const me = c.get("me");
  if (me.role !== "owner") throw new HttpError(403, "forbidden", "Solo el organizador puede hacer esto.");
  const id = c.req.param("id");
  const m = await c.env.DB.prepare("SELECT id FROM members WHERE id = ? AND trip_id = ?").bind(id, me.trip_id).first();
  if (!m) throw new HttpError(404, "not_found", "No existe ese miembro.");
  const token = newToken();
  await c.env.DB.prepare("UPDATE members SET token_hash = ? WHERE id = ?").bind(await sha256(token), id).run();
  return c.json({ token });
});

app.all("/api/*", (c) => c.json({ error: "not_found", message: "No existe." }, 404));

/* ---------- Frontend estático con cabeceras de seguridad ---------- */

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https://upload.wikimedia.org",
  "connect-src 'self' https://commons.wikimedia.org",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

/** Manifiesto con el enlace personal dentro, para que la app instalada entre directamente. */
function manifest(url: URL): Response {
  const k = url.searchParams.get("k") ?? "";
  const start = /^[A-Za-z0-9_-]{20,100}$/.test(k) ? "/?k=" + k : "/";
  const body = {
    name: "Viatge", short_name: "Viatge", description: "Nuestro viaje a Roma y Pompeya",
    start_url: start, scope: "/", display: "standalone", orientation: "portrait",
    background_color: "#F9EEE2", theme_color: "#F7E9DC", lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/manifest+json", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return app.fetch(req, env, ctx);
    if (url.pathname === "/manifest.webmanifest") return manifest(url);
    const res = await env.ASSETS.fetch(req);
    const out = new Response(res.body, res);
    const type = out.headers.get("content-type") ?? "";
    if (type.includes("text/html")) {
      out.headers.set("Content-Security-Policy", CSP);
      out.headers.set("Cache-Control", "no-cache");
    }
    out.headers.set("X-Content-Type-Options", "nosniff");
    out.headers.set("Referrer-Policy", "no-referrer");
    out.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return out;
  },
} satisfies ExportedHandler<Env>;
