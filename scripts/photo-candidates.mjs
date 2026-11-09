// Busca fotos candidatas en Wikimedia Commons y las descarga para elegir las mejores.
// Se ejecuta en GitHub Actions (flujo «Buscar fotos»); el resultado va a la rama photo-candidates.
import { mkdir, writeFile } from "node:fs/promises";

const UA = "ViatgeTripApp/1.0 (https://github.com/Jordiwy/viaggio-rp27)";
const OUT = "photo-candidates";
const SETS = {
  carbonara: ["Spaghetti alla carbonara", "spaghetti carbonara"],
  cacio: ["Cacio e pepe", "cacio e pepe"],
  amatriciana: ["Bucatini all'amatriciana", "amatriciana"],
  carciofi: ["Carciofi alla giudia", "carciofi alla giudia"],
  suppli: ["Supplì", "supplì"],
  taglio: ["Pizza al taglio", "pizza al taglio"],
  maritozzo: ["Maritozzi", "maritozzo panna"],
  cornetto: ["Cornetti", "cappuccino cornetto"],
  tiramisu: ["Tiramisu", "tiramisù"],
  gelato: ["Gelato in Italy", "gelato gelateria"],
  margherita: ["Pizza Margherita", "pizza margherita napoletana"],
  fritta: ["Pizza fritta", "pizza fritta Napoli"],
  sfogliatella: ["Sfogliatelle", "sfogliatella riccia"],
  baba: ["Babà", "babà napoletano"],
  salumi: ["Salumi", "tagliere salumi formaggi"],
  castel: ["Castel Sant'Angelo", "Castel Sant'Angelo Tevere"],
  tribunali: ["Via dei Tribunali (Naples)", "Via dei Tribunali Napoli"],
  monti: ["Rione Monti", "Via della Madonna dei Monti"],
};

async function api(params) {
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ format: "json", ...params });
  const r = await fetch(url, { headers: { "user-agent": UA } });
  return r.json();
}
async function search(q) {
  const j = await api({
    action: "query", generator: "search", gsrnamespace: "6", gsrlimit: "25", gsrsearch: q + " filetype:bitmap",
    prop: "imageinfo", iiprop: "url|size|extmetadata|mime", iiurlwidth: "1200",
  });
  return Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
}

await mkdir(OUT, { recursive: true });
const meta = {};
for (const [key, [cat, q]] of Object.entries(SETS)) {
  let pages = await search(`incategory:"${cat}"`);
  if (pages.length < 4) pages = pages.concat(await search(q));
  const ok = pages.filter((p) => {
    const i = p.imageinfo?.[0];
    return i && i.mime === "image/jpeg" && i.width >= 1000 && i.width / i.height > 1.1 && i.width / i.height < 1.9;
  }).slice(0, 6);
  meta[key] = [];
  let n = 0;
  for (const p of ok) {
    const i = p.imageinfo[0], m = i.extmetadata ?? {};
    const res = await fetch(i.thumburl, { headers: { "user-agent": UA } });
    if (!res.ok) continue;
    const file = `${key}-${++n}.jpg`;
    await writeFile(`${OUT}/${file}`, Buffer.from(await res.arrayBuffer()));
    meta[key].push({
      file, title: p.title, page: i.descriptionurl,
      artist: (m.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      license: m.LicenseShortName?.value ?? "",
    });
  }
  console.log(key, meta[key].length);
}
await writeFile(`${OUT}/meta.json`, JSON.stringify(meta, null, 2));
