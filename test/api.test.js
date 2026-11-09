// Pruebas de la API contra un servidor en marcha:  npm run dev  y luego  BASE=http://127.0.0.1:8787 npm test
// Necesitan una base de datos vacía (rm -rf .wrangler && npm run db:migrate:local).
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE || "http://127.0.0.1:8787";
let owner, guest;

async function call(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

test("primer arranque crea el viaje y dos enlaces, solo una vez", async () => {
  const h = await call("GET", "/api/health");
  assert.equal(h.data.needsSetup, true);
  const r = await call("POST", "/api/setup", null, { tripName: "Roma y Pompeya", owner: "Jordi", guest: "Laura" });
  assert.equal(r.status, 201);
  owner = r.data.ownerToken; guest = r.data.guestToken;
  const again = await call("POST", "/api/setup", null, { tripName: "x", owner: "a", guest: "b" });
  assert.equal(again.status, 409);
});

test("sin enlace o con enlace falso no se entra", async () => {
  assert.equal((await call("GET", "/api/state")).status, 401);
  assert.equal((await call("GET", "/api/state", "x".repeat(43))).status, 401);
});

test("cada uno ve su nombre y los dos miembros", async () => {
  const a = await call("GET", "/api/state", owner), b = await call("GET", "/api/state", guest);
  assert.equal(a.data.me.name, "Jordi"); assert.equal(a.data.me.role, "owner");
  assert.equal(b.data.me.name, "Laura"); assert.equal(b.data.me.role, "guest");
  assert.equal(a.data.members.length, 2);
});

test("votos y corazones de uno los ve el otro, y queda en el historial", async () => {
  assert.equal((await call("PUT", "/api/votes/pizza", guest, { option: "sorbillo", label: "Gino e Toto Sorbillo" })).status, 200);
  assert.equal((await call("PUT", "/api/wishes/pantheon", owner, { on: true, label: "Panteón" })).status, 200);
  const s = (await call("GET", "/api/state", owner)).data;
  assert.ok(s.votes.some((v) => v.decision === "pizza" && v.option === "sorbillo"));
  assert.ok(s.wishes.some((w) => w.plan === "pantheon"));
  assert.equal(s.activity[0].kind, "wish");
  assert.equal((await call("PUT", "/api/votes/pizza", guest, { option: null })).status, 200);
  const s2 = (await call("GET", "/api/state", guest)).data;
  assert.ok(!s2.votes.some((v) => v.decision === "pizza"));
});

test("el plan de un día tiene control de versiones", async () => {
  const items = [{ id: "a1", t: "10:00", n: "Panteón", k: "pantheon", lat: 41.8986, lon: 12.4769 }];
  const r1 = await call("PUT", "/api/itinerary/viernes", owner, { items, version: 0 });
  assert.equal(r1.status, 200); assert.equal(r1.data.version, 1);
  const stale = await call("PUT", "/api/itinerary/viernes", guest, { items: [], version: 0 });
  assert.equal(stale.status, 409);
  const r2 = await call("PUT", "/api/itinerary/viernes", guest, { items: [], version: 1 });
  assert.equal(r2.data.version, 2);
  assert.equal((await call("DELETE", "/api/itinerary/viernes", owner)).status, 200);
  assert.equal((await call("PUT", "/api/itinerary/lunes", owner, { items })).status, 400);
});

test("la sincronización responde «sin cambios» si no hay novedades", async () => {
  const s = (await call("GET", "/api/state", owner)).data;
  const again = await call("GET", "/api/state?since=" + s.rev, owner);
  assert.equal(again.data.unchanged, true);
});

test("validación: datos raros se rechazan", async () => {
  assert.equal((await call("PUT", "/api/wishes/Mal%20Plan", owner, { on: true })).status, 400);
  assert.equal((await call("PUT", "/api/votes/cena", owner, { option: "<script>" })).status, 400);
  assert.equal((await call("PUT", "/api/itinerary/jueves", owner, { items: [{ id: "x", t: "1", n: "a", evil: 1 }] })).status, 400);
});

test("la maleta es de cada uno", async () => {
  await call("PUT", "/api/packing/p-dni", guest, { done: true });
  assert.equal((await call("GET", "/api/state", guest)).data.packing["p-dni"], true);
  assert.equal((await call("GET", "/api/state", owner)).data.packing["p-dni"], undefined);
});

test("solo el organizador crea enlaces nuevos, y el viejo deja de valer", async () => {
  const s = (await call("GET", "/api/state", owner)).data;
  const guestId = s.members.find((m) => m.role === "guest").id;
  assert.equal((await call("POST", "/api/members/" + guestId + "/link", guest)).status, 403);
  const r = await call("POST", "/api/members/" + guestId + "/link", owner);
  assert.equal(r.status, 200);
  assert.equal((await call("GET", "/api/state", guest)).status, 401);
  assert.equal((await call("GET", "/api/state", r.data.token)).status, 200);
  guest = r.data.token;
});

test("la sorpresa: cerrada para ella hasta la fecha, editable solo por el organizador", async () => {
  const locked = await call("GET", "/api/surprise", guest);
  assert.equal(locked.data.locked, true);
  assert.equal(locked.data.place, undefined);                       // el servidor no manda el contenido
  const own = await call("GET", "/api/surprise", owner);
  assert.equal(own.data.locked, false); assert.equal(own.data.isOwner, true);
  assert.equal((await call("PUT", "/api/surprise", guest, { title: "x", place: "y", address: "", time: "", dress: "", body: "" })).status, 403);
  assert.equal((await call("POST", "/api/surprise/reaction", guest, { reaction: "love" })).status, 423);
  const put = await call("PUT", "/api/surprise", owner, { title: "Cena", place: "Aroma", address: "Via Labicana 125", time: "Viernes", dress: "Elegante", body: "Hola", unlockAt: Date.now() - 1000 });
  assert.equal(put.status, 200);
  const open = await call("GET", "/api/surprise", guest);
  assert.equal(open.data.place, "Aroma");
  assert.equal((await call("POST", "/api/surprise/reaction", guest, { reaction: "change", note: "Mejor pizza" })).status, 200);
  const seen = await call("GET", "/api/surprise", owner);
  assert.equal(seen.data.reaction.reaction, "change"); assert.equal(seen.data.reaction.note, "Mejor pizza");
});
