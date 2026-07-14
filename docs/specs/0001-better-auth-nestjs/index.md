# 0001. Better Auth authentication in NestJS

**Date**: 2026-07-13
**Status**: In Progress

## Summary

This spec designs the authentication system for the NestJS hackathon backend using Better Auth with the Prisma adapter. Users sign up and sign in with email and password, verify their email before accessing the app, and get a role (PARTICIPANT or ADMIN). The @thallesp/nestjs-better-auth community library provides a global guard and decorators that fit the existing NestJS guard pattern (like ArcjetGuard). Sessions are single (one device at a time) and stored via cookies.

## Requirements

**User stories**:
- As a new user, I want to sign up with my email and password so that I can create an account.
- As a new user, I want to verify my email so that I can sign in.
- As a verified user, I want to sign in so that I can access protected routes.
- As a signed in user, I want to see my session info (including my role) so that I know who I am.
- As a signed in user, I want to sign out so that my session is revoked.
- As an ADMIN user, I want my role to restrict access to admin only routes.
- As a developer, I want all routes protected by default so that I do not accidentally expose endpoints.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: A user can sign up with an email and password via `POST /api/auth/sign-up/email`. The user's role is set to PARTICIPANT by default. The role field cannot be overridden by the client during sign up.
- **AC-2**: After sign up, a verification email link is generated. In development, the link is logged to the console for the user to click and verify their email address.
- **AC-3**: An unverified user cannot sign in. Attempting to sign in via `POST /api/auth/sign-in/email` with an unverified email returns an error instructing the user to verify their email.
- **AC-4**: A verified user can sign in via `POST /api/auth/sign-in/email`. A session is created and an HTTP only cookie is set.
- **AC-5**: Only one active session exists per user. Signing in on a new device revokes the previous session.
- **AC-6**: A signed in user can sign out via `POST /api/auth/sign-out`, which revokes their session and clears the cookie.
- **AC-7**: A signed in user can retrieve their current session (including user info and role) via `GET /api/auth/get-session`.
- **AC-8**: All routes are protected by default by the global AuthGuard. Routes that allow anonymous access must be decorated with `@AllowAnonymous()`.
- **AC-9**: ADMIN only routes are protected by a custom `@Admin()` decorator and RolesGuard. PARTICIPANT users receive 403 Forbidden when accessing ADMIN routes.
- **AC-10**: The Prisma schema is regenerated to include Better Auth tables (User with role enum, Session, Account, Verification) with string cuid ids. The Post model is removed. A migration is created and applied, and the Prisma client is regenerated.
- **AC-11**: The Express body parser is disabled in `main.ts` to allow Better Auth to handle raw request bodies, as required by @thallesp/nestjs-better-auth.

## Decision

**Chosen option**: Option 1, @thallesp/nestjs-better-auth library.

Use Better Auth with the @thallesp/nestjs-better-auth community library for NestJS integration. Sessions use the Prisma adapter against the existing PostgreSQL database. The auth instance lives in a standalone config file at `src/lib/auth/auth.ts`, imported by an `AuthModule` at `src/lib/auth/auth.module.ts` (following the existing `src/lib/` infrastructure pattern). A custom `RolesGuard` and `@Admin()` decorator in `src/common/` handle role based access control.

**Implementation skills**: `better-auth-best-practices` (`better-auth/better-auth`, `.agents/skills/better-auth-best-practices/`)

## Feature design

**Data model sketch**:

| Entity | Field | Type | Nullable | Notes |
|--------|-------|------|----------|-------|
| **User** | id | String | no | cuid, PK |
| | email | String | no | unique |
| | emailVerified | Boolean | no | default false |
| | name | String | yes | |
| | image | String | yes | Better Auth standard field |
| | role | Role enum | no | default PARTICIPANT |
| | createdAt | DateTime | no | default now() |
| | updatedAt | DateTime | no | updatedAt |
| | sessions | Session[] | | 1:N relation |
| | accounts | Account[] | | 1:N relation |
| **Session** | id | String | no | cuid, PK |
| | expiresAt | DateTime | no | |
| | token | String | no | unique |
| | createdAt | DateTime | no | default now() |
| | updatedAt | DateTime | no | updatedAt |
| | ipAddress | String | yes | |
| | userAgent | String | yes | |
| | userId | String | no | FK to User.id, cascade delete |
| | user | User | | N:1 relation |
| **Account** | id | String | no | cuid, PK |
| | accountId | String | no | provider account id |
| | providerId | String | no | "credential" for email/password |
| | userId | String | no | FK to User.id, cascade delete |
| | accessToken | String | yes | |
| | refreshToken | String | yes | |
| | idToken | String | yes | |
| | accessTokenExpiresAt | DateTime | yes | |
| | refreshTokenExpiresAt | DateTime | yes | |
| | scope | String | yes | |
| | password | String | yes | hashed password |
| | createdAt | DateTime | no | default now() |
| | updatedAt | DateTime | no | updatedAt |
| | user | User | | N:1 relation |
| **Verification** | id | String | no | cuid, PK |
| | token | String | no | unique |
| | expiresAt | DateTime | no | |
| | createdAt | DateTime | no | default now() |
| | updatedAt | DateTime | no | updatedAt |
| | identifier | String | no | email being verified |
| | value | String | no | verification value |

