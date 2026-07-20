import { z } from "zod";
import { createTRPCRouter, workspaceProcedure, requirePermission } from "../trpc";

export const billingRouter = createTRPCRouter({
  getSubscription: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sub = await ctx.prisma.subscription.findUnique({ where: { workspaceId: input.workspaceId } });
      return (
        sub ?? {
          tier: "FREE" as const,
          aiReviewsUsed: 0,
          aiReviewsLimit: 25,
          currentPeriodEnd: null,
        }
      );
    }),

  /**
   * Stub: Razorpay isn't wired to a live merchant account in this build.
   * When RAZORPAY_KEY_ID/SECRET are set, this is where you'd call
   * razorpay.orders.create(...) or subscriptions.create(...) and return a
   * checkout URL/order ID for the client SDK. Without them, the UI shows
   * an explanatory state instead of a broken checkout button — see
   * components/settings/billing-panel.tsx.
   */
  createCheckoutSession: workspaceProcedure
    .use(requirePermission("billing:manage"))
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async () => {
      const configured = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
      if (!configured) {
        return {
          ready: false as const,
          message:
            "Billing isn't configured yet — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to enable Pro checkout.",
        };
      }
      // Live path would look roughly like:
      // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
      // const order = await razorpay.subscriptions.create({ plan_id: process.env.RAZORPAY_PRO_PLAN_ID!, customer_notify: 1 });
      // return { ready: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID };
      return { ready: false as const, message: "Razorpay keys found but checkout flow isn't implemented yet." };
    }),
});


