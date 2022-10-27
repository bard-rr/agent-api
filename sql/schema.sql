DROP DATABASE IF EXISTS bard;
CREATE DATABASE bard;

\c bard

CREATE TABLE IF NOT EXISTS pending_sessions (
  session_id text PRIMARY KEY,
  start_time bigint NOT NULL,
  origin_host text NOT NULL,
  most_recent_event_time bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS funnels (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at_ms bigint NOT NULL,
  last_modified_at_ms bigint NOT NULL,
  funnel JSONB NOT NULL
);