**Enum**: `Role` with values `PARTICIPANT` and `ADMIN`.

The Post model is removed from the schema.

**State transitions**:
- User: `unverified` -> `verified` (after clicking the verification link). There is no transition back to unverified.
- Session: `created` -> `revoked` (on sign out or when the user signs in on a new device, which deletes the old session).

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/auth/sign-up/email | POST | email:String (req), password:String (req), name:String (req) | user object | anonymous | 409 email already registered |
| /api/auth/sign-in/email | POST | email:String (req), password:String (req) | session cookie | anonymous | 401 invalid credentials, 403 email not verified |
| /api/auth/sign-out | POST | session cookie | success | authenticated | 401 no session |
| /api/auth/get-session | GET | session cookie | user + session | authenticated | 401 no session |
| /api/auth/verify-email | GET | token:String (query) | success | anonymous | 400 invalid or expired token |
| /api/auth/ok | GET | none | `{ status: "ok" }` | anonymous | none |

All auth endpoints are under the default `basePath` of `/api/auth`. No custom endpoints are needed in this phase.

**Key invariants**:
- Email is unique per user (database unique constraint).
- Role is always PARTICIPANT or ADMIN, never null. Defaults to PARTICIPANT at creation.
- The client cannot set the role field during sign up (enforced via Better Auth `user.additionalFields.role` with `input: false`).
- Session token is unique (database unique constraint).
- Only one active session per user (enforced via a database hook that deletes existing sessions on new session creation).
- An unverified user cannot sign in (enforced via `emailAndPassword.requireEmailVerification: true`).

**Security model**:
- All routes are protected by default by the global AuthGuard from @thallesp/nestjs-better-auth.
- Public routes (sign in, sign up, verify email, health check) are automatically allowed by the library. Custom public routes use `@AllowAnonymous()`.
- ADMIN only routes use `@Admin()` decorator plus RolesGuard. The RolesGuard reads the user role from the session on the Express request object (the @thallesp/nestjs-better-auth library attaches the session to `req.session`, so the guard accesses `req.session.user.role`) and returns 403 for non ADMIN users.
- To bootstrap the first ADMIN user, manually update the `role` column in the `User` table via Prisma Studio (`pnpm db:studio`) or a one time SQL update. This is a seed step, not an API endpoint.
- Session tokens are stored in HTTP only cookies (Better Auth default).
- CSRF protection is enabled by default in Better Auth.
- Arcjet rate limiting (10 requests per 60 seconds) applies to all routes including auth endpoints, guarding against brute force.

**Configuration required**:
- `BETTER_AUTH_SECRET`: already set in `.env`. Used by Better Auth for cookie signing and encryption.
- `BETTER_AUTH_URL`: already set in `.env`. The base URL for auth endpoints and verification links.
- `DATABASE_URL`: already set in `.env`. Used by both the PrismaService and the Better Auth Prisma adapter.

No new environment variables are needed.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: sign up, read verification link from console, verify email, sign in, call get session, sign out. Verifies AC-1, AC-2, AC-3, AC-4, AC-6, AC-7.
- Single session: sign in on device A, sign in on device B, verify the first session is no longer valid. Verifies AC-5.
- Auth and permission (anonymous): unauthenticated request to a protected route returns 401. Verifies AC-8.
- Auth and permission (role): a PARTICIPANT user calls an @Admin() route and receives 403. Verifies AC-9.

## Build plan

Ordered for the Tracer Bullet approach: stand up a thin end to end auth slice through every layer, then verify the full flow works.

1. Install `better-auth` and `@thallesp/nestjs-better-auth` via pnpm. Disable the Express body parser in `main.ts` by passing `bodyParser: false` to `NestFactory.create`. After disabling, verify that `@Body()` still works on non auth routes. The @thallesp/nestjs-better-auth library handles body parsing for its own Better Auth routes. If `@Body()` does not work on non auth routes, add Express `json()` and `urlencoded()` middleware scoped to non auth paths. Satisfies **AC-11**.

