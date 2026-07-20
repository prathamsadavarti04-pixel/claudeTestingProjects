import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";
import { prisma, type Role } from "@shipflow/db";
import { can, type Action } from "./permissions";

/**
 * Shape returned by `auth.api.getSession()` (Better Auth). Kept as its own
 * field (not spread into ctx) so it's obvious in every middleware exactly
 * where an authenticated user came from.
 */
export interface AuthSession {
  session: { id: string; userId: string; expiresAt: Date };
  user: { id: string; email: string; name: string; image?: string | null };
}

export interface CreateContextOptions {
  authSession: AuthSession | null;
}

export function createTRPCContext(opts: CreateContextOptions) {
  return {
    authSession: opts.authSession,
    prisma,
  };
}

type Context = ReturnType<typeof createTRPCContext>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// ----------------------------------------------------------------------------
// Auth: any signed-in user
// ----------------------------------------------------------------------------

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.authSession?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
  }
  return next({
    ctx: { ...ctx, user: ctx.authSession.user },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// ----------------------------------------------------------------------------
// Workspace membership: every input on a workspace-scoped procedure must
// include `workspaceId`. This middleware reads it via getRawInput (before
// Zod parsing runs) so it works regardless of each router's own input
// schema, verifies membership, and attaches { user, workspaceId, role }.
// ----------------------------------------------------------------------------

const workspaceInputShape = z.object({ workspaceId: z.string().min(1) });

const isWorkspaceMember = t.middleware(async ({ ctx, next, getRawInput }) => {
  if (!ctx.authSession?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
  }

  const raw = await getRawInput();
  const parsed = workspaceInputShape.safeParse(raw);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This procedure requires a workspaceId.",
    });
  }

  const membership = await ctx.prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: parsed.data.workspaceId,
        userId: ctx.authSession.user.id,
      },
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You're not a member of this workspace.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.authSession.user,
      workspaceId: parsed.data.workspaceId,
      role: membership.role,
    },
  });
});

/** Use for any procedure that operates on a single workspace's data. */
export const workspaceProcedure = t.procedure.use(isWorkspaceMember);

/**
 * Chain after workspaceProcedure to gate an action by role, e.g.:
 *   workspaceProcedure.use(requirePermission("pr:approve")).mutation(...)
 * This is the actual enforcement point for the "Developers can't approve
 * their own PRs" rule — not a UI-level check.
 */
export function requirePermission(action: Action) {
  return t.middleware(async ({ ctx, next }) => {
    const role = (ctx as unknown as { role?: Role }).role;
    if (!role || !can(role, action)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Your role (${role ?? "none"}) doesn't have permission to do this.`,
      });
    }
    return next({ ctx });
  });
}


