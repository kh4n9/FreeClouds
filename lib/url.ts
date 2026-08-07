// Build the base URL (origin) for the current request.
// Prefers the request's own host so the value is correct both when the app is
// served locally (localhost:port) and in production (www.freeclouds.cloud),
// regardless of what NEXT_PUBLIC_BASE_URL is set to in a given environment.
export function getRequestBaseUrl(request: Request): string {
  const host = request.headers.get("host");
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      "http";
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}