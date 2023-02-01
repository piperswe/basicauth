-- Migration number: 0000 	 2023-01-31T21:55:34.566Z
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  passwordHash TEXT NOT NULL
);

CREATE INDEX users_username_idx ON users (username);
