import express from "express";
import cors from "cors";
import amqp from "amqplib";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Global variables for connections and channels
let connection = null;
let channels = {};

/**
 * Initialize RabbitMQ connection and create channels for each pattern
 */
async function initializeRabbitMQ() {
  try {
    console.log("🔌 Connecting to RabbitMQ...");
    connection = await amqp.connect("amqp://localhost");

    // Create channels for different patterns
    channels.basic = await connection.createChannel();
    channels.workQueue = await connection.createChannel();
    channels.pubsub = await connection.createChannel();
    channels.routing = await connection.createChannel();

    // Declare queues and exchanges
    await channels.basic.assertQueue("hello", { durable: false });

    await channels.workQueue.assertQueue("task_queue", { durable: true });
    channels.workQueue.prefetch(1);

    await channels.pubsub.assertExchange("logs", "fanout", { durable: false });

    await channels.routing.assertExchange("logs_direct", "direct", {
      durable: false,
    });

    console.log("✅ RabbitMQ connected and initialized");
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error.message);
    console.log("   Make sure RabbitMQ is running: docker-compose up -d");
    process.exit(1);
  }
}

// ============================================
// BASIC QUEUE ENDPOINTS (Hello World Pattern)
// ============================================

/**
 * POST /api/basic/send
 * Send a message to the basic queue
 * Body: { "message": "Hello World" }
 */
