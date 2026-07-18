import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";

/**
 * `cache()` de-dupes this within a single request — layout, page, and any
 * server components that all call this once each only hit Better Auth once.
 */
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
