import { RabbitQ } from "./rabbitQueue.js";
import { Clickhouse } from "./clickhouse.js";
import { Postgres } from "./postgres.js";

export class DataService {
  #rabbit;
  #clickhouse;
  #pg;
  constructor() {}
  async init() {
    try {
      let rabbitQ = new RabbitQ();
      await rabbitQ.init();
      this.#rabbit = rabbitQ;
      console.log("connected to queue");
    } catch (e) {
      console.log("queue error:", e);
    }
    try {
      let clickhouse = new Clickhouse();
      await clickhouse.init();
      this.#clickhouse = clickhouse;
      console.log("connected to clickhouse");
    } catch (e) {
      console.log("clickhouse error:", e);
    }
    try {
      let pg = new Postgres();
      await pg.init();
      this.#pg = pg;
      console.log("connected to postgres");
    } catch (e) {
      console.log("postgres error:", e);
    }
  }

  async handleEvents(sessionId, eventArr) {
    // if (newSession) {
    //   //create new session
    // } else if (endedSession) {
    //   return; //ignore subsequent messages for ended sessions
    // } else {
    //   //update last received timestamp for session metadata
    // }
    await this.#sendEventMessages(sessionId, eventArr);
  }

  async #sendEventMessages(sessionId, eventArr) {
    for (let i = 0; eventArr.length; i++) {
      let eventStr = JSON.stringify(eventArr[i]);
      let message = { sessionId, event: eventStr };
      await this.#rabbit.sendMessageToQueue(message);
    }
  }

  async startSession(sessionId, timestamp) {
    await this.#clickhouse.startSession(sessionId, timestamp);
  }

  async endSession(sessionId, timestamp) {
    await this.#clickhouse.endSession(sessionId, timestamp);
  }
}
