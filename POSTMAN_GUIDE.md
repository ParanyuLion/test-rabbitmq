# 🚀 Testing RabbitMQ REST API with Postman

## Quick Start

1. **Server is running at:** `http://localhost:3000`
2. **Import the collection:** `RabbitMQ-API.postman_collection.json`
3. **Start testing!**

---

## 📋 Test Scenarios

### Scenario 1: Basic Queue (Hello World)

**Goal:** Send and receive a simple message

**Steps:**

1. `POST /api/basic/send` - Send a message

   ```json
   {
     "message": "Hello from Postman!"
   }
   ```

2. `GET /api/basic/consume` - Retrieve the message

**Expected Response:**

```json
{
  "status": "success",
  "message": "Hello from Postman!",
  "queue": "hello"
}
```

---

### Scenario 2: Work Queue (Task Distribution)

**Goal:** Add multiple tasks and see them distributed among workers

**Steps:**

1. **Add tasks via API:**

   ```
   POST /api/work-queue/add-task
   {
     "task": "Process image optimization...."
   }
   ```

   Send this 3-4 times with different tasks:

   - "Send email notification.."
   - "Generate PDF report..."
   - "Encode video file...."

2. **Check stats:**

   ```
   GET /api/work-queue/stats
   ```

   You should see the pending message count

3. **In a separate terminal, run workers:**

   ```bash
   npm run work-consumer
   npm run work-consumer
   ```

   Watch the workers pick up tasks!

---

### Scenario 3: Pub/Sub (Broadcasting)

**Goal:** Send one message to multiple subscribers

**Steps:**

1. **In Terminal 1, start subscriber 1:**

   ```bash
   npm run pubsub-consumer1
   ```

2. **In Terminal 2, start subscriber 2:**

   ```bash
   npm run pubsub-consumer2
   ```

3. **In Postman, publish messages:**
   ```
   POST /api/pubsub/publish
   {
     "message": "System maintenance in 30 minutes"
   }
   ```

**Expected Result:**

- Both subscribers receive the same message
- Console logger displays it in Terminal 1
- File logger saves it to `logs/application.log` in Terminal 2

---

### Scenario 4: Routing (Selective Message Delivery)

**Goal:** Route messages based on severity level

**Steps:**

1. **In Terminal 1, start error receiver:**

   ```bash
   npm run routing-consumer-error
   ```

2. **In Terminal 2, start all logs receiver:**

   ```bash
   npm run routing-consumer-all
   ```

3. **In Postman, emit logs with different severities:**

   **Info log:**

   ```
   POST /api/routing/emit
   {
     "severity": "info",
     "message": "User login successful"
   }
   ```

   Result: Only Terminal 2 receives this

   **Warning log:**

   ```
   POST /api/routing/emit
   {
     "severity": "warning",
     "message": "Memory usage above 80%"
   }
   ```

   Result: Only Terminal 2 receives this

   **Error log:**

   ```
   POST /api/routing/emit
   {
     "severity": "error",
     "message": "Database connection failed"
   }
   ```

   Result: Both terminals receive this!

**Key Learning:** Routing filters messages based on binding keys

---

## 🔍 API Response Examples

### Successful Request

```json
{
  "status": "success",
  "message": "Message sent to queue 'hello': \"Hello World\"",
  "queue": "hello"
}
```

### Error Response

```json
{
  "error": "Message is required",
  "example": {
    "message": "Hello World"
  }
}
```

### Work Queue Stats

```json
{
  "queue": "task_queue",
  "messageCount": 5,
  "consumerCount": 2
}
```

---

## 💡 Learning Points

### Basic Queue

- **1-to-1** messaging model
- Queue acts as a buffer
- Messages are consumed one at a time

### Work Queue

- **1-to-Many** with fair distribution
- Great for parallel task processing
- Durable messages survive restarts
- Acknowledgments ensure reliability

### Pub/Sub

- **1-to-Many** broadcast
- All subscribers get all messages
- Fanout exchange distributes to all bindings
- Each subscriber has its own queue

### Routing

- **Selective 1-to-Many** delivery
- Messages routed by severity/type
- Supports complex filtering
- Multiple bindings per queue allowed

---

## 🐛 Troubleshooting

### "Connection Refused"

```
Make sure Docker and RabbitMQ are running:
docker ps
```

### "Queue doesn't exist"

- The API automatically creates queues
- Check RabbitMQ Management UI: http://localhost:15672

### No messages received by consumers?

- Consumer processes may have crashed
- Restart: `npm run work-consumer` etc.
- Check terminal output for errors

### Want to clear all queues?

```bash
docker exec rabbitmq rabbitmqctl purge_queue hello
docker exec rabbitmq rabbitmqctl purge_queue task_queue
```

---

## 📚 Next Steps

1. **Try all 4 scenarios** with Postman
2. **Combine scenarios** - use API + CLI consumers together
3. **Monitor in RabbitMQ UI** - see queues in real-time
4. **Modify messages** - try different payloads
5. **Scale workers** - run multiple consumers and see load distribution

Happy learning! 🎉
