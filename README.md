# ShipFlow AI

A workflow orchestrator that turns a raw feature request into a structured PRD, breaks it into tasks, and has AI review every GitHub pull request against that PRD before a human approves it.

This is a real, working Turborepo monorepo — not a mockup. See **"What's fully working vs. what needs your credentials"** below before you judge anything as broken.

## Quick start

```bash
# 1. Start Postgres
docker compose up -d

# 2. Configure env
cp .env.example .env
# Fill in BETTER_AUTH_SECRET and ENCRYPTION_KEY at minimum:
#   openssl rand -base64 32   (run twice, once per value)

# 3. Install and generate the Prisma client
npm install
npm run db:generate
npm run db:push

# 4. Run it
npm run dev
```

Open http://localhost:3000, sign up, and you'll land in onboarding: create a workspace → add an AI provider key (OpenAI or Anthropic — bring your own) → optionally connect GitHub → optionally invite teammates.

Want sample data instead of starting empty? After your first sign-up: `npm run db:seed`.

## What's fully working vs. what needs your credentials

| Area | Status |
|---|---|
| Landing page, auth, onboarding | Fully working |
| Multi-tenancy, RBAC (Admin/Developer/Reviewer) | Fully working, enforced server-side in `packages/api/src/trpc.ts` + `permissions.ts` |
| BYOK (OpenAI/Anthropic keys, encrypted at rest, test-connection) | Fully working |
| PRD discovery chat + structured PRD generation | Fully working once a workspace has an AI key |
| Kanban board (drag and drop) | Fully working |
| GitHub App connection, webhook receiver, AI review loop | **Real code, needs your GitHub App + Inngest dev server to run end to end** — see below |
| Razorpay billing | **Schema + UI done; checkout is stubbed** — needs a live merchant account |

### To light up the GitHub review loop locally

1. Register a GitHub App (https://github.com/settings/apps) with Pull requests (read/write), Contents (read), Metadata (read) permissions, webhook subscribed to `pull_request`, webhook URL `http://localhost:3000/api/webhooks/github` (use `ngrok http 3000` for a real PR to reach your machine).
2. Put its App ID, private key, and webhook secret in `.env` (`GITHUB_APP_*`).
3. Run the Inngest dev server alongside `npm run dev`: `npx inngest-cli@latest dev`.
4. Install the app on a repo from Settings → GitHub in the product, link a task to a PR, open a PR — the review should run and comment back.

None of this blocks the rest of the product — everything else works without it.

## Project structure

```
apps/web             Next.js 16 app — pages, API routes, all UI
packages/db           Prisma schema + encryption utility for BYOK keys
packages/api          tRPC routers, RBAC, permissions
packages/github       Octokit client, webhook signature verification, diff chunking
packages/inngest      The AI review background job
```

See `ARCHITECTURE.md` for the data model, key design decisions, and why things are built the way they are.

## Deploying to Netlify

Yes, this runs on Netlify — Next.js 16 deploys there with zero extra config beyond what's already in `netlify.toml` (it points the build at `apps/web` inside this Turborepo and generates the Prisma client first). A few things Netlify itself doesn't provide, though:

1. **A database.** Netlify doesn't host Postgres. Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both have a free tier and, importantly, built-in **connection pooling**, which you need here: every request runs as its own serverless function, and Prisma without a pooler exhausts Postgres's connection limit fast. Use the pooled connection string they give you as `DATABASE_URL`.
2. **Environment variables**, set in Netlify's dashboard (Site configuration → Environment variables), not in `.env` (that file never leaves your machine): everything from `.env.example`, plus set `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to your actual Netlify URL (e.g. `https://shipflowai.netlify.app`) — auth cookies, OAuth callbacks, and invite links all depend on this being correct, not `localhost`.
3. **Update callback URLs** on the GitHub OAuth App and GitHub App to point at your Netlify domain instead of localhost.
4. **Inngest in production** needs a real [Inngest Cloud](https://app.inngest.com) account (the local `inngest-cli dev` server is dev-only) — set `INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY`, and register your deployed `/api/inngest` URL with them.
5. **Function timeouts**: Netlify serverless functions cap at 10s (free) / 26s (Pro). The AI review loop is already broken into per-chunk Inngest steps for this exact reason (each step is its own function call, not one long one) — but a very slow provider response on the PRD discovery chat could still bump into this on the free tier. Not a blocker, just worth knowing if a response ever cuts off.

None of this is unique to ShipFlow — it's the standard shape of "Next.js + Postgres + background jobs" on any serverless host (Netlify, Vercel, Cloudflare all have the same three gaps: no DB, no long-running workers, function time limits).

## A note on how this was built

The UI is built on [Astryx](https://github.com/facebook/astryx), Meta's newly open-sourced React design system (`@astryxdesign/core` + the `theme-matcha` theme) rather than hand-rolled components — real accessible components, 150+ of them, instead of another shadcn clone. The `matcha` theme's earthy green/cream palette is what gives this its visual identity.

One honest limitation: this was built in a sandboxed environment without network access to Prisma's engine-binary CDN, so `prisma generate` couldn't be run or verified here. The first real deploy caught what that cost: a handful of places where a function was passed to a `clickAction` prop without discarding its return value — invisible with Prisma's client stubbed as `any` (which is bidirectionally compatible with everything), real once actual types existed. Once one showed up in a build log, I went back through the whole codebase for the same category — every `clickAction`, every cast from a Prisma `Json` field to a concrete array type, every direct type assertion touching a Prisma-derived shape — and fixed what that specific failure mode could hit, not just the one reported instance. `npm run db:generate` is still the first thing to run and watch closely; that's the one verification step this build genuinely couldn't do for you.


