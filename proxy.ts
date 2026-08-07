import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  const WEBDAV_METHODS = ["PROPFIND", "PROPPATCH", "MKCOL", "COPY", "MOVE", "LOCK", "UNLOCK", "PUT", "DELETE"];

  // Rewrite WebDAV requests to the pages API handler (which supports
  // non-standard methods like PROPFIND/MKCOL/COPY/MOVE that app router
  // route handlers reject with 400).
  //
  // Clients mount either at /webdav or at the base origin. For base-origin
  // mounts, traversal produces paths like /folder, /folder/file.txt — route
  // any of those that use a DAV method to the handler. GET/HEAD/OPTIONS
  // (and POST) keep serving the site, so ordinary pages and CORS preflights
  // are untouched; OPTIONS on "/" is additionally proxied below as a
  // discovery convenience for clients that probe the base origin.
  if (
    !pathname.startsWith("/webdav") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    WEBDAV_METHODS.includes(method)
  ) {
    let target = pathname === "/" ? "/api/webdav" : `/api/webdav${pathname}`;
    // Normalize a trailing slash: pages router redirects /api/webdav/ with
    // a 308, but WebDAV clients frequently request collection roots with one.
    if (target.length > "/api/webdav".length && target.endsWith("/")) {
      target = target.slice(0, -1);
    }
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  // Some WebDAV clients (e.g. Windows "Map network drive", Davx5, rclone)
  // probe the base origin with OPTIONS to detect DAV support before using
  // /webdav. Route OPTIONS on "/" to the WebDAV handler so discovery works;
  // keep genuine endpoints hitting the site normally.
  if (pathname === "/" && method === "OPTIONS") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/webdav";
    return NextResponse.rewrite(url);
  }

  // /webdav-prefixed paths: route every method (GET included, so files can
  // be downloaded straight from the collection) to the handler.
  if (pathname.startsWith("/webdav")) {
    let target = pathname === "/webdav" ? "/api/webdav" : `/api/webdav${pathname.slice("/webdav".length)}`;
    // Normalize a trailing slash: WebDAV clients frequently request
    // collection roots with one.
    if (target.length > "/api/webdav".length && target.endsWith("/")) {
      target = target.slice(0, -1);
    }
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

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

  // Normalize trailing slashes (replaces the built-in 308 that was disabled
  // via skipTrailingSlashRedirect to keep WebDAV paths working).
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.rewrite(url);
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
  if (pathname === "/vi" || pathname.startsWith("/vi/")) {
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
