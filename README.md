<img src="https://github.com/bard-rr/.github/blob/main/profile/logo2.png?raw=true" width="300">
<br/>

[![Version](https://img.shields.io/npm/v/bardrr)](https://www.npmjs.com/package/bardrr)
[![Downloads/week](https://img.shields.io/npm/dt/bardrr)](https://npmjs.org/package/bardrr)
[![License](https://img.shields.io/npm/l/monsoon-load-testing.svg)](https://github.com/minhphanhvu/bardrr/blob/master/package.json)

# Agent API

<p align="center">
  <img src="https://github.com/bard-rr/.github/blob/main/profile/agentAPI.jpg?raw=true" width="600">
</p>

## Description

This is the api for the Agent from [the bardrr npm package](https://github.com/bard-rr/agent). The agent API has four jobs in our infrastructure.

- First, it validates the bardrr Agent using json web tokens.
- Second, it collects the metadata for each session by using the session ID given by the agent to keep track of the time, length, app name, and errors of each session.
- Third, the agent API parses conversion events from regular events and inserts them into the conversion table in the clickhouse database.
- Fourth, it collects all the events from the agent and inserts them into the events table in the clickhouse database.

## Required Software

Rabbitmq: [Download Here](https://www.rabbitmq.com/download.html) Will be run on port 5672.

Clickhouse: [Download Here](https://clickhouse.com/docs/en/install/) Will run on port 8123. The schema can be found here [Schema](https://github.com/bard-rr/deploy)

Postgres: [Download Here](https://www.postgresql.org/download/) Will run on port 5432. The schema can be found here [Schema](https://github.com/bard-rr/deploy)

Session_Ender: [Download Here](https://github.com/bard-rr/session_ender) A Cron job that is responsible for completing sessions and moving them into the clickhouse database.

## Setup

Clone the open source reposatory from [here](https://github.com/bard-rr/agent-api). Run the application from the `app` directory using:

`npm run start`

The agent api will run on port `3001`.

## Website

You can read more about our project [here](https://bard-rr.com/).
