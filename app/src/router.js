import express from "express";
//this is gross, can't believe I need to do this just to pull in json
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const data = require("./data.json");
import { RabbitQ } from "./rabbitQueue.js";
import { Clickhouse } from "./clickhouse.js";

const router = express.Router();

let clickhouse;
let rabbitQ;
const setupAllConnections = async () => {
  try {
    rabbitQ = new RabbitQ();
    await rabbitQ.init();
    console.log("connected to queue");
  } catch (e) {
    console.log("queue error:", e);
  }
  try {
    clickhouse = new Clickhouse();
    await clickhouse.init();
    console.log("connected to clickhouse!");
  } catch (e) {
    console.log("clickhouse error:", e);
  }
};
setupAllConnections();

//let us know that a session has begun
//TODO: handle case where session exists
router.post("/start-session", async (req, res) => {
  let { sessionId, timestamp } = req.body;
  if (!sessionId || !timestamp) {
    res.status(400).send();
  }
  try {
    await clickhouse.startNewSession(sessionId, timestamp);
    res.status(200).send();
  } catch {
    res.status(500).send();
  }
});

//let us know a session has ended
//TODO: handle case where session doesn't exist
router.post("/end-session", async (req, res) => {
  let { sessionId, timestamp } = req.body;
  if (!sessionId || !timestamp) {
    res.status(400).send();
  }
  try {
    await clickhouse.endSession(sessionId, timestamp);
    res.status(200).send();
  } catch {
    res.status(500).send();
  }
});

//take session data from the body and feed it to the queue
router.get("/record", async (req, res) => {
  let { sessionId, events } = data;
  for (let i = 0; i < events.length; i++) {
    //clickhouse expects a string for the event: not a json object.
    let eventStr = JSON.stringify(events[i]);
    let message = { sessionId, event: eventStr };
    await rabbitQ.sendMessageToQueue(message);
  }
  res.status(200).send();
});

//query clickhouse to return the session's event data from rabbit MQ
router.get("/session", async (req, res) => {
  try {
    let data = await clickhouse.getEventsFromSession(
      "60b682ee-d27e-4202-ada6-864ac3f6f320"
    );
    if (data.length === 0) {
      res.status(404).send();
    } else {
      res.json({ data });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
});

export default router;
