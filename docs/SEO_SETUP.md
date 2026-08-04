# SEO Setup Guide for Free Clouds

This guide documents the current SEO setup for Free Clouds (bilingual EN/VI, structured data, sitemap/robots, Open Graph).

## 🌍 Canonical Domain & URLs

- **Canonical domain**: `https://www.freeclouds.cloud` (set in `lib/seo/config.ts` via `BASE_URL`, overridable with `NEXT_PUBLIC_BASE_URL`)
- **URL structure**: default English at `/`, Vietnamese at `/vi/`
- There are **no** `/en/*` routes. Do not reference `/en` in sitemap, hreflang, or canonical tags.

## 🔧 Environment Variables

```bash
# SEO Configuration (optional — code defaults to https://www.freeclouds.cloud)
NEXT_PUBLIC_BASE_URL=https://www.freeclouds.cloud

# Search Console verification (optional — emitted when set)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_BING_SITE_VERIFICATION=your-bing-verification-code
NEXT_PUBLIC_YANDEX_VERIFICATION=your-yandex-verification-code
```

## 🗂 SEO Architecture

| Concern | File |
|---|---|
| Site name, localized copy, breadcrumb builder | `lib/seo/config.ts` |
| `generateMetadata()` helper, JSON-LD builders | `lib/seo/utils.ts` |
| Global metadata, `<html lang>`, structured data, hreflang | `app/layout.tsx` |
| Sitemap (only `/` + `/vi`) | `app/sitemap.ts` |
| robots.txt (blocks AI bots, disallows `/s/`) | `app/robots.ts` |
| Dynamic OG image (1200×630) | `app/opengraph-image.tsx`, `app/vi/opengraph-image.tsx` |
| Homepage metadata + FAQPage/Breadcrumb JSON-LD | `app/page.tsx`, `app/vi/page.tsx` |
| Share page dynamic title + noindex | `app/s/[token]/page.tsx`, `app/vi/s/[token]/page.tsx` |

### Language handling

- `proxy.ts` sets the `x-locale` header; the root layout reads it to set `<html lang>` and localized metadata. Pages under `/vi` render Vietnamese, everything else English.
- Tradeoff: because the root layout reads `headers()`, all routes are dynamically rendered (no static prerender).

### Indexability rules

- **Indexable**: `/` and `/vi` (landing pages).
- **Noindex** (via route-group layouts): `app/(auth)/*`, `app/vi/(auth)/*`, `app/dashboard/*`, `app/vi/dashboard/*`, `app/admin/*`, `app/vi/admin/*`, `app/s/[token]/*` (also disallowed in robots.txt).

### Structured data

- `WebApplication` + `Organization` JSON-LD in the root layout (localized).
- `FAQPage` + `BreadcrumbList` JSON-LD on the homepage (localized EN/VI).

## 📈 Analytics Setup

Google Analytics is not yet wired in. To add it, insert a `next/script` with the gtag snippet in `app/layout.tsx` and use `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

## ✅ Post-Deploy Checklist

1. Google Search Console: verify `https://www.freeclouds.cloud` (meta tag auto-emitted when `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set), submit `https://www.freeclouds.cloud/sitemap.xml`.
2. Check `/robots.txt` and `/sitemap.xml` on production.
3. Validate JSON-LD: [Rich Results Test](https://search.google.com/test/rich-results), [Schema.org Validator](https://validator.schema.org/).
4. Confirm share URLs (`/s/[token]`) return `noindex` and are disallowed in robots.txt.

---

**Last Updated**: August 2026
