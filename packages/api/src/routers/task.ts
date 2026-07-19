import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, workspaceProcedure, requirePermission } from "../trpc";

const taskStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);

export const taskRouter = createTRPCRouter({
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.task.findMany({
        where: { workspaceId: input.workspaceId },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          prd: { select: { id: true, title: true } },
          pullRequests: { select: { id: true, number: true, state: true, url: true } },
        },
        orderBy: [{ status: "asc" }, { order: "asc" }],
      });
    }),

  create: workspaceProcedure
    .use(requirePermission("task:create"))
    .input(
      z.object({
        workspaceId: z.string(),
        title: z.string().min(2).max(160),
        description: z.string().max(4000).optional(),
        prdId: z.string().optional(),
        status: taskStatusEnum.default("BACKLOG"),
        assigneeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const maxOrder = await ctx.prisma.task.aggregate({
        where: { workspaceId: input.workspaceId, status: input.status },
        _max: { order: true },
      });
      return ctx.prisma.task.create({
        data: {
          workspaceId: input.workspaceId,
          title: input.title,
          description: input.description,
          prdId: input.prdId,
          status: input.status,
          assigneeId: input.assigneeId,
          order: (maxOrder._max.order ?? -1) + 1,
        },
      });
    }),

  update: workspaceProcedure
    .use(requirePermission("task:edit"))
    .input(
      z.object({
        workspaceId: z.string(),
        taskId: z.string(),
        title: z.string().min(2).max(160).optional(),
        description: z.string().max(4000).optional(),
        assigneeId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, taskId, ...rest } = input;
      const task = await ctx.prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.workspaceId !== workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      return ctx.prisma.task.update({ where: { id: taskId }, data: rest });
    }),

  /**
   * Single mutation for drag-and-drop: moves a task to a new column and/or
   * position. `order` is the fractional-free simple approach — we just
   * renumber the destination column on every move. Fine at kanban-board
   * scale (hundreds of tasks, not millions); a fractional-index scheme
   * would be the next step if this ever needs to scale further.
   */
  move: workspaceProcedure
    .use(requirePermission("task:edit"))
    .input(
      z.object({
        workspaceId: z.string(),
        taskId: z.string(),
        status: taskStatusEnum,
        beforeTaskId: z.string().nullable(), // null = end of column
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({ where: { id: input.taskId } });
      if (!task || task.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      const columnTasks = await ctx.prisma.task.findMany({
        where: { workspaceId: input.workspaceId, status: input.status, id: { not: input.taskId } },
        orderBy: { order: "asc" },
        select: { id: true },
      });

      // Only the ordered list of ids is needed from here — building it this
      // way (rather than spreading the full `task` row into a typed array)
      // sidesteps any ambiguity about excess-property checks on the spread.
      const orderedIds: string[] = columnTasks.map((t: { id: string }) => t.id);
      const insertAt = input.beforeTaskId
        ? Math.max(0, orderedIds.indexOf(input.beforeTaskId))
        : orderedIds.length;
      orderedIds.splice(insertAt, 0, input.taskId);

      await ctx.prisma.$transaction(
        orderedIds.map((id, i) =>
          ctx.prisma.task.update({ where: { id }, data: { status: input.status, order: i } })
        )
      );

      return { success: true };
    }),

  delete: workspaceProcedure
    .use(requirePermission("task:delete"))
    .input(z.object({ workspaceId: z.string(), taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({ where: { id: input.taskId } });
      if (!task || task.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      await ctx.prisma.task.delete({ where: { id: input.taskId } });
      return { success: true };
    }),

  /** Bulk-creates tasks from a PRD's user stories / edge cases — the "Planning" phase. */
  generateFromPrd: workspaceProcedure
    .use(requirePermission("task:create"))
    .input(z.object({ workspaceId: z.string(), prdId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prd = await ctx.prisma.prd.findUnique({ where: { id: input.prdId } });
      if (!prd || prd.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }
      if (prd.status !== "READY" || !prd.userStories) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Generate the structured PRD before planning tasks.",
        });
      }

      const stories = prd.userStories as unknown as Array<{ asA: string; iWant: string; soThat: string }>;
      const maxOrder = await ctx.prisma.task.aggregate({
        where: { workspaceId: input.workspaceId, status: "BACKLOG" },
        _max: { order: true },
      });
      const startOrder = (maxOrder._max.order ?? -1) + 1;

      const created = await ctx.prisma.$transaction(
        stories.map((story, i) =>
          ctx.prisma.task.create({
            data: {
              workspaceId: input.workspaceId,
              prdId: prd.id,
              title: story.iWant,
              description: `As a ${story.asA}, I want ${story.iWant}, so that ${story.soThat}.`,
              status: "BACKLOG",
              order: startOrder + i,
            },
          })
        )
      );

      return { created: created.length };
    }),
});
