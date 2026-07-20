import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { createServerCaller } from "@/lib/trpc/server";
import { MarketingNav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { IntegratesWith } from "@/components/marketing/integrates-with";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { ReviewLoopShowcase } from "@/components/marketing/review-loop-showcase";
import { StartShipping } from "@/components/marketing/start-shipping";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { PhilosophyQuote } from "@/components/marketing/philosophy-quote";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function LandingPage() {
  const session = await getServerSession();
  if (session?.user) {
    const caller = await createServerCaller();
    const workspaces = await caller.workspace.listMine();
    if (workspaces[0]) redirect(`/w/${workspaces[0].slug}`);
    redirect("/onboarding/workspace");
  }

  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <IntegratesWith />
        <FeaturesGrid />
        <ReviewLoopShowcase />
        <StartShipping />
        <ComparisonTable />
        <PhilosophyQuote />
        <CtaBand />
      </main>
      <MarketingFooter />
    </>
  );
}


