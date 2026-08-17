export const backendSystemDesignCourse = {
  "title": "Backend System Design, Microservices, Caching & Message Queues",
  "description": "Mastering high-scale system design: Microservices vs Monolith, Redis Caching, RabbitMQ/Kafka message queues, WebSockets, Rate limiting, and OWASP security.",
  "slug": "backend-system-design-microservices-queues",
  "stream": "backend",
  "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
  "order": 1,
  "modules": [
    {
      "title": "Phase 1: High-Performance Caching & Redis In-Memory Tier",
      "description": "Cache-Aside, Write-Through, Redis data structures (Strings, Hashes, Sets, Sorted Sets), TTL expiration, and Cache Stampede prevention.",
      "slug": "phase-1-redis-caching-performance",
      "topics": [
        {
          "title": "Redis Caching Strategies & Performance Tuning",
          "description": "Implementing sub-millisecond database caching with Redis: Cache-Aside pattern, key design, TTL expiration, and rate limiting.",
          "slug": "redis-caching-strategies-performance",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Cache-Aside Pattern",
              "description": "Read from Redis cache first; on miss, query database and populate cache with TTL."
            },
            {
              "title": "Preventing Cache Stampede",
              "description": "Using mutex locking or probabilistic early expiration to prevent 10,000 DB queries when a key expires."
            }
          ],
          "examples": [
            {
              "title": "Cache-Aside with Redis and Express",
              "description": "Express endpoint with Redis caching",
              "starterCode": "async function getProduct(req, res) {\n  const { id } = req.params;\n  const cacheKey = `product:${id}`;\n  const cached = await redis.get(cacheKey);\n  if (cached) return res.json(JSON.parse(cached));\n  const product = await db.product.findUnique({ where: { id } });\n  await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600);\n  res.json(product);\n}",
              "solutionCode": "async function getProduct(req, res) {\n  const { id } = req.params;\n  const cacheKey = `product:${id}`;\n  const cached = await redis.get(cacheKey);\n  if (cached) return res.json(JSON.parse(cached));\n  const product = await db.product.findUnique({ where: { id } });\n  await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600);\n  res.json(product);\n}"
            }
          ],
          "exercises": [
            {
              "title": "Write Cache-Aside",
              "description": "Redis cache",
              "starterCode": "async function getCached() {}",
              "solutionCode": "async function getCached() {}",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "Cache-Aside Flow",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Redis Caching Strategies & Performance Tuning",
            "content": "Redis reduces database load by 95% and provides sub-millisecond response times.",
            "explanation": "Redis is the industry standard in-memory data store."
          }
        }
      ]
    },
    {
      "title": "Phase 2: Message Queues & Event-Driven Architecture (RabbitMQ, Kafka, BullMQ)",
      "description": "Decoupling microservices with asynchronous worker queues, dead-letter exchanges, BullMQ jobs, and event-driven architectures.",
      "slug": "phase-2-message-queues-kafka-rabbitmq",
      "topics": [
        {
          "title": "Asynchronous Task Queues with BullMQ & Redis",
          "description": "Handling heavy background operations (email sending, image processing, PDF generation) without blocking HTTP API requests.",
          "slug": "async-task-queues-bullmq-redis",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Producer-Consumer Queue Pattern",
              "description": "HTTP request immediately returns 202 Accepted; worker process consumes queue asynchronously."
            },
            {
              "title": "Retry Strategies & Dead Letter Queues",
              "description": "Exponential backoff for transient failures and dead-letter queues for unrecoverable errors."
            }
          ],
          "examples": [
            {
              "title": "BullMQ Job Producer & Worker",
              "description": "Creating background queue worker",
              "starterCode": "import { Queue, Worker } from 'bullmq';\n\nconst emailQueue = new Queue('emails', { connection: redisConfig });\n\n// Producer (in HTTP Controller)\nawait emailQueue.add('welcome_email', { email: 'user@example.com', name: 'Aman' }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });\n\n// Worker (in Background Process)\nconst worker = new Worker('emails', async (job) => {\n  console.log('Sending email to:', job.data.email);\n  await sendEmail(job.data);\n}, { connection: redisConfig });",
              "solutionCode": "import { Queue, Worker } from 'bullmq';\n\nconst emailQueue = new Queue('emails', { connection: redisConfig });\n\n// Producer (in HTTP Controller)\nawait emailQueue.add('welcome_email', { email: 'user@example.com', name: 'Aman' }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });\n\n// Worker (in Background Process)\nconst worker = new Worker('emails', async (job) => {\n  console.log('Sending email to:', job.data.email);\n  await sendEmail(job.data);\n}, { connection: redisConfig });"
            }
          ],
          "exercises": [
            {
              "title": "Create BullMQ Worker",
              "description": "Worker queue",
              "starterCode": "new Worker()",
              "solutionCode": "new Worker()",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "Queue Flow",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Asynchronous Task Queues with BullMQ & Redis",
            "content": "Message queues prevent backend servers from crashing under high load spikes.",
            "explanation": "Queues are critical for reliable background processing."
          }
        }
      ]
    }
  ]
};
