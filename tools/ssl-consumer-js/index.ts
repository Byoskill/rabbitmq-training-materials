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
    exchange: {
      type: "string",
      demandOption: false,
      alias: "x",
      default: "default-exchange",
    }
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
    const amqp = new AMQPClient(`amqp://${args.hostname}`, {
      ca: "/home/rabbitmq/ssl/tls-gen/basic/result/client_rabbitmq-vm-0_certificate.pem",
      key: "/home/rabbitmq/ssl/tls-gen/basic/result/client_rabbitmq-vm-0_key.pem",
      passphrase: "bunnies"
    });
    const conn = await amqp.connect();
    const ch = await conn.channel();
    const q = await ch.queue()
    const binding = await ch.queueBind(q.name, args.exchange, args.exchange)
    const consumer = await q.subscribe({noAck: true}, async (msg) => {
      console.log("Received | "+ msg.bodyToString(), {properties : msg.properties})
    })
    
    await consumer.wait()
    await conn.close();
  } catch (e: any) {
    console.error("ERROR", e);
    e.connection.close();
    setTimeout(run, 1000); // will try to reconnect in 1s
  }
}

run();
