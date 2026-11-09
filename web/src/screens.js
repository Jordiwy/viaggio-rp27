/* Pantallas de la app: una cada vez, con la barra de abajo y el botón atrás del móvil. */
const SCREENS = ["inicio", "plan", "explorar", "decidir", "mas"];
const scrolls = {};
let current = null;

function show(name, target) {
  if (current && current !== name) scrolls[current] = window.scrollY;
  for (const el of document.querySelectorAll(".screen")) el.hidden = el.dataset.screen !== name;
  for (const a of document.querySelectorAll(".appbar a")) {
    const on = a.dataset.screen === name;
    a.classList.toggle("on", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  }
  const changed = current !== name;
  current = name;
  if (name === "plan" && window.__onDay) {
    const sel = document.querySelector('.tabs [role="tab"][aria-selected="true"]');
    if (sel) window.__onDay(sel.getAttribute("aria-controls"));
  }
  requestAnimationFrame(() => {
    if (target) target.scrollIntoView({ block: "start" });
    else if (changed) window.scrollTo(0, scrolls[name] || 0);
  });
}

function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (/^(ver|info)-/.test(h)) return;                 // fichas: se abren encima de la pantalla actual
  if (!h) return show("inicio");
  if (SCREENS.includes(h)) return show(h);
  const el = document.getElementById(h);
  const scr = el && el.closest(".screen");
  if (scr) show(scr.dataset.screen, /^(jueves|viernes|sabado|domingo)$/.test(h) ? null : el);
}

addEventListener("hashchange", route);
// La barra de abajo siempre lleva al principio de la pantalla si ya estás en ella.
for (const a of document.querySelectorAll(".appbar a")) {
  a.addEventListener("click", (e) => {
    if (a.dataset.screen === current && location.hash === "#" + current) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });
}

/* Explorar: Planes | Comida */
const segs = [...document.querySelectorAll(".seg-b")];
for (const b of segs) {
  b.addEventListener("click", () => {
    for (const x of segs) {
      const on = x === b;
      x.setAttribute("aria-selected", on);
      document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
    }
  });
}

document.getElementById("mas-perfil")?.addEventListener("click", () => document.getElementById("me-btn").click());

route();
