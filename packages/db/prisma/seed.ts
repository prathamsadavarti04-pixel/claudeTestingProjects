import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds one demo workspace with a PRD, a few tasks in different kanban
 * columns, and a subscription row. Does NOT create a user or session —
 * sign up for real through the app, then run this and it'll attach the
 * demo workspace to the first user it finds.
 */
async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log(
      "No users yet — sign up in the app first (npm run dev), then re-run `npm run db:seed`."
    );
    return;
  }

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo",
      members: {
        create: { userId: user.id, role: "ADMIN" },
      },
      subscription: {
        create: { tier: "FREE", aiReviewsLimit: 25 },
      },
    },
  });

  const prd = await prisma.prd.upsert({
    where: { id: "seed-prd-rate-limiting" },
    update: {},
    create: {
      id: "seed-prd-rate-limiting",
      workspaceId: workspace.id,
      authorId: user.id,
      title: "Add rate limiting to the public API",
      status: "READY",
      rawRequest:
        "We keep getting hammered by a few misbehaving API clients. Need per-key rate limits.",
      problem:
        "A small number of API keys send disproportionate traffic, degrading latency for every other tenant on shared infrastructure.",
      goals: [
        "Cap requests per API key to a configurable per-minute limit",
        "Return a standard 429 response with Retry-After when a key is over its limit",
        "Let Pro-tier workspaces set a higher limit than Free-tier",
      ],
      userStories: [
        {
          asA: "API consumer",
          iWant: "a clear error when I'm rate limited",
          soThat: "I can back off and retry instead of guessing why requests fail",
        },
        {
          asA: "workspace admin",
          iWant: "to see my current rate limit and usage",
          soThat: "I know when I'm close to being throttled",
        },
      ],
      edgeCases: [
        "Requests that arrive in the same millisecond across multiple server instances must still be counted correctly",
        "A key that's rate limited mid-burst shouldn't have earlier, valid requests fail retroactively",
        "Limit changes (e.g. a plan upgrade) should apply within the same rate-limit window, not just the next one",
      ],
    },
  });

  const tasks: Array<{ title: string; status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BACKLOG"; description: string }> = [
    {
      title: "Add Redis-backed sliding window counter",
      status: "IN_PROGRESS",
      description: "Per-API-key counter keyed by minute bucket, using Redis INCR + EXPIRE.",
    },
    {
      title: "Return 429 with Retry-After header",
      status: "TODO",
      description: "Middleware that checks the counter before the request handler runs.",
    },
    {
      title: "Show current usage in workspace settings",
      status: "BACKLOG",
      description: "Small usage bar on Settings → General, refreshed every 30s.",
    },
    {
      title: "Wire Pro-tier limit override",
      status: "BACKLOG",
      description: "Read the limit from Subscription.tier instead of a hardcoded constant.",
    },
  ];

  for (const [i, t] of tasks.entries()) {
    await prisma.task.upsert({
      where: { id: `seed-task-${i}` },
      update: {},
      create: {
        id: `seed-task-${i}`,
        workspaceId: workspace.id,
        prdId: prd.id,
        title: t.title,
        description: t.description,
        status: t.status,
        order: i,
        assigneeId: user.id,
      },
    });
  }

  console.log(`Seeded workspace "${workspace.name}" (/${workspace.slug}) for ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


