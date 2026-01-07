import amqp from "amqplib";

/**
 * WORK QUEUE CONSUMER - Task Distribution Pattern
 *
 * This worker receives tasks from the work queue and processes them.
 * You can run multiple instances of this consumer to process tasks in parallel.
 *
 * Key features:
 * - Manual acknowledgment: only acknowledges after task is complete
 * - Fair dispatch: prefetch=1 ensures workers get one task at a time
 * - Simulates work by sleeping based on dots in the message
 *
 * Try running multiple instances: npm run work-consumer in different terminals
 */

// Get worker ID from command line or use random number
const workerId = process.argv[2] || Math.floor(Math.random() * 1000);

async function processTask() {
  let connection;

  try {
    console.log(`🔧 Worker ${workerId} starting...`);
    connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const queue = "task_queue";
    await channel.assertQueue(queue, { durable: true });

    // Fair dispatch: only send one task at a time to each worker
    // Worker won't get a new task until it finishes and acknowledges the previous one
    channel.prefetch(1);

    console.log(`✅ Worker ${workerId} ready and waiting for tasks...`);
    console.log("   Press Ctrl+C to exit\n");

    channel.consume(
      queue,
      async (msg) => {
        if (msg !== null) {
          const task = msg.content.toString();
          const dots = task.match(/\./g).length;
          const workTime = dots * 1000; // Each dot = 1 second

          console.log(`📨 Worker ${workerId} received: "${task}"`);
          console.log(`   ⏱️  Processing for ${dots} seconds...`);

          // Simulate work by sleeping
          await sleep(workTime);

          console.log(`   ✅ Worker ${workerId} completed: "${task}"\n`);

          // Acknowledge the message only after work is done
          // If this worker crashes before ack, RabbitMQ will re-deliver to another worker
          channel.ack(msg);
        }
      },
      {
        // noAck: false means manual acknowledgment
        // Worker must explicitly acknowledge each message
        noAck: false,
      }
    );
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

processTask();
