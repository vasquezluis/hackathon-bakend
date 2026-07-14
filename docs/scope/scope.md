# Scope: Hackathon Backend

A NestJS 11 backend for a hackathon, learning project. Uses Prisma with PostgreSQL, Arcjet for security, and Better Auth for authentication.

**Build approach:** Tracer Bullet (thin end to end slices through every layer).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Authentication | Foundation | in-progress |

## Foundations

### 1. Authentication · in-progress

Email and password authentication with Better Auth. Email verification required before sign in. Users get a role (PARTICIPANT or ADMIN) that cannot be set during sign up. Single session per user. All routes protected by default.

**Done when:** users can sign up, verify email, sign in, sign out, get their session with role, and ADMIN only routes return 403 for PARTICIPANT users.

- [x] Design it (spec): `/architect authentication`
- [x] Build it: `/develop authentication`
   - [x] Setup: install deps, disable body parser, create Better Auth config (AC-1, AC-2, AC-3, AC-5, AC-11)
   - [x] Schema: generate Better Auth tables, add Role enum, drop Post, migrate and regenerate (AC-10)
   - [x] NestJS integration: AuthModule, RolesGuard, @Admin() decorator, mark public routes (AC-4, AC-6, AC-7, AC-8, AC-9)
- [ ] Verify it: `/check verify authentication`
- [ ] Test it: `/test authentication`

Spec [0001](../specs/0001-better-auth-nestjs/index.md)