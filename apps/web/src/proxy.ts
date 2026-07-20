import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = ["/onboarding", "/w/"];

/**
 * Next.js 16 renamed middleware.ts -> proxy.ts and moved it to the Node.js
 * runtime by default (previously Edge-only) — see nextjs.org/blog/next-16.
 * The rename isn't cosmetic: it's a response to CVE-2025-29927, where
 * Edge-Runtime middleware auth checks could be bypassed under load. The
 * fix Next.js recommends is exactly what this file already did before the
 * rename — keep this layer to routing decisions only, never the
 * authoritative auth check:
 *
 * This is an optimistic check only — it reads whether a session cookie
 * exists, not whether it's still valid. The actual authoritative check (is
 * this session real, is the user a member of this workspace) happens in
 * app/w/[slug]/layout.tsx via getServerSession(), which is what actually
 * gates access — this file only avoids showing a logged-out user a page
 * that's obviously going to redirect them.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/onboarding/:path*", "/w/:path*"],
};


