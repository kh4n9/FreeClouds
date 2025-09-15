import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and images
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.svg") ||
    pathname.startsWith("/manifest.json") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Admin route protection (both English and Vietnamese)
  if (pathname.startsWith("/admin") || pathname.startsWith("/vi/admin")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // Redirect to appropriate login based on language
      const isVietnamese = pathname.startsWith("/vi/");
      const loginPath = isVietnamese ? "/vi/login" : "/login";
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: We can't verify JWT and check admin role in middleware
    // because it's edge runtime. The actual admin verification
    // is done in the admin layout component and API routes.
    return NextResponse.next();
  }

  // Dashboard route protection (both English and Vietnamese)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/vi/dashboard")
  ) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // Redirect to appropriate login based on language
      const isVietnamese = pathname.startsWith("/vi/");
      const loginPath = isVietnamese ? "/vi/login" : "/login";
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Language routing for Vietnamese pages
  if (pathname.startsWith("/vi/")) {
    // Set a header to indicate Vietnamese locale
    const response = NextResponse.next();
    response.headers.set("x-locale", "vi");
    return response;
  }

  // Set default locale header for English pages
  const response = NextResponse.next();
  response.headers.set("x-locale", "en");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg|manifest.json).*)",
  ],
};
