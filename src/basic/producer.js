import amqp from "amqplib";

/**
 * BASIC PRODUCER - Hello World Pattern
 *
 * This is the simplest RabbitMQ pattern: one producer sends messages to a queue,
 * and one consumer receives them.
 *
 * Flow: Producer -> Queue -> Consumer
 */

async function sendMessage() {
  let connection;

  try {
    // Step 1: Connect to RabbitMQ server (default: localhost:5672)
    console.log("Connecting to RabbitMQ...");
    connection = await amqp.connect("amqp://localhost");

    // Step 2: Create a channel
    // Channels are virtual connections inside a TCP connection
    // They allow multiple operations without creating multiple TCP connections
    const channel = await connection.createChannel();

    // Step 3: Declare a queue
    // Queue name: 'hello'
    // Options: { durable: true } - queue will survive broker restart
    const queue = "hello";
    await channel.assertQueue(queue, { durable: true });

    // Step 4: Send a message to the queue
    const message = { muntin: "Hello World from RabbitMQ!" };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

    console.log(`✅ Sent: "${message}"`);
    console.log(`   Queue: ${queue}`);
    console.log(`   Message is waiting for a consumer to receive it`);

    // Step 5: Close the channel and connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) {
      await connection.close();
    }
  }
}

// Execute
sendMessage();
