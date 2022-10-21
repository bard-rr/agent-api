import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
dotenv.config();

export class Postgres {
  constructor() {
    this.client = {};
  }
  async init() {
    this.client = new Client();
    await this.client.connect();
  }
}
