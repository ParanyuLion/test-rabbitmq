import amqp from "amqplib";
import fs from "fs/promises";
import path from "path";

/**
 * PUB/SUB SUBSCRIBER 2 - File Logger
 *
 * This subscriber receives all log messages and saves them to a file.
 * It demonstrates how multiple subscribers can do different things with the same data.
 *
 * Run both subscribers together to see pub/sub in action!
 */

async function subscribeLogs() {
  let connection;

  try {
    console.log("📡 Subscriber 2 (File Logger) starting...");
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchange = "logs";
    await channel.assertExchange(exchange, "fanout", { durable: false });

    // Create an exclusive queue
    const q = await channel.assertQueue("", { exclusive: true });

    // Create logs directory if it doesn't exist
    const logsDir = "logs";
    try {
      await fs.mkdir(logsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const logFile = path.join(logsDir, "application.log");

    console.log(`✅ File Logger ready`);
    console.log(`   Queue: ${q.queue}`);
    console.log(`   Bound to exchange: ${exchange}`);
    console.log(`   Writing to: ${logFile}`);
    console.log("   Waiting for logs...\n");

    channel.bindQueue(q.queue, exchange, "");

    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const log = msg.content.toString();
        console.log(`💾 [FILE] Saving: ${log}`);

        // Append to log file
        try {
          await fs.appendFile(logFile, log + "\n");
        } catch (err) {
          console.error("Error writing to file:", err.message);
        }

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) {
      await connection.close();
    }
  }
}

subscribeLogs();
