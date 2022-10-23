import express from "express";
import { DataService } from "./dataService/index.js";

const router = express.Router();

let dataService = new DataService();
await dataService.init();

//take session data from the body and feed it to the data pipeline
router.post("/record", async (req, res) => {
  let originHost = req.get("Origin") ? req.get("Origin") : "INVALID ORIGIN";
  let { sessionId, events } = req.body;
  await dataService.handleEvents(sessionId, events, originHost);
  console.log("created the new session");
  res.status(200).send();
});

export default router;
