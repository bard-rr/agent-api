<img src="https://github.com/bard-rr/.github/blob/main/profile/logo2.png?raw=true" width="300">
<br/>

[![Version](https://img.shields.io/npm/v/bardrr)](https://www.npmjs.com/package/bardrr)
[![Downloads/week](https://img.shields.io/npm/dt/bardrr)](https://npmjs.org/package/bardrr)
[![License](https://img.shields.io/npm/l/monsoon-load-testing.svg)](https://github.com/minhphanhvu/bardrr/blob/master/package.json)

# Agent API

This is the api for the agent from the bardrr npm package. This nodejs api will validate the bardrr Agent using json web tokens and collect all the events from the agent recorder.

# Required Software

Rabbitmq: [Download Here](https://www.rabbitmq.com/download.html) Will be run on port 5672.

Clickhouse: [Download Here](https://clickhouse.com/docs/en/install/) Will run on port 8123. The schema can be found here [Schema](https://github.com/bard-rr/deploy)

Postgres: [Download Here](https://www.postgresql.org/download/) Will run on port 5432. The schema can be found here [Schema](https://github.com/bard-rr/deploy)

Session_Ender: [Download Here](https://github.com/bard-rr/session_ender) A Cron job that is responsible for completing sessions and moving them into the clickhouse database.

# Setup

Clone the open source reposatory from [Here](https://github.com/bard-rr/agent-api). Run the application using:

`npm run start`

# Website

You can read more about our project [here](oursupercoolapp.com).