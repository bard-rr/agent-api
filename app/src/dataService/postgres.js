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
  constructor() {}
  async init() {
    this.#client = new Client();
    await this.#client.connect();
  }

  async getSessionMetadata(sessionId) {
    let sql = `SELECT * FROM pending_sessions WHERE session_id='${sessionId}'`;
    let result = await this.#executeQuery(sql);
    return result.rows[0];
  }

  async createNewSession(
    sessionId,
    startTime,
    mostRecentEventTime,
    originHost
  ) {
    let sql = `INSERT INTO pending_sessions 
                (session_id, start_time, most_recent_event_time, origin_host) 
                VALUES 
                ('${sessionId}', ${startTime}, ${mostRecentEventTime}, '${originHost}')
              `;
    await this.#executeQuery(sql);
  }

  async updateMostRecentEventTime(sessionId, mostRecentEventTime) {
    let sql = `UPDATE pending_sessions 
               SET most_recent_event_time = ${mostRecentEventTime}
               WHERE session_id='${sessionId}'
              `;
    await this.#executeQuery(sql);
  }

  async #executeQuery(queryStr) {
    return await this.#client.query(queryStr);
  }
}
