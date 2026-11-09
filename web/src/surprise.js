/* La noche sorpresa: cerrada hasta la fecha que decide el servidor. */
import Sync from "./sync.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (t) => new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "Europe/Madrid" });
const daysTo = (t) => Math.max(0, Math.ceil((t - Date.now()) / 864e5));

let data = null, revealed = false;
const seal = $("seal"), msg = $("seal-msg"), box = $("reveal");
const teasers = ["Todavía no. Paciencia.", "Nada de trampas.", "Un poco más…"];
let ti = 0;

async function load() {
  try { data = await Sync.api("GET", "/api/surprise"); } catch { return; }
  paint();
}

function shake(text) {
  seal.classList.remove("shake"); void seal.offsetWidth; seal.classList.add("shake");
  msg.textContent = text;
}

function paint() {
  if (!data) return;
  const owner = !!data.isOwner;
  if (data.locked) {
    const d = daysTo(data.unlockAt);
    msg.textContent = `Se abre el ${fmtDate(data.unlockAt)}` + (d > 0 ? ` · faltan ${d} ${d === 1 ? "día" : "días"}` : "");
    box.hidden = true;
    return;
  }
  if (owner) {
    msg.textContent = data.open ? "Ya la puede ver." : `Ella la verá el ${fmtDate(data.unlockAt)}.`;
  } else {
    msg.textContent = revealed ? "" : "Ya se puede abrir. Toca el sello.";
  }
  if (revealed || owner) renderCard(owner);
}

function card(d) {
  const maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(d.place + ", " + d.address);
  return `
    <span class="kicker">${esc(d.time)}</span>
    <h3 class="reveal-t">${esc(d.title)}</h3>
    <p class="reveal-place"><b>${esc(d.place)}</b><br>${esc(d.address)}</p>
    <p class="reveal-body">${esc(d.body)}</p>
    <p class="reveal-dress"><b>Qué ponerse:</b> ${esc(d.dress)}</p>
    <a class="btn" href="${maps}" target="_blank" rel="noopener">Ver en el mapa ↗</a>`;
}

function renderCard(owner) {
  box.hidden = false;
  if (!owner) {
    const r = data.reaction;
    box.innerHTML = card(data) + `
      <div class="reveal-react">
        <p class="reveal-q">¿Te gusta el plan?</p>
        <div class="gate-row">
          <button type="button" class="gate-btn" data-r="love" aria-pressed="${r?.reaction === "love"}">Me encanta</button>
          <button type="button" class="gate-btn ghost" data-r="change" aria-pressed="${r?.reaction === "change"}">Prefiero cambiarlo</button>
        </div>
        <label class="reveal-note" ${r?.reaction === "change" ? "" : "hidden"}>¿Qué te apetecería más?<textarea rows="3" maxlength="600">${esc(r?.note || "")}</textarea></label>
        <button type="button" class="btn reveal-send" ${r?.reaction === "change" ? "" : "hidden"}>Enviar</button>
        <p class="reveal-ok" role="status">${r ? (r.reaction === "love" ? "Se lo has dicho: te encanta." : "Se lo has dicho. Hay tiempo de sobra para cambiarlo.") : ""}</p>
      </div>`;
    const note = box.querySelector(".reveal-note"), send = box.querySelector(".reveal-send");
    const post = async (reaction) => {
      try {
        await Sync.api("POST", "/api/surprise/reaction", { reaction, note: reaction === "change" ? box.querySelector("textarea").value : undefined });
        await load();
      } catch { box.querySelector(".reveal-ok").textContent = "No se ha podido enviar. Prueba otra vez."; }
    };
    box.querySelector('[data-r="love"]').onclick = () => post("love");
    box.querySelector('[data-r="change"]').onclick = () => { note.hidden = false; send.hidden = false; box.querySelector("textarea").focus(); };
    send.onclick = () => post("change");
    return;
  }
  // Organizador: vista previa, respuesta de ella y edición.
  const r = data.reaction, guest = (Sync.state?.members || []).find((m) => m.role !== "owner");
  const who = guest ? guest.name : "Ella";
  const react = r
    ? `<p class="reveal-answer ${r.reaction}">${r.reaction === "love" ? `A ${esc(who)} le encanta.` : `${esc(who)} prefiere cambiarlo.`}${r.note ? `<br><i>«${esc(r.note)}»</i>` : ""}</p>`
    : `<p class="reveal-answer">${data.open ? `${esc(who)} todavía no ha dicho nada.` : `Así lo verá ${esc(who)} el ${fmtDate(data.unlockAt)}.`}</p>`;
  box.innerHTML = react + `<div class="reveal-preview">${card(data)}</div>` + (data.draft ? `<p class="reveal-hint">Es un borrador: revisa los datos y guárdalos.</p>` : "") + `
    <details class="reveal-edit" ${data.draft ? "open" : ""}><summary>Editar la sorpresa</summary>
      <form class="gate-form" id="sp-form">
        <label>Título<input name="title" maxlength="80" required></label>
        <label>Sitio<input name="place" maxlength="80" required></label>
        <label>Dirección<input name="address" maxlength="160"></label>
        <label>Cuándo<input name="time" maxlength="40"></label>
        <label>Qué ponerse<input name="dress" maxlength="160"></label>
        <label>Mensaje<textarea name="body" rows="5" maxlength="2000"></textarea></label>
        <label>Se abre el día<input name="unlock" type="date"></label>
        <button class="gate-btn" type="submit">Guardar</button>
        <p class="reveal-ok" role="status"></p>
      </form>
    </details>`;
  const f = box.querySelector("#sp-form");
  for (const k of ["title", "place", "address", "time", "dress", "body"]) f.elements[k].value = data[k] || "";
  f.elements.unlock.value = new Date(data.unlockAt).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f));
    const unlockAt = v.unlock ? Date.parse(v.unlock + "T00:00:00+01:00") : undefined;
    try {
      await Sync.api("PUT", "/api/surprise", { title: v.title, place: v.place, address: v.address, time: v.time, dress: v.dress, body: v.body, unlockAt });
      await load();
      box.querySelector(".reveal-edit")?.removeAttribute("open");
      box.querySelector(".reveal-answer")?.insertAdjacentHTML("afterend", '<p class="reveal-ok" role="status">Guardado.</p>');
    } catch (x) { f.querySelector(".reveal-ok").textContent = x.message || "No se ha podido guardar."; }
  };
}

seal.addEventListener("click", () => {
  if (!data || data.locked) { shake(teasers[ti++ % teasers.length]); setTimeout(paint, 1800); return; }
  if (data.isOwner) { box.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  revealed = true; seal.classList.add("opened"); paint();
  box.classList.add("in");
});

Sync.on("state", load);
load();
