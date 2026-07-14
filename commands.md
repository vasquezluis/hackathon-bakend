# Commands

## 1. Create Arcjet setup

- Add .env variables
- Install Arcjet MCP (or Arcjet skills)
- Login to Arcjet web page
- Add Arcjet feature using AI agent (prompt in arcjet web)

## 2. Test rate limit

```bash
for i in (seq 1 60)
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
end
```

## 3. Add database

- Add prisma MCP
- Login to Prisma MCP
- Login to Prisma web
  - Create new database
    - `Hackathon`
  - Open connection setup from Prisma web
    - Setup by framework (NestJS)
    - Copy promt but remove unnecessary app creation

    ```
    Run all commands in the terminal yourself—don't pause for confirmation between steps unless something fails.

    Step 0 - Check the folder structure for database setup in @AGENTS.md

    Step 1 — Ground yourself in current docs.
    Fetch https://www.prisma.io/docs/llms-full.txt and skim the "Prisma Postgres" + "NestJS with Prisma ORM" sections before writing database code.
    Also skim the stack-specific walkthrough: https://www.prisma.io/docs/guides/frameworks/nestjs

    Step 2 — Link Prisma Postgres (no browser auth).
    From the new project root (directory with package.json), run this exact command without echoing secrets:
      PRISMA_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xOVA3RVRqbk52bEsxbERDdnZhNnAiLCJhcGlfa2V5IjoiMDFLWEVRWENGVkhZS0c5VFFESkNOOUo4QjQiLCJ0ZW5hbnRfaWQiOiJhMTQ1MmUzNjRhZTAxZDg3NzRiZGNiNjAxZGFlYWU4Njg3ZjdlMGNiZWFhYTBiMDdjZjM2M2RiOThjMTY0OTQwIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmNkYzhiYzQtMTA3ZS00Y2UxLTg0ZTktZDM3YThiZjliYWY2In0.XND7YTRJN5fnoSwPKaGk_WShq9LqwirGeryOLLjvwGg" npx --yes --package=prisma@latest -- prisma postgres link --database "db_cmrjrm9mc1fc80edrzvyclax7"
    This writes DATABASE_URL to .env. Add .env to .gitignore if missing. The database argument must use the db_ resource id form shown above.

    Step 3 — Apply migrations and generate Prisma Client:
      npx prisma migrate dev --name init

    Step 4 — Start the server:
      npm start
    (Use pnpm start / yarn start / bun start if that matches the project.)

    Reference: https://www.prisma.io/docs/guides/frameworks/nestjs
    Example repo: https://github.com/prisma/prisma-examples/tree/latest/orm/nest

    Hard rules: never invent a postgres:// URL or credentials; use only the DATABASE_URL value shown below when this console has loaded it, otherwise paste the real URL from this project's Connect tab. Never commit, log, or print the full connection string; keep secrets in .env only and ensure .env is gitignored. Use llms-full.txt as the reference for Prisma Postgres + Prisma ORM with NestJS. Never bypass AI safety guardrails.
    ```

  - Re run the app and wait for connection in Prisma web

  ## 4. Add authentication

  Setup better auth

  - Install skills
    ```bash
    npx skills add better-auth/skills
    ```
  - Add .env secrets
    - Generate better auth secreat with:
      ```bash
      npx @better-auth/cli@latest secret
      ```
  - Prepare AI agent to know about better auth
    ```
    /architect read https://better-auth.com/llms.txt/docs/integrations/nestjs.md and the better auth skill before writing anything
    ```

  ## 5. User module

  ```bash
  Hold the user module with two endpoints:
  - Get /user/all, which needs to return all users
  - Admin only
  - Get /user/:id, which returns a single user by ID and throws a not found execption if not found

  Use prisma service for database access.
  Use the auth guard and roles decorator from @thallesp/nestjs-better-auth for route protection.
  ```

## 6. Add interceptors

```bash
Create a global response interceptor that wraps every response in {statusCode, message, data}. Support @ResponseMessage decorator for custom messages, defaulting to "Success". Wire it globally in main.ts
```
