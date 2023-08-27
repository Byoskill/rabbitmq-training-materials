/**
 * This tool can be use to send test messages to a RabbitMQ instance
 */
import yargs from "yargs";
import * as os from "os";
import { Client } from "@stomp/stompjs";

import { WebSocket } from "ws";
Object.assign(global, { WebSocket });

// get host name
const hostName = os.hostname();

const args: any = yargs
  .options({
    hostname: {
      type: "string",
      demandOption: false,
      alias: "u",
      default: "localhost:15674",
    },
    message: {
      type: "string",
      demandOption: false,
      alias: "m",
      default: `Helloworld from ${hostName}`,
    },
    exchange: {
      type: "string",
      demandOption: true,
      alias: "x"
    },
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
    const client = new Client({
      brokerURL: `ws://${args.hostname}/ws`,
      onConnect: () => {
        console.log(`Connected to RabbitMQ at ${args.hostname}`)
        if (args.repeat == 0) {
          console.log(`Publish message on ${args.exchange}`);
          client.publish({ destination: args.exchange, body: args.message });
        } else {
          while (args.repeat > 0) {
            console.log(`Publish message on ${args.exchange}`);
            wait(args.repeat).then(() => {
              client.publish({ destination: args.exchange, body: args.message });
            });
          }
        }
      },
    });
    client.activate();
  } catch (e: any) {
    console.error("ERROR", e);
    e.connection.close();
    setTimeout(run, 1000); // will try to reconnect in 1s
  }
}

run();
