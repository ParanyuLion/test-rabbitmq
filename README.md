# RabbitMQ Learning Project 🐰

A comprehensive guide to learning RabbitMQ with practical Node.js examples. This project demonstrates the core messaging patterns with detailed explanations and ready-to-run code.

## 📚 What You'll Learn

- **Basic Queue**: Simple producer-consumer pattern
- **Work Queues**: Distributing tasks among multiple workers
- **Pub/Sub**: Broadcasting messages to multiple consumers
- **Routing**: Selective message routing based on keys

## 🛠️ Prerequisites

### 1. Install Docker

Make sure you have Docker and Docker Compose installed on your system:

- **Windows/Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Start RabbitMQ with Docker

Simply run:

```bash
docker-compose up -d
```

This will:

- Download the RabbitMQ image with management plugin
- Start RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)
- Persist data and logs in Docker volumes
- Run the container in the background

**Check if RabbitMQ is running:**

```bash
docker ps
```

You should see the `rabbitmq` container running.

**View RabbitMQ logs:**

```bash
docker logs rabbitmq
```

**Stop RabbitMQ:**

```bash
docker-compose down
```

**Stop and remove volumes (clean slate):**

```bash
docker-compose down -v
```

### 3. Access Management UI

The management UI is automatically enabled in the Docker image.

Access it at: http://localhost:15672  
Default credentials: `guest` / `guest`

### 4. Install Node.js Dependencies

```bash
npm install
```

---

## 🚀 Running the REST API with Postman

### Start the API Server

```bash
npm start
```

You'll see:

```
📡 Server: http://localhost:3000
📊 RabbitMQ Management UI: http://localhost:15672 (guest/guest)
📚 API Documentation: http://localhost:3000
```

### Import Postman Collection

1. Open **Postman**
2. Click **File** → **Import**
3. Select `RabbitMQ-API.postman_collection.json` from the project root
4. All endpoints are ready to test!

### Test the API

Visit http://localhost:3000 to see all available endpoints.

**Quick Test Flow:**

1. **Check Status** - `GET /api/status` (verify RabbitMQ is connected)
2. **Send Basic Message** - `POST /api/basic/send` with `{"message": "Hello"}`
3. **Consume Message** - `GET /api/basic/consume` (retrieve the message)
4. **Add Work Task** - `POST /api/work-queue/add-task` with `{"task": "Process payment"}`
5. **Check Work Queue** - `GET /api/work-queue/stats`
6. **Publish to All** - `POST /api/pubsub/publish` (broadcasts to all subscribers)
7. **Emit Routed Log** - `POST /api/routing/emit` with `{"severity": "error", "message": "..."}`

---

## 📡 REST API Endpoints

### Basic Queue (Hello World)

**Send Message:**

```
POST /api/basic/send
Content-Type: application/json

{
  "message": "Hello World"
}
```

**Consume Message:**

```
GET /api/basic/consume
```

### Work Queue (Task Distribution)

**Add Task:**

```
POST /api/work-queue/add-task
Content-Type: application/json

{
  "task": "Process image.jpg"
}
```

**Get Stats:**

```
GET /api/work-queue/stats
```

### Pub/Sub (Fanout Exchange)

**Publish Message:**

```
POST /api/pubsub/publish
Content-Type: application/json

{
  "message": "System notification"
}
```

### Routing (Direct Exchange)

**Emit Log:**

```
POST /api/routing/emit
Content-Type: application/json

{
  "severity": "error",
  "message": "Payment failed"
}
```

Severity levels: `info`, `warning`, `error`

### System

**API Status:**

```
GET /api/status
```

**API Documentation:**

```
GET /
```

---

## 🚀 Running the Command-Line Examples

### 1️⃣ Basic Queue (Hello World)

The simplest pattern: one producer sends messages to a queue, one consumer receives them.

**Terminal 1 - Start Consumer:**

```bash
npm run consumer
```

**Terminal 2 - Send Message:**

```bash
npm run producer
```

**What's Happening:**

- Producer sends a "Hello World" message to the `hello` queue
- Consumer receives and displays the message
- Message is acknowledged and removed from queue

---

### 2️⃣ Work Queue (Task Distribution)

Multiple workers process tasks from a shared queue. Great for distributing time-consuming jobs.

**Terminal 1 - Start Worker 1:**

```bash
npm run work-consumer
```

**Terminal 2 - Start Worker 2:**

```bash
npm run work-consumer
```

**Terminal 3 - Send Tasks:**

```bash
npm run work-producer
```

**What's Happening:**

- Producer sends multiple tasks with varying complexity
- Tasks are distributed among available workers (round-robin)
- Each worker processes one task at a time (fair dispatch)
- If a worker dies, its unacknowledged task goes to another worker

**Key Concepts:**

- `durable: true` - Queue survives RabbitMQ restart
- `persistent: true` - Messages survive RabbitMQ restart
- `prefetch: 1` - Worker gets only one task at a time
- Manual acknowledgment ensures tasks aren't lost

---

### 3️⃣ Pub/Sub (Fanout Exchange)

Broadcast the same message to multiple consumers. All subscribers receive all messages.

**Terminal 1 - Start Console Logger:**

```bash
npm run pubsub-consumer1
```

**Terminal 2 - Start File Logger:**

```bash
npm run pubsub-consumer2
```

