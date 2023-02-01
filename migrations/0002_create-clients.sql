-- Migration number: 0002 	 2023-01-31T23:38:11.139Z
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT,
  secret TEXT
);
