# B2C Reservation API

Backend for a restaurant table booking platform. Guests find restaurants and reserve tables; restaurant owners onboard their venues, manage tables and staff, and pay for a subscription through Stripe.

Built with NestJS, PostgreSQL, Redis/BullMQ and Stripe.

## Features

- **Two account types** – guests (`users`) and business accounts (`workers`) live in separate tables with separate auth endpoints. The JWT carries the account kind, so every access check looks at both kind and id.
- **Worker roles** – `ADMIN` (platform admin, created by a seed script), `OWNER`, `MANAGER`, `STAFF`.
- **Restaurants** – onboarding flow (`IN_PROGRESS -> PAYMENT_PENDING -> COMPLETED`), addresses, tables, employees and guest reviews.
- **Reservations** – statuses `PENDING`, `CONFIRMED`, `CANCELED`, `COMPLETED`, `NO_SHOW`, with confirmation emails.
- **Subscriptions & billing** – `TEST` and `MONTHLY` plans, manual or auto renewal, Stripe Checkout and webhooks, payment history.
- **Background jobs** – BullMQ queues on Redis for subscription expiry, renewal, payment reminders and outgoing mail.
- **Email** – Nodemailer over Gmail SMTP; every sent email is logged in the database.
- **Ops** – Swagger docs, health check (Postgres + Redis), structured logging with pino, global validation and exception filter.

## Tech stack

| Area       | Tools                                       |
| ---------- | ------------------------------------------- |
| Framework  | NestJS 11, TypeScript                       |
| Database   | PostgreSQL 16, TypeORM (migrations)         |
| Queues     | Redis 7, BullMQ                             |
| Payments   | Stripe                                      |
| Auth       | Passport JWT, bcrypt                        |
| Email      | Nodemailer                                  |
| Docs       | Swagger (`@nestjs/swagger`)                 |
| Logging    | nestjs-pino                                 |
| Testing    | Jest, Supertest                             |

## Getting started

### Prerequisites

