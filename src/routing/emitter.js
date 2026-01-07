import amqp from "amqplib";

/**
 * ROUTING EMITTER - Direct Exchange Pattern
 *
 * Routing allows subscribers to receive only a subset of messages based on routing keys.
 * Unlike fanout (which broadcasts to all), direct exchange routes messages to queues
 * whose binding key matches the message's routing key.
 *
 * Key concepts:
 * - Direct exchange: routes based on routing key
 * - Routing key: a message attribute used for routing
 * - Binding key: the key a queue uses to bind to an exchange
 *
 * Flow: Emitter -> Exchange (with routing key) -> Matching Queues -> Consumers
 *
 * Use case: Log severity levels - some consumers want only errors, others want all logs
 */

async function emitLogs() {
  let connection;

  try {
    console.log("Connecting to RabbitMQ...");
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    // Declare a direct exchange
    const exchange = "logs_direct";
    await channel.assertExchange(exchange, "direct", { durable: false });

    // Create log messages with different severity levels
    const logMessages = [
      { severity: "info", message: "Application started successfully" },
      { severity: "info", message: "User authentication successful" },
      {
        severity: "warning",
        message: "Database query took longer than expected",
      },
      { severity: "info", message: "Request processed in 45ms" },
      { severity: "error", message: "Failed to connect to external API" },
      { severity: "warning", message: "Memory usage at 85%" },
      { severity: "error", message: "Database connection lost" },
      { severity: "info", message: "Cache refreshed" },
      {
        severity: "error",
        message: "Payment processing failed for order #9876",
      },
      { severity: "warning", message: "Disk space running low" },
    ];

    console.log(`📡 Emitting logs to exchange: ${exchange}`);
    console.log("   Logs will be routed based on severity level\n");

    for (let i = 0; i < logMessages.length; i++) {
      const { severity, message } = logMessages[i];
      const fullMessage = `[${new Date().toISOString()}] [${severity.toUpperCase()}] ${message}`;

      // Publish with routing key = severity level
      channel.publish(exchange, severity, Buffer.from(fullMessage));

      const emoji =
        severity === "error" ? "🔴" : severity === "warning" ? "🟡" : "🟢";
      console.log(`${emoji} Emitted [${severity}]: ${message}`);

      // Wait 1 second between messages
      if (i < logMessages.length - 1) {
        await sleep(1000);
      }
    }

    console.log("\n📦 All log messages emitted");
    console.log('   - "error" logs went to queues bound with "error" key');
    console.log('   - "warning" logs went to queues bound with "warning" key');
    console.log('   - "info" logs went to queues bound with "info" key');

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

emitLogs();
