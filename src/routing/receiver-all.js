import amqp from "amqplib";

/**
 * ROUTING RECEIVER - All Log Levels
 *
 * This consumer receives ALL log levels (info, warning, error) by binding to multiple routing keys.
 * A queue can bind to an exchange multiple times with different routing keys.
 *
 * Run this along with receiver-error.js to see selective vs. comprehensive logging!
 */

async function receiveAllLogs() {
  let connection;

  try {
    console.log("📡 All Logs Receiver starting...");
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchange = "logs_direct";
    await channel.assertExchange(exchange, "direct", { durable: false });

    const q = await channel.assertQueue("", { exclusive: true });

    // Bind queue to exchange with MULTIPLE routing keys
    // This queue will receive messages from all three severity levels
    const routingKeys = ["info", "warning", "error"];

    for (const key of routingKeys) {
      channel.bindQueue(q.queue, exchange, key);
    }

    console.log(`✅ All Logs Receiver ready`);
    console.log(`   Queue: ${q.queue}`);
    console.log(`   Bound to exchange: ${exchange}`);
    console.log(`   Routing keys: ${routingKeys.join(", ")}`);
    console.log("   Waiting for ALL log levels...\n");

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        const log = msg.content.toString();
        const routingKey = msg.fields.routingKey;

        const emoji =
          routingKey === "error"
            ? "🔴"
            : routingKey === "warning"
            ? "🟡"
            : "🟢";
        console.log(`${emoji} [ALL LOGS - ${routingKey.toUpperCase()}] ${log}`);

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

receiveAllLogs();