**Terminal 3 - Publish Logs:**

```bash
npm run pubsub-producer
```

**What's Happening:**

- Publisher sends log messages to a fanout exchange
- Both subscribers receive ALL messages
- Console logger displays logs in terminal
- File logger saves logs to `logs/application.log`
- Each subscriber has its own exclusive queue

**Key Concepts:**

- **Exchange**: Routes messages to queues (producer never sends directly to queue)
- **Fanout**: Broadcasts to all bound queues
- **Exclusive queues**: Temporary, deleted when connection closes
- **Binding**: Connects queue to exchange

---

### 4️⃣ Routing (Direct Exchange)

Selective message delivery based on routing keys. Consumers receive only messages they're interested in.

**Terminal 1 - Start Error Log Receiver (errors only):**

```bash
npm run routing-consumer-error
```

**Terminal 2 - Start All Logs Receiver (all levels):**

```bash
npm run routing-consumer-all
```

**Terminal 3 - Emit Logs:**

```bash
npm run routing-producer
```

**What's Happening:**

- Emitter publishes logs with routing keys: `info`, `warning`, `error`
- Error receiver gets ONLY messages with routing key `error`
- All logs receiver gets messages from ALL routing keys
- Same message can go to multiple queues if they bind with the same key

**Key Concepts:**

- **Direct exchange**: Routes based on exact routing key match
- **Routing key**: Message attribute used for routing
- **Binding key**: Queue binds to exchange with one or more keys
- Multiple bindings: One queue can bind with many routing keys

---

## 🧠 RabbitMQ Core Concepts

### Message Flow

```
Producer → Exchange → Queue → Consumer
```

### Components

1. **Producer**: Application that sends messages
2. **Queue**: Buffer that stores messages
3. **Consumer**: Application that receives messages
4. **Exchange**: Routes messages to queues based on rules
5. **Binding**: Link between exchange and queue
6. **Routing Key**: Message attribute for routing decisions

### Exchange Types

| Type        | Behavior                                   | Use Case                         |
| ----------- | ------------------------------------------ | -------------------------------- |
| **Direct**  | Routes to queues with matching routing key | Task routing, log levels         |
| **Fanout**  | Broadcasts to all bound queues             | Notifications, real-time updates |
| **Topic**   | Routes based on pattern matching           | Complex routing, wildcards       |
| **Headers** | Routes based on message headers            | Custom routing logic             |

### Message Acknowledgment

- **Auto-ack**: Message deleted immediately when sent to consumer (fast but risky)
- **Manual-ack**: Consumer explicitly acknowledges (safe, ensures processing)

### Durability vs Persistence

- **Durable Queue**: Queue survives RabbitMQ restart
- **Persistent Message**: Message survives RabbitMQ restart
- Both are needed for full durability!

---

## 🎯 Common Use Cases

### Work Queue Pattern

- Image processing
- Video encoding
- Email sending
- Report generation
- Batch jobs

### Pub/Sub Pattern

- Logging systems
- Real-time notifications
- Event broadcasting
- Activity feeds
- Live updates

### Routing Pattern

- Log level filtering (error, warning, info)
- Multi-tenant applications
- Content filtering
- Selective data distribution

---

## 🔍 Monitoring & Debugging

### Management UI

Visit http://localhost:15672 to:

- View queues and their message counts
- Monitor exchange bindings
- See consumer connections
- Manually publish/consume messages

### Command Line Tools (Docker)

```bash
# Execute rabbitmqctl commands inside the container
docker exec rabbitmq rabbitmqctl list_queues

# List exchanges
docker exec rabbitmq rabbitmqctl list_exchanges

# List bindings
docker exec rabbitmq rabbitmqctl list_bindings

# Purge a queue
docker exec rabbitmq rabbitmqctl purge_queue queue_name

# Check cluster status
docker exec rabbitmq rabbitmqctl cluster_status
```

---

## 📖 Learning Path

1. **Start with Basic Queue** - Understand producer, queue, consumer
2. **Try Work Queue** - Learn about distribution and acknowledgments
3. **Explore Pub/Sub** - Understand exchanges and fanout
4. **Master Routing** - Learn selective message routing

---

## 🛠️ Troubleshoocontainer is running: `docker ps`

- Check container logs: `docker logs rabbitmq`
- Check port 5672 is accessible
- Restart container: `docker-compose restart`

### Container Won't Start

- Check if port is already in use: `netstat -ano | findstr :5672` (Windows)
- View container logs: `docker logs rabbitmq`
- Try clean restart: `docker-compose down -v && docker-compose up -d`
- Ensure RabbitMQ is running: `rabbitmqctl status`
- Check port 5672 is accessible
- Verify firewall settings

### Messages Not Being Consumed

- Check consumer is running
- Verify queue name matches
- Look for errors in consumer logs
- Check management UI for queue status

### Messages Disappearing

- Use `durable: true` for queues
- Use `persistent: true` for messages
- Implement proper acknowledgment

---

## 📚 Next Steps

- Explore **Topic Exchange** for pattern-based routing
- Learn about **Message Priority**
- Implement **Dead Letter Exchanges** for failed messages
- Study **TTL (Time To Live)** for message expiration
- Research **RabbitMQ Clustering** for high availability

---

## 🤝 Contributing

Feel free to add more examples or improve existing ones!

## 📝 License

ISC
