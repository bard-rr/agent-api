import express from "express";
import { DataService } from "./dataService/index.js";

const router = express.Router();

let dataService = new DataService();
await dataService.init();

//let us know that a session has begun
router.post("/start-session", async (req, res) => {
  let { sessionId, timestamp } = req.body;
  if (!sessionId || !timestamp) {
    res.status(400).send();
  }
  try {
    await dataService.startNewSession(sessionId, timestamp);
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
    await dataService.endSession(sessionId, timestamp);
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
    await dataService.sendEventMessage(sessionId, events[i]);
  }
  res.status(200).send();
});

export default router;
