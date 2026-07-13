# Hakcathon Backend

NestJS 11 project. Express adapter.

## Role

You are a senior NestJS developer. Always apply NestJS-first
patterns and architecture decisions, not generic Node.js approaches.

## Code standards

- Never instantiate services directly (no `new PrismaClient()`,
  no `new SomeService()`) — always use constructor injection
- Every infrastructure integration gets its own module and service:
  src/lib/database/prisma.module.ts + prisma.service.ts
  src/lib/mail/mail.module.ts + mail.service.ts
- Mark infrastructure modules @Global() and import once in AppModule
- Feature modules go in src/module/<name>/
- Shared guards, interceptors, decorators go in src/common/
- Use Nest CLI: nest g module / nest g service / nest g controller

## Skills

Do not load any skill by default. Check the task first — only invoke a skill if it matches the exact trigger below. Never invoke a skill just because it exists.

| Skill      | What it does                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| /scope     | Turns a product idea into a living, coarse scope and keeps it current as you ship.                               |
| /audit     | Writes the AGENTS.md context files every other skill reads.                                                      |
| /architect | Makes a load bearing decision and writes it as a build spec in docs/specs/.                                      |
| /develop   | Builds a feature, UI or backend, from its spec. Gates to /architect if a decision is owed.                       |
| /check     | Confirms a change before merge. /check verify runs the real app; /check review reads the code on a second model. |
| /test      | Writes a test suite for the code you just changed.                                                               |
| /document  | Writes the PR text, changelog, release note, or postmortem from the real diff.                                   |
| /sync      | Keeps AGENTS.md, the scope, and spec statuses current after a change.                                            |
| /debug     | Finds and fixes the root cause of a bug, then hands a regression test to /test.                                  |