- Node.js 22+
- Docker and Docker Compose
- A Stripe account (test mode) and the [Stripe CLI](https://docs.stripe.com/stripe-cli) for webhooks
- A Gmail account with an [app password](https://support.google.com/accounts/answer/185833) for sending email

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your env file and fill it in (see "Environment variables")
cp .env.example .env

# 3. Start PostgreSQL and Redis
docker compose up -d

# 4. Apply database migrations
npm run migration:run

# 5. Create the platform admin (uses ADMIN_EMAIL / ADMIN_PASSWORD from .env)
npm run seed:admin

# 6. Start the API in watch mode
npm run start:dev
```

The API runs on `http://localhost:3000` (override with `PORT`).

> **Note:** `docker-compose.yml` only starts Postgres and Redis — the app itself runs on your machine. Set `DATABASE_HOST=localhost` and `REDIS_HOST=localhost` in `.env` (the example file uses Docker service names).

## Environment variables

| Variable                | Required | Description                                                    |
| ----------------------- | :------: | -------------------------------------------------------------- |
| `PORT`                  |          | HTTP port, default `3000`                                      |
| `DATABASE_HOST`         |    +     | Postgres host (`localhost` when running the app locally)       |
| `DATABASE_PORT`         |    +     | Postgres port, default `5432`                                  |
| `DATABASE_USER`         |    +     | Postgres user                                                  |
| `DATABASE_PASSWORD`     |    +     | Postgres password                                              |
| `DATABASE_NAME`         |    +     | Postgres database name                                         |
| `JWT_SECRET`            |    +     | Secret used to sign access tokens                              |
| `JWT_EXPIRES_IN`        |          | Token lifetime, default `1d`                                   |
| `ADMIN_EMAIL`           |  seed    | Admin email for `npm run seed:admin`                           |
| `ADMIN_PASSWORD`        |  seed    | Admin password for `npm run seed:admin`                        |
| `STRIPE_PUBLIC_KEY`     |    +     | Stripe publishable key                                         |
| `STRIPE_SECRET_KEY`     |    +     | Stripe secret key                                              |
| `STRIPE_PRICE_TEST`     |    +     | Stripe price id for the `TEST` plan                            |
| `STRIPE_PRICE_MONTH`    |    +     | Stripe price id for the `MONTHLY` plan                         |
| `STRIPE_WEBHOOK_SECRET` |    +     | Signing secret for `/stripe/webhook`                           |
| `REDIS_HOST`            |    +     | Redis host                                                     |
| `REDIS_PORT`            |    +     | Redis port, usually `6379`                                     |
| `EMAIL_USER`            |    +     | Gmail address used as the sender                               |
| `EMAIL_PASS`            |    +     | Gmail app password                                             |
| `FRONTEND_URL`          |    +     | Frontend base URL, used for links in emails                    |
| `LOG_LEVEL`             |          | `debug` \| `info` \| `warn` \| `error`, default `info`         |

## Stripe webhooks (local development)

Forward Stripe events to the local API with the Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:3000/stripe/webhook
```

Copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET` and restart the app.

Handled events: `checkout.session.completed`, `checkout.session.expired`, `invoice.payment_succeeded`, `invoice.payment_failed`.

## API documentation

Interactive Swagger UI: **http://localhost:3000/api**

Use the **Authorize** button with a token from one of the login endpoints.

| Resource                                   | Description                                         |
| ------------------------------------------ | --------------------------------------------------- |
| `/auth`                                    | Guest register / login / me                         |
| `/auth/business`                           | Business (worker) register / login / me             |
| `/users`                                   | Guest user management                               |
| `/restaurants`                             | Restaurants and addresses                           |
| `/restaurants/:restaurantId/tables`        | Restaurant tables                                   |
| `/restaurants/:restaurantId/reservations`  | Table reservations                                  |
| `/restaurants/:restaurantId/employees`     | Managers and staff                                  |
| `/restaurants/:restaurantId/reviews`       | Guest reviews                                       |
| `/subscriptions`                           | Create, activate and expire subscriptions           |
| `/billing`                                 | Current plan, payment history, Stripe checkout      |
| `/stripe`                                  | Stripe webhook endpoint                             |
| `/emails`                                  | Email log and manual sends                          |
| `/health`                                  | Health check (Postgres + Redis)                     |

## Project structure

```
src/
├── auth/            # JWT auth, guards (roles, account kind), decorators
├── billings/        # Billing overview and Stripe checkout for restaurants
├── common/          # Shared DTOs, pagination, exception filter
├── database/        # TypeORM data source, migrations, seeds
├── health/          # Health checks
├── mail/            # Email templates, sending, mail queue processor
├── payments/        # Payment records
├── redis/           # Redis connection
├── restaurants/     # Restaurants + nested modules:
│   ├── employees/
│   ├── reservations/
│   └── tables/
├── reviews/         # Restaurant reviews
├── stripe/          # Stripe client and webhook handling
├── subscriptions/   # Plans, lifecycle, scheduled jobs (BullMQ)
├── users/           # Guest accounts
├── workers/         # Business accounts and roles
├── app.module.ts
└── main.ts
test/                # End-to-end tests
```

## Database and migrations

The schema is managed only through migrations (`synchronize` is disabled). Migrations live in `src/database/migrations/`.

```bash
# Generate a migration from entity changes
npm run migration:generate -- src/database/migrations/<MigrationName>

# Apply pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

## Testing

```bash
npm test          # unit tests
npm run test:cov  # unit tests with coverage report
npm run test:e2e  # end-to-end tests
```

Unit tests currently cover the `auth` and `users` modules.

## Scripts

| Script                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| `npm run start`              | Start the app                            |
| `npm run start:dev`          | Start in watch mode                      |
| `npm run start:debug`        | Start in debug + watch mode              |
| `npm run start:prod`         | Run the compiled build (`dist/main`)     |
| `npm run build`              | Compile to `dist/`                       |
| `npm run lint`               | Lint and auto-fix                        |
| `npm run format`             | Format with Prettier                     |
| `npm run migration:generate` | Generate a migration                     |
| `npm run migration:run`      | Apply migrations                         |
| `npm run migration:revert`   | Revert the last migration                |
| `npm run seed:admin`         | Create the platform admin                |
| `npm test`                   | Run unit tests                           |
| `npm run test:watch`         | Run unit tests in watch mode             |
| `npm run test:cov`           | Run unit tests with coverage             |
| `npm run test:e2e`           | Run end-to-end tests                     |
