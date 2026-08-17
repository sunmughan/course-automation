# Platform Production Infrastructure & Architecture

This document describes the production infrastructure, worker topologies, caching strategy, rate limiting policies, database connection pool configuration, and disaster recovery procedures for the **SkillForge Platform**.

---

## 1. Production Architecture Overview

```text
               +-----------------------------------------+
               |           Load Balancer (HTTPS)         |
               +-----------------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
        +-----------------------+       +-----------------------+
        |   API Web Instance 1  |       |   API Web Instance 2  |
        +-----------------------+       +-----------------------+
                    |                               |
        +-----------+-----------+       +-----------+-----------+
        |                       |       |                       |
        v                       v       v                       v
+---------------+       +---------------+       +---------------+
|   PostgreSQL  |       | Redis Cluster |       |  AI Gateway   |
| (PgBouncer)   |       | (Distributed) |       | (Circuit Brk) |
+---------------+       +---------------+       +---------------+
        |                       |
        |                       v
        |           +-----------------------+
        |           | Execution Worker Pool |
        |           |   (Sandboxed V8/Node) |
        |           +-----------------------+
```

---

## 2. Infrastructure Components

### 2.1 Caching & Distributed State (Redis)
- **Primary Role**: Rate limiting counters, session stores, fast token-bucket state, and cached curriculum metadata.
- **Resilience**: `src/lib/infra/redis.ts` features an automatic in-memory fallback mechanism ensuring zero deployment downtime and local development simplicity when Redis is optional.

### 2.2 Execution Worker Pool
- **Implementation**: `src/lib/infra/worker-pool.ts`.
- **Concurrency**: Manages async job queues with controlled concurrency limits (default: 4 concurrent sandbox jobs per instance).
- **Telemetry**: Real-time worker health, active/idle count, queue depth, and average runtime tracking.

### 2.3 Rate Limiting Policies
- **Implementation**: `src/lib/infra/rate-limiter.ts`.
- **Tiers**:
  - `public`: 60 requests / minute.
  - `authenticated`: 180 requests / minute.
  - `code_execution`: 30 runs / minute.
  - `ai_generation`: 20 requests / minute.
- **Headers**: Emits `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### 2.4 Health Probing & Observability
- **Health Check Endpoint**: `/api/health` probes:
  - PostgreSQL database connectivity & query latency.
  - Redis cache ping and latency.
  - Execution worker queue depth and status.
  - AI Gateway provider availability.
- **Distributed Tracing**: `src/lib/infra/tracer.ts` generates trace IDs and span timings across critical requests.

---

## 3. Database Connection Pooling & Tuning

### 3.1 Recommended Settings (`DATABASE_URL`)
```text
DATABASE_URL="postgresql://user:password@pg-host:5432/platform?connection_limit=20&pool_timeout=10"
```

### 3.2 PgBouncer / Connection Pooler Configuration
- `pool_mode = transaction`
- `max_client_conn = 1000`
- `default_pool_size = 25`
- `reserve_pool_size = 5`

---

## 4. Disaster Recovery & Backup Procedures

### 4.1 Automated Daily Database Backups
```bash
# Automated snapshot dump (pg_dump)
pg_dump -Fc -h $PG_HOST -U $PG_USER $PG_DATABASE > backup_$(date +%Y%m%d_%H%M%S).dump
```

### 4.2 Point-In-Time Recovery (PITR)
1. Restore base snapshot into a standby instance.
2. Replay Write-Ahead Logs (WAL) up to the recovery timestamp.
3. Validate database schema and data integrity.
4. Promote standby to primary and update DNS.

### 4.3 Redis State Failover
- Redis is non-authoritative (used for caching, rate limiting, and ephemeral queue locks). In the event of total Redis failure, the platform automatically switches to local memory stores without interrupting core lesson, assessment, or interview workflows.
