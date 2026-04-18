# Personal Finance Distributed System (NestJS + AngularJS)

Full-stack personal-finance system with an AngularJS frontend and a distributed NestJS backend.

This repository contains:

- AngularJS 1.x SPA frontend (`personal-finance-frontend`) served by nginx in Docker mode
- Distributed NestJS backend services (`identity-service`, `ledger-service`, `reporting-service`)
- RabbitMQ (event transport)
- PostgreSQL + Prisma (per-service schema isolation)
- Transactional outbox and idempotent consumer patterns
- Synchronous service-to-service HTTP call for cross-service enrichment

## Architecture Overview

```text
AngularJS Frontend (http://localhost:8080)
  |
  +--> identity-service (HTTP, JWT issue/validate, users)
  |
  +--> ledger-service (HTTP, categories/transactions, writes + outbox)
  |         |
  |         +--> sync HTTP to identity-service (/api/internal/users/:id)
  |         |
  |         +--> RabbitMQ (transaction/category events via outbox worker)
  |
  +--> reporting-service (HTTP read API)
            ^
            |
       RabbitMQ consumer
       + idempotent inbox table
       + projection updates in reporting schema
```

Data storage is isolated by schema in one Postgres instance:

- `identity` schema for `identity-service`
- `ledger` schema for `ledger-service`
- `reporting` schema for `reporting-service`

## Service Responsibilities

### identity-service

- Registers and authenticates users
- Issues JWT access tokens
- Exposes internal user lookup endpoint for trusted services:
  - `GET /api/internal/users/:id` (guarded by `X-Internal-Secret`)
  - Swagger documents required header `x-internal-secret`

### ledger-service

- Owns categories and transactions (authoritative write model)
- Emits domain events (`transaction.created`, `transaction.deleted`, `category.created`)
- Uses transactional outbox to publish events reliably
- Demonstrates synchronous cross-service call:
  - `GET /api/transactions/summary` reads ledger data and enriches with user email from identity-service

### reporting-service

- Consumes ledger events from RabbitMQ
- Maintains denormalized reporting projections
- Serves read-only report queries:
  - `GET /api/reports/monthly`
  - `GET /api/reports/category-spend`

## Communication Patterns

### 1) Synchronous request-response (HTTP)

- Flow: `ledger-service -> identity-service`
- Used when ledger needs current user metadata for the summary response
- Security for internal demo:
  - shared `INTERNAL_SECRET` in header `X-Internal-Secret`
- Resilience in ledger client:
  - timeout (`IDENTITY_HTTP_TIMEOUT_MS`, default `1500`)
  - small retry (`IDENTITY_HTTP_RETRIES`, default `1`)
  - clear graceful failure (`503 ServiceUnavailableException`) when identity is unavailable

### 2) Asynchronous event-driven updates (RabbitMQ)

- Flow: `ledger-service -> RabbitMQ -> reporting-service`
- Ledger writes are decoupled from reporting updates
- Reporting projections are updated asynchronously

## Why This Architecture

This project is a learning/reference system, so the architecture was chosen to illustrate several real-world distributed-systems patterns in a small, self-contained codebase rather than to achieve minimal complexity.

**Monorepo with isolated services**
All three services live in one repository for convenience: shared tooling, single `npm install`, one `compose.yaml`. At the same time, each service has its own NestJS app, its own Prisma schema, its own database schema, and its own process. This keeps local development simple while still making service boundaries and inter-service contracts explicit.

**Per-service schema isolation (instead of a separate database per service)**
A separate database per service is operationally expensive to run locally. Using separate PostgreSQL schemas inside one database gives the same logical isolation — no cross-schema foreign keys, no shared migrations — while keeping the local setup to a single container.

**Synchronous HTTP for user enrichment**
The `GET /api/transactions/summary` endpoint needs the caller's email address, which is owned by `identity-service`. A synchronous call makes this dependency explicit and keeps the response self-contained. The trade-off is that `ledger-service` becomes temporarily dependent on `identity-service` availability for that specific endpoint. In this demo, that trade-off is accepted and mitigated with a short timeout, a small retry, and a clear 503 when identity is unavailable.

**Transactional outbox for reliable event publishing**
Naive dual-write (save to DB, then publish to broker) loses events whenever the broker call fails after a successful DB commit. Writing the event to an outbox row in the same transaction as the domain data, then having a background worker relay it to RabbitMQ, moves the publish into a retryable, crash-safe step.

**Idempotent consumer for safe at-least-once delivery**
RabbitMQ guarantees at-least-once delivery, meaning duplicates are possible on redelivery. The inbox table in `reporting-service` deduplicates by `(eventId, eventName)` before applying any projection change, so replaying the same message is always safe.

**Separate reporting read model**
Separating the write model (ledger) from the read model (reporting projections) allows each to be optimised independently. The write path stays simple and transactional; the read path is denormalised for fast query responses without joins across services.

