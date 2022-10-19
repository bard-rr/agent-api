import express from "express";
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
router.post("/start-session", async (req, res) => {
  let { sessionId, timestamp } = req.body;
  if (!sessionId || !timestamp) {
    res.status(400).send();
  }
  try {
    await clickhouse.startNewSession(sessionId, timestamp);
    res.status(200).send();
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
});

//let us know a session has ended
router.post("/end-session", async (req, res) => {
  let { sessionId, timestamp } = req.body;
  if (!sessionId || !timestamp) {
    res.status(400).send();
  }
  try {
    await clickhouse.endSession(sessionId, timestamp);
    res.status(200).send();
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
});

//take session data from the body and feed it to the queue
router.post("/record", async (req, res) => {
  let { sessionId, events } = req.body;
  for (let i = 0; i < events.length; i++) {
    //clickhouse expects a string for the event: not a json object.
    let eventStr = JSON.stringify(events[i]);
    let message = { sessionId, event: eventStr };
    await rabbitQ.sendMessageToQueue(message);
  }
  res.status(200).send();
});

export default router;
