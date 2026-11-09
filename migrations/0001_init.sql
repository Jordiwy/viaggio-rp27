-- Viatge · esquema inicial
-- Un viaje (trip) con sus miembros. Cada miembro entra con un enlace personal;
-- en la base de datos solo se guarda el hash SHA-256 de su token.

CREATE TABLE trips (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  rev         INTEGER NOT NULL DEFAULT 0,      -- sube con cada cambio: sirve para sincronizar
  created_at  INTEGER NOT NULL
);

CREATE TABLE members (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'guest')),
  color       TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  last_seen   INTEGER
);
CREATE INDEX members_trip ON members(trip_id);

-- Plan de cada día, compartido. Si no hay fila, se usa el plan original.
CREATE TABLE itinerary (
  trip_id     TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day         TEXT NOT NULL CHECK (day IN ('jueves', 'viernes', 'sabado', 'domingo')),
  items       TEXT NOT NULL,                   -- JSON
  version     INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL,
  updated_by  TEXT REFERENCES members(id),
  PRIMARY KEY (trip_id, day)
);

-- Votos: uno por persona y decisión.
CREATE TABLE votes (
  trip_id     TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  decision    TEXT NOT NULL,
  option      TEXT NOT NULL,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (member_id, decision)
);
CREATE INDEX votes_trip ON votes(trip_id);

-- Planes que le apetecen a cada uno (corazón).
CREATE TABLE wishes (
  trip_id     TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (member_id, plan)
);
CREATE INDEX wishes_trip ON wishes(trip_id);

-- Notas compartidas.
CREATE TABLE notes (
  trip_id     TEXT PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  updated_at  INTEGER NOT NULL,
  updated_by  TEXT REFERENCES members(id)
);

-- Maleta: cada uno la suya.
CREATE TABLE packing (
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  item        TEXT NOT NULL,
  done        INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (member_id, item)
);

-- Historial de cambios para la sección «Novedades».
CREATE TABLE activity (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id     TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  member_id   TEXT REFERENCES members(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL,
  data        TEXT NOT NULL,                   -- JSON
  created_at  INTEGER NOT NULL
);
CREATE INDEX activity_trip ON activity(trip_id, id DESC);
