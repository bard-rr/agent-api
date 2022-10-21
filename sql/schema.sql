DROP DATABASE IF EXISTS bard;
CREATE DATABASE bard;

\c bard

CREATE TABLE session_metadata (
  id text PRIMARY KEY,
  startTime bigint NOT NULL,
  endTime bigint,
  lastEventTimestamp bigint NOT NULL,
  complete bool
)