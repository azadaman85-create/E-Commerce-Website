import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the auth session on every request, and gates /admin and
 * /account behind authentication. The admin role itself is re-checked
 * server-side in the admin layout — middleware is a first pass, not the
 * only guard.
 */
export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account");

  if (!isAdminRoute && !isAccountRoute) return response;

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  /*
   * Only the routes that actually need a session.
   *
   * This previously ran on every request, and `auth.getUser()` is a network
   * call to Supabase — roughly a second on this project — so every public page
   * view paid for an auth check it never used. Anonymous visitors browsing the
   * catalogue now skip it entirely; @supabase/ssr still refreshes the session
   * on the client, and on any of the routes below.
   */
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout/:path*",
    "/auth",
  ],
};
