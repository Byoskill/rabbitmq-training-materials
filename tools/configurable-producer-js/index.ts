/**
 * This tool can be use to send test messages to a RabbitMQ instance
 */
import { AMQPClient, AMQPError } from "@cloudamqp/amqp-client";
import yargs from "yargs";
import * as os from "os";
// get host name
const hostName = os.hostname();

const args: any = yargs
  .options({
    hostname: {
      type: "string",
      demandOption: false,
      alias: "u",
      default: "localhost",
    },
    message: {
      type: "string",
      demandOption: false,
      alias: "m",
      default: `Helloworld from ${hostName}`,
    },
    exchange: {
      type: "string",
      demandOption: false,
      alias: "x",
      default: "default-exchange",
    },
    routingKey: { type: "string", demandOption: false, alias: "t" },
    repeat: { type: "number", demandOption: false, alias: "r", default: 0 },
  })
  .help("h")
  .describe("hostname", "RabbitMQ hostname")
  .describe("message", "message to be sent")
  .describe("exchange", "exchange to send the message")
  .describe("routingKey", "routing key to use")
  .command(
    "[hostname] [message] [exchange]",
    "Send a message or a repetition of messages to RabbitMQ"
  )
  .alias("h", "help").argv;

console.log(args);

function wait(milleseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milleseconds));
}

async function run() {
  try {
    if (!args.routingKey) {
      args.routingKey = args.exchange;
    }

    const amqp = new AMQPClient(`amqp://${args.hostname}`);
    const conn = await amqp.connect();
    const ch = await conn.channel();
    ch.exchangeDeclare(args.exchange, "fanout", {
      passive: false,
      durable: true,
      autoDelete: false,
      internal: false,
    });

    if (args.repeat == 0) {
      console.log(`Publish message on ${args.exchange}`);
      await ch.basicPublish(args.exchange, args.routingKey, args.message);
    } else {
      while (args.repeat > 0) {
        console.log(`Publish message on ${args.exchange}`);
        await wait(args.repeat);
        await ch.basicPublish(args.exchange, args.routingKey, args.message);
      }
    }
    await conn.close();
  } catch (e: any) {
    console.error("ERROR", e);
    e.connection.close();
    setTimeout(run, 1000); // will try to reconnect in 1s
  }
}

run();
