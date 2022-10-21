import { createClient } from "@clickhouse/client";

export class Clickhouse {
  constructor() {
    this.client = {};
  }

  async init() {
    //create a client to interface with clickhouse
    this.client = createClient({
      username: "default",
      password: "",
    });
    //creates a clickhouse db
    await this.client.exec({
      query: `CREATE DATABASE IF NOT EXISTS eventDb;`,
    });
    //create a queryable table. note that Primary Keys don't need to be unique among rows
    await this.client.exec({
      query: `
        CREATE TABLE IF NOT EXISTS eventDb.eventTable
        (sessionId String, event String)
        ENGINE = MergeTree()
        PRIMARY KEY (sessionId)
      `,
    });

    //this creates a clickhouse table that listens for messages sent to the provided
    //rabbitMQ exchange. We use a materialize view to take messages from this table
    //and place them into our queryable table without 'reading' them from the queue.
    await this.client.exec({
      query: `
        CREATE TABLE IF NOT EXISTS eventDb.eventQueue
        (sessionId String, event String)
        ENGINE = RabbitMQ SETTINGS
          rabbitmq_address = 'amqp://localhost:5672',
          rabbitmq_exchange_name = 'test-exchange',
          rabbitmq_format = 'JSONEachRow'
      `,
    });

    //create a materialized view to populate the queryable table
    await this.client.exec({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS eventDb.consumer TO eventDb.eventTable
        AS SELECT * FROM eventDb.eventQueue
       `,
    });

    //create a table to store session information. Might need to do
    //some finagling with the date-related things on the way out
    await this.client.exec({
      query: `
        CREATE TABLE IF NOT EXISTS eventDb.sessionTable
        (
          sessionId String, 
          startTime UInt64, 
          endTime UInt64, 
          lengthMs UInt64,
          date Date,
          complete Bool
        )
        ENGINE = MergeTree()
        PRIMARY KEY (sessionId)
      `,
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

  async startNewSession(sessionId, timestamp) {
    let sessionArr = await this.getOneSession(sessionId);
    if (sessionArr.length !== 0) {
      throw new Error("Attempted to start a session that already exists");
    }
    let date = this.buildDate(timestamp);
    let query = `
      INSERT INTO eventDb.sessionTable 
      (sessionId, startTime, date, complete)
      VALUES 
      ('${sessionId}', ${timestamp}, '${date}', ${false})
    `;
    await this.client.exec({ query });
  }

  // TODO: clickhouse REALLY doesn't like it when you update the data inside it...
  // may need to rethink how we store this kind of queryable session info...
  async endSession(sessionId, endTimestamp) {
    let sessionArr = await this.getOneSession(sessionId);
    if (sessionArr.length === 0) {
      throw new Error("attempted to end a session that doesn't exist");
    }

    let startTimestamp = sessionArr[0].startTime;
    let lengthMs = endTimestamp - startTimestamp;

    let query = `
      ALTER TABLE eventDb.sessionTable
      UPDATE endTime=${endTimestamp},
      complete=${true},
      lengthMs=${lengthMs}
      WHERE sessionId='${sessionId}'
    `;
    await this.client.exec({ query });
  }

  async getSessionMetadata(sessionId) {
    let query = `SELECT * FROM eventDb.sessionTable WHERE sessionId='${sessionId}'`;
    let resultSet = await this.client.query({
      query,
      format: "JSONEachRow",
    });
    let dataSet = await resultSet.json();
    return dataSet;
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
  //TODO: lock the code that executes SQL behind private functions.
}
