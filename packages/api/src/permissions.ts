import type { Role } from "@shipflow/db";

/**
 * The one rule the master spec called out by name: a Developer must not be
 * able to bypass human approval on a PR. That's why `pr:approve` is on
 * ADMIN and REVIEWER only — never DEVELOPER. Every other permission here is
 * a judgment call made explicit so it can be argued with, but that one is
 * load-bearing and shouldn't move without a real conversation.
 *
 * This file is the ONLY place role -> permission mapping should live.
 * UI-side checks (hiding a button) are a convenience, not a boundary — the
 * boundary is the `.use(requirePermission(...))` middleware in trpc.ts,
 * which calls `can()` from here on every request.
 */

export const ACTIONS = [
  "workspace:update",
  "workspace:delete",
  "members:invite",
  "members:remove",
  "members:changeRole",
  "apiKeys:manage",
  "github:manage",
  "billing:manage",
  "prd:create",
  "prd:edit",
  "task:create",
  "task:edit",
  "task:delete",
  "pr:approve",
] as const;

export type Action = (typeof ACTIONS)[number];

const PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  ADMIN: new Set(ACTIONS), // admins can do everything
  DEVELOPER: new Set<Action>(["prd:create", "prd:edit", "task:create", "task:edit"]),
  REVIEWER: new Set<Action>([
    "prd:create",
    "prd:edit",
    "task:create",
    "task:edit",
    "pr:approve",
  ]),
};

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.has(action) ?? false;
}

/** For settings UI: "why is this disabled" tooltips, grouped by role. */
export function permissionsFor(role: Role): Action[] {
  return Array.from(PERMISSIONS[role] ?? []);
}
