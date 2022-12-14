import { RabbitQ } from "./rabbitQueue.js";
import { Clickhouse } from "./clickhouse.js";
import { Postgres } from "./postgres.js";

export class DataService {
  #rabbit;
  #clickhouse;
  #pg;
  constructor() { }
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

  async handleEvents(sessionId, eventArr, appName, MAX_IDLE_TIME) {
    let metadata = await this.#getSessionMetadata(sessionId);
    if (this.#isNewSession(metadata)) {
      await this.#createNewSession(sessionId, eventArr[0], appName, MAX_IDLE_TIME);
    } else if (this.#isEndedSession(metadata)) {
      //ignore subsequent messages for ended sessions
      return;
    }

    await this.#updateMostRecentEventTime(
      sessionId,
      eventArr[eventArr.length - 1]
    );
    await this.#updateErrorCount(sessionId, eventArr);
    await this.#sendEventMessages(sessionId, eventArr);
  }

  async #updateErrorCount(sessionId, eventArr) {
    const numberOfNewErrors = this.#getNumberOfErrors(eventArr);
    if (numberOfNewErrors > 0) {
      await this.#incrementErrorCount(sessionId, numberOfNewErrors);
    }
  }

  #getNumberOfErrors(eventArr) {
    return eventArr.filter(this.#isError).length;
  }

  #isError(event) {
    return event.type === 6 && event.data.payload.level === "error";
  }

  async #incrementErrorCount(sessionId, numberOfNewErrors) {
    await this.#pg.incrementErrorCount(sessionId, numberOfNewErrors);
  }

  async #sendEventMessages(sessionId, eventArr) {
    for (let i = 0; i < eventArr.length; i++) {
      let event = eventArr[i];
      if (event.conversionData) {
        await this.#handleConversionData(sessionId, event);
      }
      let eventStr = JSON.stringify(event);
      let message = { sessionId, event: eventStr };
      await this.#rabbit.sendMessageToQueue(message);
    }
  }

  async #handleConversionData(sessionId, event) {
    switch (event.conversionData.eventType) {
      case "click":
        await this.#handleClickEvent(sessionId, event);
        break;
      case "custom":
        await this.#handleCustomEvent(sessionId, event);
        break;
      default:
        return;
    }
  }

  async #handleClickEvent(sessionId, clickEvent) {
    await this.#clickhouse.saveClickEvent(sessionId, clickEvent);
  }

  async #handleCustomEvent(sessionId, customEvent) {
    await this.#clickhouse.saveCustomEvent(sessionId, customEvent);
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

  async #createNewSession(sessionId, event, appName, MAX_IDLE_TIME) {
    let startTime = event.timestamp;
    let mostRecentEventTime = Date.now();
    await this.#pg.createNewSession(
      sessionId,
      startTime,
      mostRecentEventTime,
      appName,
      MAX_IDLE_TIME,
    );
  }

  async startSession(sessionId, timestamp) {
    await this.#clickhouse.startSession(sessionId, timestamp);
  }

  async endSession(sessionId, timestamp) {
    await this.#clickhouse.endSession(sessionId, timestamp);
  }
}
