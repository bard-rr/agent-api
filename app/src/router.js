import dotenv from "dotenv";
dotenv.config({ path: `../.env` });
import express from "express";
import { DataService } from "./dataService/index.js";

const router = express.Router();
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;

let dataService = new DataService();
await dataService.init();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  // eslint-disable-next-line no-undef
  verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.get("/authenticate", (req, res) => {
  const user = { name: "agent" };
  // eslint-disable-next-line no-undef
  const accessToken = sign(user, process.env.ACCESS_TOKEN_SECRET);
  res.json({ accessToken });
});

//take session data from the body and feed it to the data pipeline
router.post("/record", authenticateToken, async (req, res) => {
  if (req.user.name === "agent") {
    let appName = req.headers.appname
      ? req.headers.appname
      : "INVALID APP NAME";
    let { sessionId, events, MAX_IDLE_TIME } = req.body;
    if (!MAX_IDLE_TIME) {
      MAX_IDLE_TIME = 5000;
    }
    try {
      await dataService.handleEvents(sessionId, events, appName, MAX_IDLE_TIME);
      res.status(200).send();
    } catch (error) {
      console.error("record error:", error);
      res.status(500).json({ error });
    }
  } else {
    res.statusSend(403);
  }
});

export default router;
