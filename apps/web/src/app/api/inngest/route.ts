import { serve } from "inngest/next";
import { inngest } from "@shipflow/inngest";
import { functions } from "@shipflow/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});


