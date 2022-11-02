# Agent API

This is the api for the agent from the bardrr npm package. This nodejs api will validate the bardrr Agent using json web tokens
and collect all the events from the agent recorder.

## Required Software

Rabbitmq: [Download Here](https://www.rabbitmq.com/download.html) Will be run on port 5672.

Clickhouse: [Download Here](https://clickhouse.com/docs/en/install/) Will run on port 8123. The schema can be found here [Schema](https://github.com/bard-rr/deploy)

Postgres: [Download Here](https://www.postgresql.org/download/) Will run on port 5432. The schema can be found here [Schema](https://github.com/bard-rr/deploy)

Session_Ender: [Download Here](https://github.com/bard-rr/session_ender) A Cron job that is responsible for completing sessions and moving them into the clickhouse database.

## Setup

Clone the open source reposatory from [Here](https://github.com/bard-rr/agent-api). Run the application using:

`npm run start`

## Queue setup & tips:

Looks like rabbitMQ starts automatically upon installing at port `5672`.

`sudo rabbitmq-server start -detached` starts the service if its not running.

`rabbitmqctl` is a command line tool for interacting with your rabbitmq node.

`sudo rabbitmqctl list_queues` lets you see the queues in operation and the number of messages in each one.
completely reset RabbitMQ with

```
sudo rabbitmqctl stop_app
sudo rabbitmqctl reset
sudo rabbitmqctl start_app
```

## Clickhouse Setup

Start clickhouse server with `sudo clickhouse start`.
Start clickhouse client (cli tool for issuing queries) with `clickhouse-client`.

Clickhouse listens on port `8123` by default.

Node code for interacting with clickhouse is fairly straightforward. There are two main gotchas.

- Their concept of primary keys is not intuitive.
- Connecting to rabbitMQ requires a username and password.

The username and password for rabbit MQ are particularly annoying. Clickhouse expects them to be in a clickhouse config file that lives in `/etc/clickhouse-server/config.xml` or `/etc/clickhouse-server/config.yaml`. The problem is that the `/etc/clickhouse-server` dir is locked down during installation, so I couldn't access it. I fixed the problem by changing permissions on the folder with `sudo chmod -R 777 /etc/clickhouse-server`. Not to mention that its just annoying to have to do that kind of configuration outside your code in the first place...

Helpful commands in the `clickhouse-client`

- Show all databases: `SELECT name FROM system.databases`
- Show all tables in a database: `SELECT database, name FROM system.tables WHERE database=<'db name'>`
- Show all views in a database `SELECT database, name FROM system.tables WHERE engine='View'`
- Show the last 5 queries executed in clickhouse: `SELECT query FROM system.query_log ORDER BY event_time_microseconds DESC LIMIT 5`

## Postgres setup

Start postgres with `sudo service postgresql start`. The default port is `5432`.

The postgres connection is expecting a .env file with the following fields:

```
PGUSER
PGPASSWORD
PGHOST
PGDATABASE
PGPORT
```

#### RabbitMQ Resources

- [RabbitMQ in 100 seconds](https://www.youtube.com/watch?v=NQ3fZtyXji0&ab_channel=Fireship)
- [download rabbitmq](https://www.rabbitmq.com/download.html)
- [rabbitmq with node article](https://sharmilas.medium.com/get-started-with-rabbitmq-in-node-js-1adb18d019d0)
- [amqplib npm package](https://www.npmjs.com/package/amqplib)
- [details on rabbitMQ data model](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
- [details on rabbitMQ API](https://amqp-node.github.io/amqplib/channel_api.html#channel_publish)

#### Clickhouse Resources

- [Installing clickhouse](https://clickhouse.com/docs/en/quick-start#step-1-get-clickhouse)
- [Using SQL with clickhouse](https://clickhouse.com/docs/en/quick-start/#step-3-create-a-database-and-table)
- [Using clickhouse with Node](https://clickhouse.com/docs/en/integrations/language-clients/nodejs)
- [Integrating clickhouse with rabbitMQ](https://clickhouse.com/docs/en/engines/table-engines/integrations/rabbitmq/)
- [More on clickhouse + rabbitMQ integration](https://cloud.yandex.com/en/docs/managed-clickhouse/tutorials/fetch-data-from-rabbitmq#configure-mch-for-rmq)
