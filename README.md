# Hackathon Backend

REST API for managing hackathons. Built with NestJS 11, Prisma ORM (PostgreSQL), Better Auth, and Arcjet security.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: NestJS 11 (Express adapter)
- **Database**: PostgreSQL via Prisma ORM (Prisma Postgres)
- **Authentication**: Better Auth (email and password, email verification, roles)
- **Security**: Arcjet (rate limiting, bot detection) applied as a global guard
- **Validation**: class validator + class transformer
- **Code formatting**: Biome
- **Tests**: Jest
- **Package manager**: pnpm

## Features

- User authentication with Better Auth (sign up, sign in, email verification)
- Two roles: `ADMIN` and `PARTICIPANT`
- Hackathon CRUD (create, read, update, delete) restricted to admins
- Participants can join active hackathons
- All responses wrapped in a uniform `{ statusCode, message, data }` shape
- Arcjet rate limiting and bot protection on every route
- Input validation with class validator DTOs

## Prerequisites

- Node.js 18 or higher
- pnpm
- A PostgreSQL database (the project uses Prisma Postgres)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the `.env` file and fill in the values. You need:

```
ARCJET_KEY=           # your Arcjet key
ARCJET_ENV=           # development or production
ARCJET_MODE=          # LIVE or DRY_RUN
DATABASE_URL=         # your PostgreSQL connection string
DIRECT_URL=           # same as DATABASE_URL for Prisma Postgres
BETTER_AUTH_SECRET=   # generate with: npx @better-auth/cli@latest secret
BETTER_AUTH_URL=      # your app URL, e.g. http://localhost:3000
```

3. Run Prisma migrations and generate the client:

```bash
pnpm db:migrate
pnpm db:generate
```

## Running the App

```bash
# development (watch mode)
pnpm start:dev

# production build and run
pnpm build
pnpm start:prod
```

The server listens on port 3000 by default (override with `PORT` in `.env`).

## API Endpoints

All routes except `GET /` require authentication via Better Auth session.

### Auth (Better Auth)

Better Auth exposes its own routes under `/api/auth/*` for sign up, sign in, sign out, and email verification.

### Hackathons

| Method | Path                  | Role         | Description                    |
|--------|-----------------------|--------------|--------------------------------|
| POST   | `/hackathon`          | ADMIN        | Create a new hackathon         |
| GET    | `/hackathon`          | Authenticated | List all hackathons           |
| GET    | `/hackathon/:id`      | Authenticated | Get a single hackathon        |
| PATCH  | `/hackathon/:id`      | ADMIN        | Update a hackathon             |
| DELETE | `/hackathon/:id`      | ADMIN        | Delete a hackathon             |
| POST   | `/hackathon/:id/join` | PARTICIPANT  | Join an active hackathon       |

**Create hackathon body:**

```json
{
  "name": "Summer Code Cup",
  "description": "A 48 hour coding sprint",
  "startDate": "2026-08-01T00:00:00Z",
  "endDate": "2026-08-03T00:00:00Z",
  "isActive": true
}
```

### Users

| Method | Path         | Role           | Description                      |
|--------|--------------|----------------|----------------------------------|
| GET    | `/user/all`  | ADMIN          | List all users                   |
| GET    | `/user/:id`  | Authenticated  | Get a single user by ID          |

## Database

Prisma schema lives in `prisma/schema.prisma`. Models:

- **User** with a `role` field (`PARTICIPANT` or `ADMIN`)
- **Session** and **Account** managed by Better Auth
- **Verification** for email verification tokens
- **Hackathon** with author, dates, and active status
- **HackathonParticipant** join table (unique per user per hackathon)

### Useful commands

```bash
pnpm db:migrate    # create and apply a migration
pnpm db:generate   # regenerate the Prisma client
pnpm db:format     # format the schema file
pnpm db:studio     # open Prisma Studio (database GUI)
```

## Testing

```bash
pnpm test          # unit tests
pnpm test:e2e      # end to end tests
pnpm test:cov       # test coverage
```

## Project Structure

```
src/
  common/            # shared guards, interceptors, decorators
    decorators/      # @CurrentUser, @ResponseMessage, @Admin
    guards/         # ArcjetGuard (global)
    interceptors/   # ResponseInterceptor (wraps all responses)
  lib/               # infrastructure modules (all @Global)
    arcjet/         # Arcjet security module
    auth/           # Better Auth setup and module
    database/       # Prisma module and service
  module/           # feature modules
    hackathon/      # hackathon CRUD and join logic
    user/           # user lookup endpoints
  generated/         # Prisma client output (do not edit)
  app.module.ts      # root module
  main.ts            # bootstrap, global pipes and interceptors
prisma/
  schema.prisma      # database schema
  migrations/         # migration history
```

## Conventions

- All infrastructure modules are `@Global()` and imported once in `AppModule`
- Feature modules live in `src/module/<name>/`
- Services are injected through constructors (no manual instantiation)
- Every response is wrapped by `ResponseInterceptor` with a `@ResponseMessage` decorator for custom messages