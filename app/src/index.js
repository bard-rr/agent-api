import express, { json } from "express";
import cors from "cors";
import router from "./router.js";

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(json());
app.use("/", router);

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
});
