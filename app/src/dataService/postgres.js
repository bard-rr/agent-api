import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
dotenv.config();

export class Postgres {
  #client;
  constructor() {}
  async init() {
    this.#client = new Client();
    await this.#client.connect();
  }

  async getSessionMetadata(sessionId) {
    let sql = `SELECT * FROM session_metadata WHERE session_id='${sessionId}'`;
    let result = await this.#executeQuery(sql);
    return result.rows[0];
  }

  async createNewSession(sessionId, startTime, lastEventTimestamp) {
    let sql = `INSERT INTO session_metadata 
                (session_id, start_time, last_event_timestamp) 
                VALUES 
                ('${sessionId}', ${startTime}, ${lastEventTimestamp})
              `;
    await this.#executeQuery(sql);
  }

  async updateMetadataTimestamp(sessionId, lastEventTimestamp) {
    let sql = `UPDATE session_metadata 
               SET last_event_timestamp = ${lastEventTimestamp}
               WHERE session_id='${sessionId}'
              `;
    await this.#executeQuery(sql);
  }

  async #executeQuery(queryStr) {
    return await this.#client.query(queryStr);
  }
}
