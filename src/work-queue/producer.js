import amqp from "amqplib";

/**
 * WORK QUEUE PRODUCER - Task Distribution Pattern
 *
 * Work Queues distribute time-consuming tasks among multiple workers.
 * This helps avoid doing a resource-intensive task immediately and waiting for it to complete.
 *
 * Key concepts:
 * - Durable queues: survive RabbitMQ restart
 * - Persistent messages: survive RabbitMQ restart
 * - Multiple consumers can process tasks in parallel
 *
 * Flow: Producer -> Queue -> Worker1, Worker2, Worker3...
 */

async function sendTask() {
  let connection;

  try {
    console.log("Connecting to RabbitMQ...");
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    // Declare a durable queue
    // durable: true means the queue will survive broker restart
    const queue = "task_queue";
    await channel.assertQueue(queue, { durable: true });

    // Create some tasks with different complexities
    // Each dot represents a second of work
    const tasks = [
      "Simple task.",
      "Medium task..",
      "Complex task...",
      "Very complex task....",
      "Easy task.",
    ];

    for (const task of tasks) {
      // Mark message as persistent
      // This ensures messages survive RabbitMQ restart
      channel.sendToQueue(queue, Buffer.from(task), {
        persistent: true,
      });

      const dots = task.match(/\./g).length;
      console.log(`✅ Sent task: "${task}" (will take ${dots} seconds)`);
    }

    console.log(`\n📦 Total tasks sent: ${tasks.length}`);
    console.log("   These tasks will be distributed among available workers");

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) {
      await connection.close();
    }
  }
}

sendTask();
