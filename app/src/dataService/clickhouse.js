import { createClient } from "@clickhouse/client";

export class Clickhouse {
  #client;
  constructor() {
    this.#client = {};
  }

  async init() {
    //create a client to interface with clickhouse
    this.#client = createClient({
      username: "default",
      password: "",
    });
    //creates a clickhouse db
    await this.#clientExec(`CREATE DATABASE IF NOT EXISTS eventDb;`);

    await this.#clientExec(
      `
        CREATE TABLE IF NOT EXISTS eventDb.conversionEvents
          (
            sessionId String,
            eventType String,
            textContent Nullable(String),
            customEventType Nullable(String),
            timestamp UInt64
          )
        ENGINE = MergeTree()
        PRIMARY KEY (sessionId, eventType)
      `
    );

    //create a queryable table. note that Primary Keys don't need to be unique among rows
    await this.#clientExec(
      `
        CREATE TABLE IF NOT EXISTS eventDb.eventTable
        (sessionId String, event String)
        ENGINE = MergeTree()
        PRIMARY KEY (sessionId)
      `
    );

    //this creates a clickhouse table that listens for messages sent to the provided
    //rabbitMQ exchange. We use a materialize view to take messages from this table
    //and place them into our queryable table without 'reading' them from the queue.
    await this.#clientExec(
      `
        CREATE TABLE IF NOT EXISTS eventDb.eventQueue
        (sessionId String, event String)
        ENGINE = RabbitMQ SETTINGS
          rabbitmq_address = 'amqp://localhost:5672',
          rabbitmq_exchange_name = 'test-exchange',
          rabbitmq_format = 'JSONEachRow'
      `
    );

    //create a materialized view to populate the queryable table
    await this.#clientExec(
      `
        CREATE MATERIALIZED VIEW IF NOT EXISTS eventDb.consumer TO eventDb.eventTable
        AS SELECT * FROM eventDb.eventQueue
       `
    );

    //create a table to store session information. Might need to do
    //some finagling with the date-related things on the way out
    await this.#clientExec(
      `
        CREATE TABLE IF NOT EXISTS eventDb.sessionTable
        (
          sessionId String,
          startTime UInt64,
          endTime UInt64,
          lengthMs UInt64,
          date Date,
          originHost String,
          errorCount UInt64
        )
        ENGINE = MergeTree()
        PRIMARY KEY (sessionId)
      `
    );
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