## Eventual Consistency (What It Means Here)

Reporting views are eventually consistent with ledger writes.

- After a transaction is created/deleted in ledger, report endpoints may lag briefly
- Lag equals outbox polling + broker delivery + projection processing time
- This is intentional: write path stays responsive and robust, while reporting catches up

Practical implication for dev/testing:

- Validate correctness by waiting/polling for projection updates instead of expecting immediate report changes in the same request cycle

## Transactional Outbox Pattern

Implemented in `ledger-service` to avoid dual-write inconsistencies.

How it works:

1. Ledger business transaction writes domain data and an outbox row in the same DB transaction.
2. `OutboxPublisherWorker` polls unprocessed outbox rows.
3. Worker publishes event to RabbitMQ.
4. Worker marks outbox row as processed.

Why this matters:

- Prevents "DB write succeeded but event publish failed" inconsistency.
- Guarantees events are retried until published.

## Idempotent Consumer Pattern

Implemented in `reporting-service` using an inbox table (`ProjectionInboxEvent`).

How it works:

1. On event receive, consumer attempts `INSERT ... ON CONFLICT DO NOTHING` for `(eventId, eventName)`.
2. If insert succeeds, projection update is applied.
3. If insert is ignored, event is treated as duplicate and skipped.

Why this matters:

- RabbitMQ delivery is at-least-once.
- Duplicate deliveries do not corrupt reporting state.

## Failure Scenarios

This section describes the main failure modes in the system and the expected behaviour in each case.

### `identity-service` is down during a summary request

- **Affected flow:** `GET /api/transactions/summary` in `ledger-service`
- **Behaviour:** The HTTP client in `ledger-service` waits up to `IDENTITY_HTTP_TIMEOUT_MS` (default `1500 ms`), retries once (`IDENTITY_HTTP_RETRIES`), and then returns a `503 ServiceUnavailableException`.
- **Impact:** The summary endpoint is unavailable for the duration of the outage. Other ledger endpoints, such as creating or listing transactions and categories, are unaffected.
- **Recovery:** Automatic. The next request succeeds as soon as `identity-service` becomes reachable again.

### RabbitMQ is down while ledger is writing transactions

- **Affected flow:** Outbox publishing from `ledger-service`
- **Behaviour:** Domain writes still succeed, because the business data and the outbox row are committed in the same database transaction. The outbox worker continues polling, publish attempts fail, and affected rows remain unprocessed.
- **Impact:** Reporting projections stop updating while RabbitMQ is unavailable. `reporting-service` does not receive new events during that period.
- **Recovery:** Once RabbitMQ becomes reachable again, the outbox worker resumes publishing pending events and reporting projections catch up. Reporting data may lag temporarily, but events are not lost.

### `reporting-service` crashes during projection processing

- **Affected flow:** Handling `transaction.created` or `transaction.deleted` events in `reporting-service`
- **Behaviour:** If the service crashes before the projection update is committed, the message can be redelivered after restart. The inbox table (`ProjectionInboxEvent`) prevents the same event from being applied more than once.
- **Impact:** Temporary reporting downtime or delayed projection updates.
- **Recovery:** Automatic after restart. Redelivered events are processed safely, and reporting state converges to the correct result.

### Duplicate event delivery from RabbitMQ

- **Affected flow:** Any event consumed by `reporting-service`
- **Behaviour:** Before applying a projection change, the consumer attempts to record the event in the inbox table using `(eventId, eventName)` as a deduplication key. If the record already exists, the projection update is skipped.
- **Impact:** No user-visible inconsistency is expected. Duplicate delivery does not double-count reporting totals.

### PostgreSQL is down

- **Affected flow:** All services that need database access
- **Behaviour:** Requests that depend on the database fail while the connection is unavailable. Background components such as the outbox worker and reporting consumer also fail to make progress during that time.
- **Impact:** Read and write functionality is degraded or unavailable, depending on which service is affected and whether the application is already running.
- **Recovery:** Once PostgreSQL becomes reachable again, Prisma reconnects and normal processing resumes. Pending outbox rows can still be published later, and reporting can catch up from delayed or redelivered events.

### Outbox worker publishes the same message twice

- **Affected flow:** Outbox publishing in `ledger-service`
- **Behaviour:** An outbox row is marked as processed only after a successful publish. If the worker crashes after publishing but before marking the row as processed, the same row may be picked up and published again on the next polling cycle.
- **Impact:** `reporting-service` may receive the same event more than once.
- **Recovery / mitigation:** Duplicate delivery is expected at the messaging level and is handled safely by the idempotent consumer in `reporting-service`.

## Local Setup

### Prerequisites

- Node.js 24+
- Docker + Docker Compose
- npm

### 1) Install dependencies

```bash
npm install
```

