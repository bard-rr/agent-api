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
          rabbitmq_host_port = 'localhost:5672',
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
          startTime DateTime64(3, 'Etc/UTC'), 
          endTime DateTime64(3, 'Etc/UTC'), 
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
    console.log("start query", query);
    await this.client.exec({ query });
  }

  // TODO: clickhouse REALLY doesn't like it when you update the data inside it...
  // may need to rethink how we store this kind of queryable session info...
  async endSession(sessionId, endTimestamp) {
    let sessionArr = await this.getOneSession(sessionId);
    if (sessionArr.length === 0) {
      throw new Error("attempted to end a session that doesn't exist");
    }

    //TODO: there's a bug here because we're storing a central timestamp as a UTC one.
    let startTimestamp = Date.parse(sessionArr[0].startTime);
    let lengthMs = endTimestamp - startTimestamp;

    //TODO: the endTime is stored as the unix endtime instead of what we want here...
    let query = `
      ALTER TABLE eventDb.sessionTable
      UPDATE endTime=${endTimestamp},
      complete=${true},
      lengthMs=${lengthMs}
      WHERE sessionId='${sessionId}'
    `;
    console.log("alter query", query);
    await this.client.exec({ query });
  }

  async getOneSession(sessionId) {
    let query = `select * from eventDb.sessionTable where sessionId='${sessionId}'`;
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
    let month = dateObj.getUTCMonth();
    let year = dateObj.getUTCFullYear();
    let finalDate = `${year.toString()}-${month.toString()}-${day.toString()}`;
    console.log("final fate", finalDate);
    return finalDate;
  }
}
