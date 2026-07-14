# 0001. Rationale: Better Auth authentication in NestJS

**Date**: 2026-07-13

## Context

The project is a NestJS 11 backend (Express adapter) with Prisma 7.8 connected to PostgreSQL (Prisma Postgres). It already has Arcjet for rate limiting and bot detection via a global guard. The Prisma schema currently has a basic User model (autoincrement Int id) and a Post model. There is no authentication module yet, but Better Auth environment variables (BETTER_AUTH_SECRET, BETTER_AUTH_URL) are already set in the .env file.

The hackathon backend needs authentication so that routes can be protected and users can be identified by role. The two roles, PARTICIPANT and ADMIN, gate access to admin only endpoints. This is a learning project, so the design prioritizes simplicity and standard patterns over production hardening (no password reset, no profile updates, no OAuth for now).

The main integration challenge is fitting Better Auth (which manages its own handler and session cookies) into the NestJS dependency injection and global guard architecture. The @thallesp/nestjs-better-auth community library wraps this integration, providing an AuthGuard, Session decorator, and @AllowAnonymous decorator. The existing ArcjetGuard must coexist as a second global guard.

## Options considered

### Option 1: @thallesp/nestjs-better-auth library

Use the community maintained NestJS integration library for Better Auth. It provides a global AuthGuard, `@Session` decorator, `@AllowAnonymous`, and `@OptionalAuth` out of the box. Import `AuthModule.forRoot({ auth })` into AppModule. Requires disabling the Express body parser in `main.ts`.

**Pros**:
- Fits the existing @Global module and global guard pattern (ArcjetGuard, PrismaModule)
- Provides guard, decorators, and session access with zero boilerplate
- Maintained alongside Better Auth, follows its upgrade path

**Cons**:
- Community maintained (not by the Better Auth core team), beta Fastify support
- Requires disabling the body parser, which is a global change affecting all routes
- The auth instance is created outside the NestJS DI container (no constructor injection for the Prisma client it uses)

### Option 2: Manual Better Auth handler and custom guard

Mount Better Auth's request handler as a catch all route (e.g., `@All('auth/*')`) in a custom controller. Write a custom NestJS guard that checks the Better Auth session on each request. Write custom decorators for session access and anonymous access.

**Pros**:
- Full control over handler mounting, guard logic, and decorator behavior
- Could share the existing PrismaService via DI for the Better Auth Prisma adapter
- No dependency on a community library

**Cons**:
- Significantly more code to write and maintain (guard, decorators, handler, error handling)
- Reimplements what the community library already provides
- Higher risk of auth bugs in hand written guard logic (auth is security sensitive)

## Rationale

The @thallesp/nestjs-better-auth library matches the project's architecture: @Global infrastructure modules, global guards, and the `src/lib/` layout. The ArcjetGuard already follows this pattern. Adding a second global guard (AuthGuard) for session checks is consistent and NestJS idiomatic.

The manual approach would give more control, but auth infrastructure is security sensitive hand written code that the community library already solves correctly. For a hackathon learning project, the library reduces boilerplate and lets the build focus on the feature, not on reimplementing session parsing and cookie handling.

The tradeoff of creating a Prisma client outside the NestJS DI container (a second database connection) is acceptable for a hackathon. The alternative, sharing PrismaService via DI, would require the library to support async configuration which is not documented. This is a deliberate exception to the AGENTS.md rule against direct instantiation: Better Auth requires a standalone config instance imported by the module, not a NestJS injectable service. The `AuthModule` at `src/lib/auth/auth.module.ts` follows the existing `src/lib/` infrastructure pattern. There is no `auth.service.ts` because the @thallesp/nestjs-better-auth library provides the guard and session handling as part of its `AuthModule.forRoot({ auth })` registration.