### 2) Start full local stack (apps + infrastructure + frontend)

```bash
npm run docker:up
```

Services started:

- PostgreSQL: `localhost:5433`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ UI: `http://localhost:15672` (`rabbit` / `rabbit`)
- pgAdmin: `http://localhost:5051`
- AngularJS Frontend (nginx): `http://localhost:8080`
- Identity API: `http://localhost:3000/api`
- Ledger API: `http://localhost:3001/api`
- Reporting API: `http://localhost:3002/api`

The project now uses `compose.yaml` (recommended default name), so no `-f` flag is needed with either `docker compose` or `docker-compose`.

Optional infra-only mode (if you want to run Nest services on host):

```bash
npm run docker:infra:up
```

### 3) Configure environment variables (host-run mode only)

Create a root `.env` file:

```env
# Auth
JWT_SECRET=dev-jwt-secret
JWT_EXPIRES_IN=1d

# Service ports
IDENTITY_PORT=3000
LEDGER_PORT=3001
REPORTING_PORT=3002

# Database (single DB, schema-isolated access)
IDENTITY_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/personal_finance_db?schema=identity
LEDGER_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/personal_finance_db?schema=ledger
REPORTING_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/personal_finance_db?schema=reporting

# Messaging
RABBITMQ_URL=amqp://rabbit:rabbit@localhost:5672/personal_finance
OUTBOX_PUBLISHER_ENABLED=true
OUTBOX_POLL_INTERVAL_MS=2000
OUTBOX_PUBLISH_BATCH_SIZE=50

# Internal sync service-to-service auth
INTERNAL_SECRET=dev-internal-secret
IDENTITY_SERVICE_URL=http://localhost:3000
IDENTITY_HTTP_TIMEOUT_MS=1500
IDENTITY_HTTP_RETRIES=1
```

### 4) Prisma generate + migrations (host-run mode only)

```bash
npm run prisma:generate:all
npm run prisma:migrate:all
```

## Run Instructions

### Docker mode (recommended)

```bash
npm run docker:up
```

Useful commands:

```bash
npm run docker:logs
npm run docker:down
```

### Host mode (manual per-service terminals)

Run each service in a separate terminal:

```bash
npm run start:identity:dev
npm run start:ledger:dev
npm run start:reporting:dev
```

For frontend in host mode, run a static file server from `personal-finance-frontend` (for example with `npx serve`):

```bash
cd personal-finance-frontend
npx serve . -l 8080
```

Default base URLs:

- Identity: `http://localhost:3000/api`
- Ledger: `http://localhost:3001/api`
- Reporting: `http://localhost:3002/api`
- Frontend: `http://localhost:8080`

## AngularJS Frontend

AngularJS 1.x frontend is located in `personal-finance-frontend` and served by nginx in Docker mode.
It is a browser SPA that directly calls all three backend APIs.

Feature screens:

- Login/Register
- Dashboard summary
- Categories list/create
- Transactions list/create/delete
- Reports (monthly and category spend)

Default API targets used by the frontend:

- Identity: `http://localhost:3000/api`
- Ledger: `http://localhost:3001/api`
- Reporting: `http://localhost:3002/api`

CORS is enabled in all services with `FRONTEND_ORIGIN` (defaults to `http://localhost:8080`).

If you run the frontend on a different origin/port in host mode, set `FRONTEND_ORIGIN` in each backend service accordingly.

Swagger:

- Identity: `http://localhost:3000/swagger`
- Ledger: `http://localhost:3001/swagger`
- Reporting: `http://localhost:3002/swagger`

## Troubleshooting

- `npm run start:ledger:dev` fails at boot:
  - verify `IDENTITY_SERVICE_URL` and `INTERNAL_SECRET` are set
  - verify `LEDGER_DATABASE_URL` and `RABBITMQ_URL` are set
- `npm run start:reporting:dev` fails at boot:
  - verify `REPORTING_DATABASE_URL` and `RABBITMQ_URL` are set
- Sync summary endpoint fails with `503`:
  - ensure `identity-service` is running
  - ensure `INTERNAL_SECRET` value matches in both services

## Test Commands

```bash
# Unit tests
npm run test

# HTTP integration tests
npm run test:http:all

# Database integration tests
npm run test:database:all

# Full suite
npm run test:all
```

## TODO

- Add rate limiter
- Add CSRF protection
- Add a lightweight API gateway to centralize external access instead of exposing each service directly
- Add sink for logs
- Add cache.
- Add dead-letter queue handling and retry policy tuning for failed RabbitMQ message processing
- Add health check endpoints and container health probes for PostgreSQL, RabbitMQ, and all services
- Add structured observability with metrics, distributed tracing, and dashboard-ready logs
- Add contract tests for event payload compatibility between ledger-service and reporting-service
- Add end-to-end tests that validate eventual consistency from transaction write to reporting read model update