2. Create the Better Auth config file at `src/lib/auth/auth.ts`. Configure: Prisma adapter (using a Prisma client with the PrismaPg adapter, same connection string as PrismaService), `emailAndPassword.enabled: true`, `emailAndPassword.requireEmailVerification: true`, `emailVerification.sendOnSignUp: true`, `emailVerification.sendVerificationEmail` logging the verification URL to console, `user.additionalFields.role` with `input: false` (prevent client from setting role), and `databaseHooks.session.create.after` that deletes all sessions for the user (matching by `userId`) except the one just created (matching by `id`). Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**.

3. Generate the Prisma schema for Better Auth: run `npx @better-auth/cli@latest generate --output prisma/schema.prisma`. Add the `Role` enum (`PARTICIPANT`, `ADMIN`) to the schema with `@default(PARTICIPANT)` on the User role field. Remove the Post model. Run `pnpm db:migrate` to create and apply the migration. Run `pnpm db:generate` to regenerate the Prisma client. Satisfies **AC-10**.

4. Create the AuthModule at `src/lib/auth/auth.module.ts`. Import `AuthModule.forRoot({ auth })` from @thallesp/nestjs-better-auth, passing the auth instance from `auth.ts`. Mark the module `@Global()`. Import it into `AppModule`. The library registers its AuthGuard globally. The existing ArcjetGuard remains as the first global guard. Satisfies **AC-4**, **AC-6**, **AC-7**, **AC-8**.

5. Create the `@Admin()` decorator at `src/common/decorators/admin.decorator.ts` and the `RolesGuard` at `src/common/guards/roles.guard.ts`. The guard reads the user role from the Better Auth session (via the request object) and returns 403 for non ADMIN users. Apply `@Admin()` and `@UseGuards(RolesGuard)` to any admin only route. Satisfies **AC-9**.

6. Mark the existing `AppController` `GET /` endpoint with `@AllowAnonymous()` so it remains public. Satisfies **AC-8**.

7. Verify the full auth flow end to end: start the app, sign up via `POST /api/auth/sign-up/email`, read the verification URL from the console log, hit the verify endpoint, sign in, call `GET /api/auth/get-session`, sign out, and test that a PARTICIPANT gets 403 on an @Admin() route. Satisfies **AC-1** through **AC-9**.

## Consequences

**Positive**:
- Standard Better Auth setup with proven patterns, less custom auth code to maintain.
- Global guard model fits the existing NestJS architecture (ArcjetGuard precedent).
- Role enum at the database level gives type safety and prevents invalid role values.
- Single session enforcement is simple (one database hook) and effective.

**Negative / tradeoffs**:
- The Better Auth auth instance creates its own Prisma client, so the app runs two database connections. Acceptable for a hackathon, wasteful in production.
- Disabling the body parser is a global change. Any code that relied on Express body parsing may need adjustment.
- @thallesp/nestjs-better-auth is community maintained, not by the Better Auth core team. If the library falls behind, it may need to be replaced or the manual approach adopted.
- No password reset and no profile updates in this phase. Users who lose their password or want to change their name are stuck until a later phase adds this.
- If a verification token expires before the user clicks it, the user cannot sign in (blocked by `requireEmailVerification`) and there is no resend verification flow in this phase. The user would need to re sign up with the same email.

**Neutral**:
- The Post model is removed. It can be re added later when post features are built, but the authorId type will need to match the new User string id.
- Email verification is logged to console in development. A real mail service (MailModule following the existing src/lib/ pattern) will be needed when deploying for real users.

## Follow-up

- [ ] better-auth-best-practices skill conventions are not yet referenced in the root `AGENTS.md` `## Skills` section. Add a pointer so /develop and other skills know to consult it when working on auth code. The skill lives at `.agents/skills/better-auth-best-practices/`.
- [ ] Consider enrolling a scope feature in `docs/scope/` to link this spec and track its build lifecycle (Proposed to In Progress to Accepted).
- [ ] When ready for real email sending, create a `MailModule` and `MailService` at `src/lib/mail/` (following the existing `src/lib/database/` pattern), and update the `emailVerification.sendVerificationEmail` function to send real email instead of logging to console.
- [ ] When Post features are needed, re add the Post model to the Prisma schema with `authorId` as `String` (matching the User string cuid id) and run a new migration.
- [ ] Consider installing the `create-auth` community skill for Better Auth scaffolding guidance during implementation.
- [ ] If the verification token expiry lockout becomes an issue, add a resend verification email endpoint (Better Auth supports it) and expose it as a public route.