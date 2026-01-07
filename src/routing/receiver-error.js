import amqp from "amqplib";

/**
 * ROUTING RECEIVER - Error Logs Only
 *
 * This consumer receives ONLY error logs by binding to the exchange with routing key "error".
 * It demonstrates selective message routing.
 *
 * Run this along with receiver-all.js to see how routing works!
 */

async function receiveErrorLogs() {
  let connection;

  try {
    console.log("📡 Error Log Receiver starting...");
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchange = "logs_direct";
    await channel.assertExchange(exchange, "direct", { durable: false });

    const q = await channel.assertQueue("", { exclusive: true });

    // Bind queue to exchange with routing key "error"
    // This queue will ONLY receive messages published with routing key "error"
    const routingKey = "error";
    channel.bindQueue(q.queue, exchange, routingKey);

    console.log(`✅ Error Log Receiver ready`);
    console.log(`   Queue: ${q.queue}`);
    console.log(`   Bound to exchange: ${exchange}`);
    console.log(`   Routing key: ${routingKey}`);
    console.log("   Waiting for ERROR logs only...\n");

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        const log = msg.content.toString();
        console.log(`🔴 [ERROR RECEIVER] ${log}`);
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

receiveErrorLogs();
