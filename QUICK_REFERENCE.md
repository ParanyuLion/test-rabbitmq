# RabbitMQ REST API - Quick Reference

## 🚀 Getting Started

```bash
# Start Docker RabbitMQ
docker-compose up -d

# Install dependencies
npm install

# Start API server
npm start

# Server runs at: http://localhost:3000
# Management UI: http://localhost:15672 (guest/guest)
```

---

## 📡 API Endpoints (Cheat Sheet)

### ✅ Check Status

```
GET http://localhost:3000/api/status
```

### 1️⃣ Basic Queue

```
POST http://localhost:3000/api/basic/send
Body: {"message": "Hello World"}

GET http://localhost:3000/api/basic/consume
```

### 2️⃣ Work Queue

```
POST http://localhost:3000/api/work-queue/add-task
Body: {"task": "Process payment"}

GET http://localhost:3000/api/work-queue/stats
```

### 3️⃣ Pub/Sub

```
POST http://localhost:3000/api/pubsub/publish
Body: {"message": "System notification"}
```

### 4️⃣ Routing

```
POST http://localhost:3000/api/routing/emit
Body: {"severity": "error", "message": "Payment failed"}

Severities: info, warning, error
```

---

## 🎯 Common Workflows

### Workflow 1: Send & Receive Message

```bash
# Terminal: Start consumer
npm run consumer

# Postman: Send message
POST /api/basic/send
{"message": "Hello"}

# Postman: Receive message
GET /api/basic/consume
```

### Workflow 2: Distribute Tasks

```bash
# Terminal 1 & 2: Start workers
npm run work-consumer
npm run work-consumer

# Postman: Add multiple tasks
POST /api/work-queue/add-task
{"task": "Task 1..."}

# Watch workers process in parallel!
```

### Workflow 3: Broadcast to All

```bash
# Terminal 1 & 2: Start subscribers
npm run pubsub-consumer1
npm run pubsub-consumer2

# Postman: Publish message (both receive it)
POST /api/pubsub/publish
{"message": "Hello everyone!"}
```

### Workflow 4: Filter by Severity

```bash
# Terminal 1: Errors only
npm run routing-consumer-error

# Terminal 2: All levels
npm run routing-consumer-all

# Postman: Emit different severities
POST /api/routing/emit
{"severity": "error", "message": "..."}
```

---

## 🐳 Docker Commands

```bash
# Start RabbitMQ
docker-compose up -d

# Stop RabbitMQ
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View logs
docker logs rabbitmq

# Check status
docker ps
```

---

## 🔧 Useful Commands

```bash
# Clear all queues
docker exec rabbitmq rabbitmqctl reset

# List queues
docker exec rabbitmq rabbitmqctl list_queues

# View API docs
curl http://localhost:3000

# Test API is running
curl http://localhost:3000/api/status
```

---

## 💻 Postman Import

1. Open Postman
2. Click "File" → "Import"
3. Select `RabbitMQ-API.postman_collection.json`
4. All endpoints ready to test!

---

## 📚 Key Concepts

| Pattern         | Use Case           | Key Feature                      |
| --------------- | ------------------ | -------------------------------- |
| **Basic Queue** | Simple messaging   | 1 producer, 1 consumer           |
| **Work Queue**  | Task distribution  | Load balancing, multiple workers |
| **Pub/Sub**     | Broadcasting       | 1 message → all subscribers      |
| **Routing**     | Selective delivery | Message filtering by key         |

---

## 🚨 Troubleshooting

| Problem                 | Solution                                 |
| ----------------------- | ---------------------------------------- |
| `Connection refused`    | Start Docker: `docker-compose up -d`     |
| `Port 3000 in use`      | Change PORT in `src/server.js`           |
| `Queue not found`       | API creates queues automatically         |
| `No messages received`  | Check consumer is running                |
| `Messages disappearing` | Use durable queues & persistent messages |

---

## 📖 File Structure

```
test-rabbitmq/
├── src/
│   ├── server.js           ← REST API server
│   ├── basic/              ← Hello World example
│   ├── work-queue/         ← Task distribution
│   ├── pubsub/             ← Broadcasting
│   └── routing/            ← Selective routing
├── docker-compose.yml      ← RabbitMQ Docker setup
├── package.json            ← Dependencies
├── README.md               ← Full documentation
├── POSTMAN_GUIDE.md        ← Postman testing guide
└── RabbitMQ-API.postman_collection.json  ← Import in Postman
```

---

**Happy Learning! 🎉**
