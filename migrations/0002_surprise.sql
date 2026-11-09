-- La noche sorpresa: el organizador la escribe y el resto la ve a partir de unlock_at.
CREATE TABLE surprise (
  trip_id       TEXT PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  place         TEXT NOT NULL,
  address       TEXT NOT NULL,
  time          TEXT NOT NULL,
  dress         TEXT NOT NULL,
  body          TEXT NOT NULL,
  unlock_at     INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  reaction      TEXT CHECK (reaction IN ('love', 'change')),
  reaction_note TEXT,
  reacted_by    TEXT REFERENCES members(id),
  reacted_at    INTEGER
);