app.post("/api/basic/send", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
        example: { message: "Hello World" },
      });
    }

    channels.basic.sendToQueue("hello", Buffer.from(message));

    res.json({
      status: "success",
      message: `Message sent to queue 'hello': "${message}"`,
      queue: "hello",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/basic/consume
 * Consume one message from the basic queue
 */
app.get("/api/basic/consume", async (req, res) => {
  try {
    const msg = await channels.basic.get("hello", { noAck: true });

    if (!msg) {
      return res.json({
        status: "empty",
        message: "No messages in queue",
        queue: "hello",
      });
    }

    const content = msg.content.toString();
    res.json({
      status: "success",
      message: content,
      queue: "hello",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// WORK QUEUE ENDPOINTS (Task Distribution)
// ============================================

/**
 * POST /api/work-queue/add-task
 * Add a task to the work queue
 * Body: { "task": "Process image.jpg" }
 */
app.post("/api/work-queue/add-task", async (req, res) => {
  try {
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({
        error: "Task is required",
        example: { task: "Process payment #12345" },
      });
    }

    channels.workQueue.sendToQueue("task_queue", Buffer.from(task), {
      persistent: true,
    });

    res.json({
      status: "success",
      message: `Task added to queue: "${task}"`,
      queue: "task_queue",
      note: 'Run "npm run work-consumer" to process tasks',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/work-queue/stats
 * Get work queue statistics
 */
app.get("/api/work-queue/stats", async (req, res) => {
  try {
    const result = await channels.workQueue.checkQueue("task_queue");

    res.json({
      queue: "task_queue",
      messageCount: result.messageCount,
      consumerCount: result.consumerCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PUB/SUB ENDPOINTS (Fanout Exchange)
// ============================================

/**
 * POST /api/pubsub/publish
 * Publish a message to all subscribers
 * Body: { "message": "System notification" }
 */
app.post("/api/pubsub/publish", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
        example: { message: "System started successfully" },
      });
    }

    const fullMessage = `[${new Date().toISOString()}] ${message}`;
    channels.pubsub.publish("logs", "", Buffer.from(fullMessage));

    res.json({
      status: "success",
      message: `Published to all subscribers: "${message}"`,
      exchange: "logs",
      timestamp: new Date().toISOString(),
      note: 'Run "npm run pubsub-consumer1" and "npm run pubsub-consumer2" to receive',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTING ENDPOINTS (Direct Exchange)
// ============================================

/**
 * POST /api/routing/emit
 * Emit a log with specific severity level
 * Body: { "severity": "error", "message": "Payment failed" }
 */
app.post("/api/routing/emit", async (req, res) => {
  try {
    const { severity, message } = req.body;

    if (!severity || !message) {
      return res.status(400).json({
        error: "Severity and message are required",
        example: {
          severity: "error",
          message: "Database connection failed",
        },
        severityLevels: ["info", "warning", "error"],
      });
    }

    if (!["info", "warning", "error"].includes(severity)) {
      return res.status(400).json({
        error: "Invalid severity level",
        allowedLevels: ["info", "warning", "error"],
      });
    }

    const fullMessage = `[${new Date().toISOString()}] [${severity.toUpperCase()}] ${message}`;
    channels.routing.publish("logs_direct", severity, Buffer.from(fullMessage));

    const emoji =
      severity === "error" ? "🔴" : severity === "warning" ? "🟡" : "🟢";

    res.json({
      status: "success",
      message: `${emoji} Emitted [${severity}]: "${message}"`,
      exchange: "logs_direct",
      routingKey: severity,
      timestamp: new Date().toISOString(),
      note: "Run routing consumers to receive: npm run routing-consumer-error and npm run routing-consumer-all",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SYSTEM ENDPOINTS
// ============================================

/**
 * GET /
 * API documentation
 */
app.get("/", (req, res) => {
  res.json({
    title: "RabbitMQ REST API",
    version: "1.0.0",
    baseUrl: "http://localhost:3000",
    endpoints: {
      "Basic Queue (Hello World)": {
        "POST /api/basic/send": {
          description: "Send a message to the basic queue",
          body: { message: "Hello World" },
          example:
            'curl -X POST http://localhost:3000/api/basic/send -H "Content-Type: application/json" -d \'{"message":"Hello World"}\'',
        },
        "GET /api/basic/consume": {
          description: "Consume one message from the basic queue",
          example: "curl http://localhost:3000/api/basic/consume",
        },
      },
      "Work Queue (Task Distribution)": {
        "POST /api/work-queue/add-task": {
          description: "Add a task to the work queue",
          body: { task: "Process image.jpg" },
          example:
            'curl -X POST http://localhost:3000/api/work-queue/add-task -H "Content-Type: application/json" -d \'{"task":"Process payment"}\'',
        },
        "GET /api/work-queue/stats": {
          description: "Get work queue statistics",
          example: "curl http://localhost:3000/api/work-queue/stats",
        },
      },
      "Pub/Sub (Fanout Exchange)": {
        "POST /api/pubsub/publish": {
          description: "Publish a message to all subscribers",
          body: { message: "System notification" },
          example:
            'curl -X POST http://localhost:3000/api/pubsub/publish -H "Content-Type: application/json" -d \'{"message":"System restarting"}\'',
        },
      },
      "Routing (Direct Exchange)": {
        "POST /api/routing/emit": {
          description: "Emit a log with specific severity level",
          body: {
            severity: "error",
            message: "Payment failed",
          },
          severityLevels: ["info", "warning", "error"],
          example:
            'curl -X POST http://localhost:3000/api/routing/emit -H "Content-Type: application/json" -d \'{"severity":"error","message":"Payment failed"}\'',
        },
      },
    },
  });
});

/**
 * GET /api/status
 * Check RabbitMQ connection status
 */
app.get("/api/status", async (req, res) => {
  try {
    if (!connection) {
      return res.status(503).json({
        status: "disconnected",
        message: "RabbitMQ is not connected",
      });
    }

    res.json({
      status: "connected",
      connection: "RabbitMQ is running",
      managementUI: "http://localhost:15672",
      credentials: "guest / guest",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: error.message,
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: "GET http://localhost:3000",
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    await initializeRabbitMQ();

    app.listen(PORT, () => {
      console.log("\n");
      console.log("╔════════════════════════════════════════════╗");
      console.log("║     RabbitMQ REST API Server Running       ║");
      console.log("╚════════════════════════════════════════════╝");
      console.log(`\n📡 Server: http://localhost:${PORT}`);
      console.log(
        `📊 RabbitMQ Management UI: http://localhost:15672 (guest/guest)\n`
      );
      console.log("📚 API Documentation: http://localhost:3000\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n📴 Shutting down...");
  if (connection) {
    await connection.close();
  }
  process.exit(0);
});
