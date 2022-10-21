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
    let metadata = await this.#getSessionMetadata(sessionId);
    if (this.#isNewSession(metadata)) {
      //create new session
      await this.#createNewSession(sessionId, eventArr[0]);
    } else if (this.#isEndedSession(metadata)) {
      //ignore subsequent messages for ended sessions
      return;
    } else {
      //update last received timestamp for session metadata
      await this.#updateMetadataTimestamp(sessionId);
    }
    await this.#sendEventMessages(sessionId, eventArr);
  }

  async #sendEventMessages(sessionId, eventArr) {
    for (let i = 0; eventArr.length; i++) {
      let eventStr = JSON.stringify(eventArr[i]);
      let message = { sessionId, event: eventStr };
      await this.#rabbit.sendMessageToQueue(message);
    }
  }

  async #getSessionMetadata(sessionId) {
    let pgMetadata = await this.#pg.getSessionMetadata(sessionId);
    let chMetadata = await this.#clickhouse.getSessionMetadata(sessionId);
    let isInPg = pgMetadata ? true : false;
    let isInCh = chMetadata.length !== 0 ? true : false;
    return { isInPg, isInCh, ...pgMetadata };
  }

  #isNewSession(metadata) {
    return metadata.isInPg === false && metadata.isInCh === false;
  }

  #isEndedSession(metadata) {
    return metadata.isInCh === true;
  }

  async #updateMetadataTimestamp(sessionId) {
    let lastEventTimestamp = Date.now();
    await this.#pg.updateMetadataTimestamp(sessionId, lastEventTimestamp);
  }

  async #createNewSession(sessionId, event) {
    let startTime = event.timestamp;
    let lastEventTimestamp = Date.now();
    await this.#pg.createNewSession(sessionId, startTime, lastEventTimestamp);
  }

  async startSession(sessionId, timestamp) {
    await this.#clickhouse.startSession(sessionId, timestamp);
  }

  async endSession(sessionId, timestamp) {
    await this.#clickhouse.endSession(sessionId, timestamp);
  }
}
