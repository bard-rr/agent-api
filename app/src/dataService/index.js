import { RabbitQ } from "./rabbitQueue.js";
import { Clickhouse } from "./clickhouse.js";
import { Postgres } from "./postgres.js";

export class DataService {
  constructor() {}
  async init() {
    try {
      let rabbitQ = new RabbitQ();
      await rabbitQ.init();
      this.rabbit = rabbitQ;
      console.log("connected to queue");
    } catch (e) {
      console.log("queue error:", e);
    }
    try {
      let clickhouse = new Clickhouse();
      await clickhouse.init();
      this.clickhouse = clickhouse;
      console.log("connected to clickhouse");
    } catch (e) {
      console.log("clickhouse error:", e);
    }
    try {
      let pg = new Postgres();
      await pg.init();
      this.pg = pg;
      console.log("connected to postgres");
    } catch (e) {
      console.log("postgres error:", e);
    }
  }

  async sendEventMessage(sessionId, eventObj) {
    //clickhouse expects a string for the event: not a json object.
    let eventStr = JSON.stringify(eventObj);
    let message = { sessionId, event: eventStr };
    await this.rabbit.sendMessageToQueue(message);
  }

  async startSession(sessionId, timestamp) {
    await this.clickhouse.startSession(sessionId, timestamp);
  }

  async endSession(sessionId, timestamp) {
    await this.clickhouse.endSession(sessionId, timestamp);
  }
}
