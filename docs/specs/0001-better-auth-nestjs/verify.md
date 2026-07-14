# Verify: Authentication · spec 0001 · updated 2026-07-13

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Start the app (`pnpm start:dev`), then `POST /api/auth/sign-up/email` with email, password, name → 201 response with user object, role is PARTICIPANT → AC-1
- [ ] Check the console for a verification link after sign up → link is logged to console → AC-2
- [ ] `POST /api/auth/sign-in/email` with the unverified email → error response telling user to verify email → AC-3
- [ ] Click the verification link (or `GET` it with curl) → success response → email is now verified
- [ ] `POST /api/auth/sign-in/email` with verified email and correct password → 200 response, Set Cookie header present → AC-4
- [ ] `GET /api/auth/get-session` with the session cookie → 200 response with user info and role → AC-7
- [ ] `POST /api/auth/sign-out` with the session cookie → success response, cookie cleared → AC-6
- [ ] `GET /api/auth/get-session` without a cookie after sign out → 401 → AC-6
- [ ] Sign in on device A (curl 1), then sign in again on device B (curl 2 with same credentials) → device B gets a new session → then `GET /api/auth/get-session` with device A cookie → 401 (session revoked) → AC-5
- [ ] `GET /` without authentication → 200 (Hello World) → AC-8
- [ ] `GET /api/auth/get-session` without authentication → 401 → AC-8
- [ ] Create a test route with `@Admin()` and `@UseGuards(RolesGuard)`, sign in as PARTICIPANT, call it → 403 Forbidden → AC-9
- [ ] Update a user role to ADMIN via Prisma Studio (`pnpm db:studio`), sign in, call the @Admin() route → 200 → AC-9

## Commands

- [ ] `pnpm db:migrate` → migration named `auth` applied, `prisma/migrations/20260713232113_auth/migration.sql` exists → AC-10
- [ ] Database introspection: tables `user`, `session`, `account`, `verification` exist with correct columns; no `Post` table; `Role` enum type exists with values PARTICIPANT, ADMIN → AC-10
- [ ] `pnpm build` → compiles with no errors → AC-11
- [ ] `pnpm lint` → no errors → AC-11
- [ ] `grep "bodyParser: false" src/main.ts` → found → AC-11
- [ ] `GET /api/auth/ok` → `{ status: "ok" }` → library health check

## Acceptance criteria coverage

- AC-1 covered by: sign up step (role defaults to PARTICIPANT, client cannot set role)
- AC-2 covered by: console verification link step
- AC-3 covered by: unverified sign in step
- AC-4 covered by: verified sign in step
- AC-5 covered by: single session step (device A revoked after device B sign in)
- AC-6 covered by: sign out step (cookie cleared, get session returns 401)
- AC-7 covered by: get session step
- AC-8 covered by: public route (GET /) and protected route (get session without cookie)
- AC-9 covered by: Admin route 403 for PARTICIPANT, 200 for ADMIN
- AC-10 covered by: migration applied, schema introspected
- AC-11 covered by: body parser disabled, build and lint pass