import amqp from "amqplib";

/**
 * PUB/SUB PUBLISHER - Fanout Exchange Pattern
 *
 * Publish/Subscribe pattern delivers messages to multiple consumers.
 * Unlike queues, where each message goes to ONE consumer, pub/sub sends
 * the same message to MULTIPLE consumers.
 *
 * Key concepts:
 * - Exchange: receives messages from producers and pushes to queues
 * - Fanout exchange: broadcasts all messages to all bound queues
 * - Each subscriber gets its own queue
 *
 * Flow: Publisher -> Exchange -> Queue1, Queue2, Queue3... -> Consumers
 *
 * Use case: Logging system where multiple services need the same log messages
 */

async function publishLogs() {
  let connection;

  try {
    console.log("Connecting to RabbitMQ...");
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    // Declare a fanout exchange
    // Fanout = broadcast to all queues bound to this exchange
    const exchange = "logs";
    await channel.assertExchange(exchange, "fanout", { durable: false });

    // Simulate publishing log messages every 2 seconds
    const logs = [
      "System started",
      "User logged in: john@example.com",
      "Database connection established",
      "Processing payment transaction #12345",
      "Email sent to customer",
      "Cache cleared",
      "System health check: OK",
    ];

    console.log(`📡 Publishing logs to exchange: ${exchange}`);
    console.log("   All subscribers will receive these messages\n");

    for (let i = 0; i < logs.length; i++) {
      const message = `[${new Date().toISOString()}] ${logs[i]}`;

      // Publish to exchange (not directly to queue)
      // Empty string '' as routing key (not used in fanout)
      channel.publish(exchange, "", Buffer.from(message));

      console.log(`✅ Published: ${message}`);

      // Wait 2 seconds before next log
      if (i < logs.length - 1) {
        await sleep(2000);
      }
    }

    console.log("\n📦 All log messages published");

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) {
      await connection.close();
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

publishLogs();
