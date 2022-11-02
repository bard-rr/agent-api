import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
dotenv.config();

/*
pg Client expects an env file with the following fields
  PGUSER
  PGPASSWORD
  PGHOST
  PGDATABASE
  PGPORT
*/

export class Postgres {
  #client;
  constructor() { }
  async init() {
    this.#client = new Client();
    await this.#client.connect();
  }

  async getSessionMetadata(sessionId) {
    let sql = `SELECT * FROM pending_sessions WHERE session_id=$1`;
    let result = await this.#executeQuery(sql, [sessionId]);
    return result.rows[0];
  }

  async createNewSession(
    sessionId,
    startTime,
    mostRecentEventTime,
    originHost,
    MAX_IDLE_TIME
  ) {
    let sql = `INSERT INTO pending_sessions
                (session_id, start_time, most_recent_event_time, origin_host, max_idle_time)
                VALUES
                ($1, $2, $3, $4, $5)
              `;
    await this.#executeQuery(sql, [
      sessionId,
      startTime,
      mostRecentEventTime,
      originHost,
      MAX_IDLE_TIME
    ]);
  }

  async updateMostRecentEventTime(sessionId, mostRecentEventTime) {
    let sql = `UPDATE pending_sessions
               SET most_recent_event_time = $1
               WHERE session_id=$2
              `;
    await this.#executeQuery(sql, [mostRecentEventTime, sessionId]);
  }

  async incrementErrorCount(sessionId, numberOfNewErrors) {
    let sql = `UPDATE pending_sessions
               SET error_count = error_count + $1
               WHERE session_id=$2
              `;
    await this.#executeQuery(sql, [numberOfNewErrors, sessionId]);
  }

  async #executeQuery(queryStr, queryParamsArr = []) {
    try {
      return await this.#client.query(queryStr, queryParamsArr);
    } catch (error) {
      throw new Error(error);
    }
  }
}
