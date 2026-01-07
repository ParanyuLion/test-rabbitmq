import amqp from "amqplib";

/**
 * PUB/SUB SUBSCRIBER 1 - Console Logger
 *
 * This subscriber receives all log messages and displays them in the console.
 * It creates its own exclusive queue that gets deleted when the connection closes.
 *
 * Run multiple subscribers to see them all receive the same messages!
 */

async function subscribeLogs() {
  let connection;

  try {
    console.log("📡 Subscriber 1 (Console Logger) starting...");
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchange = "logs";
    await channel.assertExchange(exchange, "fanout", { durable: false });

    // Create an exclusive queue with a random name
    // exclusive: true means only this connection can access it
    // It will be deleted when connection closes
    const q = await channel.assertQueue("", { exclusive: true });

    console.log(`✅ Console Logger ready`);
    console.log(`   Queue: ${q.queue}`);
    console.log(`   Bound to exchange: ${exchange}`);
    console.log("   Waiting for logs...\n");

    // Bind the queue to the exchange
    // Now all messages published to 'logs' exchange will come to this queue
    channel.bindQueue(q.queue, exchange, "");

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        const log = msg.content.toString();
        console.log(`📝 [CONSOLE] ${log}`);
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
