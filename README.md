# Recorder backend

This is the recorder backend for our skateboard app.

Its based on the clickhouse spike found in `nino_spikes/clickhouse_spike`

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

#### TODOS

- Look a bit more into persistence with rabbitMQ. Some reading about it would be a nice start. Only proper test will be to set something up in a VPS-like environment and reboot the server though...
- Take a closer look at what we can do with clickhouse tables. Watch the rest of that postHog video now that you kind of know what's happening in clickhouse.
