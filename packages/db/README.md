# @shipflow/db

Prisma schema + a couple of small utilities shared across the monorepo.

## Auth tables

`User`, `Session`, `Account`, and `Verification` in `schema.prisma` follow
[Better Auth's Prisma adapter contract](https://www.better-auth.com/docs/adapters/prisma)
exactly — field names, types, and the `@@map()` table names all matter. If
you add a Better Auth plugin that needs extra fields (e.g. `additionalFields`
on `user` or `session`), add the matching column here first, then update
`apps/web/src/lib/auth.ts`.

## Commands

```bash
npm run db:generate   # regenerate the Prisma client from schema.prisma
npm run db:push       # push schema to the database (no migration history — fine for dev)
npm run db:migrate    # create a real migration (use this once you have production data)
npm run db:seed       # seed a demo workspace (run after your first sign-up)
npm run db:studio     # Prisma Studio, a GUI for the database
```

## Encryption

`src/encryption.ts` handles AES-256-GCM encrypt/decrypt for BYOK provider
keys. It's deliberately small and dependency-free (just Node's built-in
`crypto`) — see the file's own comments for the exact rotation story if
`ENCRYPTION_KEY` ever needs to change.


