import { z } from "zod";

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

export type Member = {
  id: string;
  trip_id: string;
  name: string;
  role: "owner" | "guest";
  color: string;
  last_seen: number | null;
};

export const DAYS = ["jueves", "viernes", "sabado", "domingo"] as const;
export const COLORS = ["#B5533B", "#3D6E7E", "#8E6620", "#55703F"];

/* ---------- Tokens ---------- */

export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return prefix + "_" + [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- Validación ---------- */

const key = z.string().regex(/^[a-z0-9_-]{1,40}$/, "clave no válida");
export const keySchema = key;

const text = (max: number) => z.string().trim().max(max);

export const itemSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
    t: text(10),
    n: text(120).min(1),
    p: text(400).optional(),
    k: key.optional(),
    fx: z.literal(1).optional(),
    hl: z.literal(1).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    q: text(160).optional(),
    dx: z.number().min(-60).max(60).optional(),
    dy: z.number().min(-60).max(60).optional(),
    a: z.enum(["start", "middle", "end"]).optional(),
  })
  .strict();

export const itinerarySchema = z.object({
  items: z.array(itemSchema).max(40),
  version: z.number().int().min(0).optional(),
  summary: text(160).optional(),
});

export const voteSchema = z.object({ option: key.nullable(), label: text(120).optional() });
export const wishSchema = z.object({ on: z.boolean(), label: text(120).optional() });
export const noteSchema = z.object({ body: z.string().max(4000) });
export const packSchema = z.object({ done: z.boolean() });
export const nameSchema = z.object({ name: text(40).min(1) });
export const setupSchema = z.object({
  tripName: text(60).min(1),
  owner: text(40).min(1),
  guest: text(40).min(1),
});

export const surpriseSchema = z.object({
  title: text(80).min(1),
  place: text(80).min(1),
  address: text(160),
  time: text(40),
  dress: text(160),
  body: z.string().trim().max(2000),
  unlockAt: z.number().int().min(0).optional(),
});
export const reactionSchema = z.object({ reaction: z.enum(["love", "change"]), note: z.string().trim().max(600).optional() });

/** 1 de enero de 2027, 00:00 en Madrid. */
export const DEFAULT_UNLOCK = Date.parse("2027-01-01T00:00:00+01:00");
export const SURPRISE_DRAFT = {
  title: "Cena de gala con el Coliseo delante",
  place: "Aroma",
  address: "Palazzo Manfredi, Via Labicana 125, Roma",
  time: "Viernes 26 · salimos de casa a las 19:30",
  dress: "Elegante. Un abrigo bonito: por la noche refresca.",
  body: "Una terraza en lo alto del Palazzo Manfredi, con el Coliseo iluminado justo delante. Cocina italiana de estrella Michelin y un menú degustación para tomarlo con calma. Si no te apetece o prefieres otra cosa, dímelo aquí abajo: hay tiempo de sobra para cambiarlo.",
};
