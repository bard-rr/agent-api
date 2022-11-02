import { createClient } from "@clickhouse/client";

export class Clickhouse {
  #client;
  constructor() {
    this.#client = {};
  }

  async init() {
    //create a client to interface with clickhouse
    this.#client = createClient({
      // eslint-disable-next-line no-undef
      host: `http://${process.env.CLICKHOUSE_HOST}:8123`,
      username: "default",
      password: "",
    });
  }

  //data is an array of objects with a sessionId and event property.
  //both contain strings. we need to parse the json string in the event property
  //into a json object
  processData(dataSet) {
    return dataSet.map((row) => {
      return { ...row, event: JSON.parse(row.event) };
    });
  }

  async getSessionMetadata(sessionId) {
    let query = `SELECT * FROM eventDb.sessionTable WHERE sessionId={sessionId: String}`;
    let query_params = { sessionId };
    let resultSet = await this.#clientQuery(query, query_params);
    if (resultSet) {
      let dataSet = await resultSet.json();
      return dataSet;
    } else {
      return [];
    }
  }

  //accepts a timestamp in milliseconds. converts it to a string
  //in the format of yyyy-mm-dd compatable with the ch Date type
  buildDate(timestamp) {
    let dateObj = new Date(timestamp);
    let day = dateObj.getUTCDate();
    let month = dateObj.getUTCMonth() + 1;
    let year = dateObj.getUTCFullYear();
    let finalDate = `${year.toString()}-${month.toString()}-${day.toString()}`;
    return finalDate;
  }

  async saveClickEvent(sessionId, clickEvent) {
    let textContent = clickEvent.conversionData.textContent;
    let query_params = { sessionId, textContent };
    let query = `INSERT INTO eventDb.conversionEvents
    (sessionId, eventType, textContent, timestamp)
    VALUES
    ({sessionId: String}, 'click', {textContent:String}, ${clickEvent.timestamp})`;
    await this.#clientExec(query, query_params);
  }

  async saveCustomEvent(sessionId, customEvent) {
    let query_params = {
      sessionId,
      customEventType: customEvent.conversionData.customEventType,
    };
    let query = `INSERT INTO eventDb.conversionEvents
    (sessionId, eventType, customEventType, timestamp)
    VALUES
    ({sessionId: String}, 'custom', {customEventType: String}, ${customEvent.timestamp})`;
    await this.#clientExec(query, query_params);
  }

  //TODO: lock the code that executes SQL behind private functions.
  async #clientExec(query, query_params) {
    await this.#client.exec({ query, query_params });
  }

  async #clientQuery(query, query_params, format = "JSONEachRow") {
    await this.#client.query({ query, query_params, format });
  }
}
