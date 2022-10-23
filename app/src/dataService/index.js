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

  async handleEvents(sessionId, eventArr, originHost) {
    let metadata = await this.#getSessionMetadata(sessionId);
    if (this.#isNewSession(metadata)) {
      //create new session
      await this.#createNewSession(sessionId, eventArr[0], originHost);
    } else if (this.#isEndedSession(metadata)) {
      //ignore subsequent messages for ended sessions
      return;
    } else {
      //update last received timestamp for session metadata
      await this.#updateMostRecentEventTime(
        sessionId,
        eventArr[eventArr.length - 1]
      );
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

  async #updateMostRecentEventTime(sessionId, event) {
    let mostRecentEventTime = event.timestamp;
    await this.#pg.updateMostRecentEventTime(sessionId, mostRecentEventTime);
  }

  async #createNewSession(sessionId, event, originHost) {
    let startTime = event.timestamp;
    let mostRecentEventTime = Date.now();
    await this.#pg.createNewSession(
      sessionId,
      startTime,
      mostRecentEventTime,
      originHost
    );
  }

  async startSession(sessionId, timestamp) {
    await this.#clickhouse.startSession(sessionId, timestamp);
  }

  async endSession(sessionId, timestamp) {
    await this.#clickhouse.endSession(sessionId, timestamp);
  }
}
