import amqp from "amqplib";

/**
 * BASIC CONSUMER - Hello World Pattern
 *
 * This consumer receives messages from the 'hello' queue.
 * It will keep running and listening for messages until you stop it (Ctrl+C).
 *
 * Flow: Producer -> Queue -> Consumer
 */

async function receiveMessage() {
  let connection;

  try {
    // Step 1: Connect to RabbitMQ server
    console.log("Connecting to RabbitMQ...");
    connection = await amqp.connect("amqp://localhost");

    // Step 2: Create a channel
    const channel = await connection.createChannel();

    // Step 3: Declare the same queue
    // Important: Both producer and consumer must declare the same queue
    // If the queue doesn't exist, it will be created
    const queue = "hello";
    await channel.assertQueue(queue, { durable: false });

    console.log(`✅ Waiting for messages in queue: ${queue}`);
    console.log("   Press Ctrl+C to exit\n");

    // Step 4: Consume messages from the queue
    // callback function is called every time a message arrives
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        console.log(`📨 Received: "${content.muntin}"`);
        console.log(content);

        // Step 5: Acknowledge the message
        // This tells RabbitMQ that the message has been processed
        // and can be deleted from the queue
        channel.ack(msg);
      }
    });

    // Keep the process running
    // In a real application, you'd have proper shutdown handling
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) {
      await connection.close();
    }
  }
}

// Execute
receiveMessage();
