-- Migration number: 0001 	 2023-01-31T22:08:21.864Z
CREATE TABLE jwks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  valid INTEGER DEFAULT TRUE NOT NULL, -- Boolean
  created INTEGER NOT NULL, -- Timestamp
  publicKey TEXT,
  privateKey TEXT,
  alg TEXT
);

CREATE INDEX jwks_valid_created_idx ON jwks (valid ASC, created);
