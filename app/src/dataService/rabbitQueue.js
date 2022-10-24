import amqp from "amqplib";

export class RabbitQ {
  //need to create the class, then init it
  constructor() {
    this.channel = {};
  }

  async init() {
    let connection = await amqp.connect("amqp://localhost:5672");
    let channel = await connection.createChannel();
    await channel.assertExchange("test-exchange", "fanout", {
      durable: true,
    });
    this.channel = channel;
  }
  async sendMessageToQueue(messageObj) {
    //TODO: this method doesn't actually return promises. need to handle
    //it a different way: https://amqp-node.github.io/amqplib/channel_api.html#flowcontrol
    await this.channel.publish(
      "test-exchange", //exchange name
      "", // routing key: not needed for fanout exchanges
      // eslint-disable-next-line no-undef
      Buffer.from(JSON.stringify(messageObj)),
      { persistent: true } //ensures message will survive a node restart if its in a durable queue
    );
  }
}
