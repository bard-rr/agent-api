DROP DATABASE IF EXISTS bard;
CREATE DATABASE bard;

\c bard
-- TODO: think about how we know a session is complete. 
CREATE TABLE session_metadata (
  session_id text PRIMARY KEY,
  start_time bigint NOT NULL,
  end_time bigint,
  last_event_timestamp bigint NOT NULL
);