# SunExportCo

A bilingual English/Russian B2B fruit catalog built with Next.js App Router, JavaScript, React, Mongoose and MongoDB. It includes seven products, inquiry capture, phone/WhatsApp links, protected catalog/content administration, publication states and a persistent media library. There is no checkout or public buyer account system.

## Run locally

Use Node.js 22.14+ (a supported LTS release is recommended) and a running MongoDB server or Atlas database.

```powershell
npm ci
Copy-Item .env.example .env.local
# Edit .env.local: MONGODB_URI, SESSION_SECRET, SITE_ORIGIN and MEDIA_ROOT.
npm run seed
# Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters) in .env.local.
npm run admin:bootstrap
# Remove the bootstrap credentials after creating the administrator.
npm run dev
```

Open `http://localhost:3000/en`, `/ru`, or `/admin`. Generate a session secret using `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Use a persistent absolute media directory, for example `G:/Develop/sunexportco/uploads` for local development. Never commit `.env.local` or copy secrets into browser configuration.

Without `MONGODB_URI`, development serves the initial public catalog for visual review. Submission and administration require MongoDB and fail with a service error; they never simulate persistence. With a configured URI, public content comes from published database records. Run the seed command first. It inserts missing records and preserves existing edits. Production serving requires MongoDB, session secret, site origin and media storage; startup fails clearly if these are missing.

## Content and administration

Bootstrap creates one administrator using environment-supplied credentials, hashes the password with salted scrypt, and refuses to overwrite an existing user. Password recovery is an operator task; no public reset flow is provided. Sessions are stored as token hashes in MongoDB, expire after eight hours and are revoked on logout. Secure cookies are used with an HTTPS production origin.

Administration supports:

- Product creation, English/Russian names, descriptions and localized slugs, availability wording, verified specification fields, SEO copy and galleries with bilingual alt text.
- Draft/published controls. Saved drafts are excluded from the public catalog and sitemap. Authenticated product previews support either language.
- Page title/introduction overrides and plain-text content sections. Privacy sections replace the initial privacy draft when provided. Homepage title/introduction overrides affect the hero; their metadata also uses these fields. Other page additions appear after the fixed functional layout.
- Bilingual FAQ editing, publication and ordering.
- Telephone, WhatsApp URL, verified email/address, original QR reference and its recorded destination.
- Private inquiries, status filtering, internal notes, and new/contacted/quoted/closed statuses. Lists paginate at 100 records.
- Raster uploads to MongoDB GridFS or a persistent filesystem volume. Add uploaded media references to product galleries and supply English/Russian alt text. First gallery image is the catalog cover. The kiwi main photo is used initially in the detail gallery.

Publishing expires the corresponding Next.js data cache immediately, so the next public request reads the updated data. This is verified for a single Node instance. Multiple instances need a shared Next.js cache handler with distributed tag invalidation; without it, another instance may retain content for up to the five-minute cache lifetime. MongoDB persistence precedes every inquiry success response. A unique request identifier prevents duplicate retries and concurrent submissions. Email notification is deliberately unconfigured; administrators see `not-configured` on inquiries. No mail delivery promise is made.

## Verification

```powershell
npm run lint
npm test
npm run test:media
npm run build
npm run test:vercel
npm run test:integration
```

Integration tests download an isolated real MongoDB binary into ignored `.local/`, start the production build on port 3007, seed test data, exercise HTTP endpoints and use installed Chrome for browser checks. This database is discarded afterward. Set `CHROME_PATH` if Chrome is in another location. On Linux, set it to your installed Chromium executable. The tests do not connect to the production database or use a mock persistence layer. A first run can take time because the MongoDB Windows archive is large.

`test:media` checks both storage adapters against an isolated database and temporary filesystem. After a build, `test:vercel` starts production with `VERCEL=1` and no `MEDIA_ROOT`, checks both public languages and authenticated uploads, and verifies that uploaded bytes survive a process restart. These checks do not access the production database.

Tests cover persistence and concurrent retries, localized network failure and retry, database outage behavior, protected admin access, password authentication and CSRF, shared inquiry/login throttles, edits and cache invalidation, draft visibility, media validation, language correspondence, SEO routes, and layouts at 360, 390, 768, 1024 and 1440px. Screenshots and the actual verification report are written to `docs/qa/`. Integration also runs local Chrome LCP/CLS samples with explicit network and CPU throttling. See the reports for completed checks and remaining limitations; do not infer field performance or accessibility certification from these lab checks.

## Vercel deployment

Vercel automatically uses MongoDB GridFS for uploaded images (`VERCEL=1`). `MEDIA_ROOT` is not required and any old value is ignored with this backend. The application stores image bytes in the same MongoDB database as the catalog, in `media.files` and `media.chunks`, and serves them through `/api/media/[id]`. No additional storage service or dependency is needed. Vercel's temporary filesystem must not be used as durable media storage.

1. Set `MONGODB_URI`, `SESSION_SECRET` (at least 32 characters) and `SITE_ORIGIN=https://sunexportco.vercel.app` (or the final custom domain) in the Vercel project's production environment. Use the exact origin without a path, query or hash. Ensure the MongoDB database is reachable by the deployed functions.
2. Set `MEDIA_STORAGE=mongodb` explicitly, or leave it unset to use automatic Vercel detection. Remove any explicit `MEDIA_STORAGE=filesystem`. Keep `ALLOW_INDEXING=false` until business review is complete.
3. Seed and bootstrap the intended database as described above, then deploy/redeploy so the code and environment changes take effect. Check `/en`, `/ru`, admin login, and an image upload/download. Keep multipart uploads below the hosting platform's request body limit; on Vercel, use images smaller than 4 MB to allow room for multipart overhead.

The previous startup errors (`Missing production configuration: MEDIA_ROOT` and `MEDIA_ROOT must be an absolute persistent directory`) came from requiring filesystem storage on Vercel. A local Windows path cannot supply persistent storage to Vercel's Linux functions. Existing filesystem media records continue to use their original directory on server deployments; their files are not automatically migrated to GridFS. Re-upload those files and update galleries when moving an existing media library to Vercel. Back up the GridFS collections together with the application database.

## Node.js production deployment

This is a Node.js server application, not a static export or Cloudflare Worker. MongoDB connections require the Node runtime. On servers/containers, media defaults to filesystem storage and requires an absolute `MEDIA_ROOT` on a mounted persistent volume. For multiple app instances, all must share the same media volume. Alternatively, set `MEDIA_STORAGE=mongodb` to store images in GridFS without a local directory, including on hosts with ephemeral storage.

1. Configure production environment variables through the host secret manager. Use a separate database and secret from development. Set `SITE_ORIGIN=https://www.sunexportco.com` (or the confirmed final origin), without a path/query. Configure MongoDB with restricted credentials, TLS and a network allowlist. Mount `MEDIA_ROOT` on durable storage.
2. Run `npm ci`, `npm run seed` and the bootstrap command using the intended database. Seed is safe to repeat. Remove bootstrap credentials afterward.
3. Run `npm run build`, then `npm run start` behind an HTTPS reverse proxy. The server binds to the standard Next.js port (3000 unless overridden). For process supervision use your host's process manager, systemd or container restart policy.
4. The reverse proxy must cap request bodies at 6 MB, set connection/request timeouts, overwrite `x-real-ip` with the actual client IP, and block direct access to the app port. Then set `TRUST_PROXY=true`. MongoDB rate limits are shared across instances; identifiers are hashed and records expire. With `TRUST_PROXY=false`, the conservative fallback treats requests as one origin and can throttle unrelated users.
5. After business review, set `ALLOW_INDEXING=true` and rebuild/restart. Until explicitly enabled, all pages send noindex headers and metadata, robots blocks crawling, and sitemap is empty. Preview environments must keep it false. Admin, API and query variants are excluded from the indexing policy; robots is not authorization.
6. Optional: add Search Console verification. Optional Plausible analytics require `ANALYTICS_SCRIPT_URL` and `ANALYTICS_DOMAIN`; click and persisted-inquiry events contain only event names, with no buyer details. Analytics and mail are not necessary for core functionality.

Back up MongoDB and the media volume together with encryption and access controls. Test restoration into a separate environment, keep retention limited to the business-approved policy, and never publish inquiry exports. Keep originals from the supplied downloads separately; the archived copies in `assets/originals/` and runtime media in `uploads/` are ignored by Git.

## Business review and remaining inputs

See [asset audit](docs/asset-audit.md), [asset manifest](docs/asset-manifest.json), and [full brief extraction](docs/brief-extracted.txt). The implementation specification governs the task; the PDF supplies draft business copy and is not a separate authorization to publish, generate images or invent services.

- Official standalone SVG logo is pending. The HTML wordmark and letter favicon are temporary; neither is represented as an approved logo.
- High-resolution product, orchard and packaging photography is pending. Supplied low-resolution crops are used at restrained sizes. Illustrative images do not establish company-owned facilities or offered services.
- Phone is supplied by the brief. Email, address, hours, registration, history, certifications, supply capacity, varieties, grades, season, packaging weights, MOQ, destinations and transport terms are unconfirmed and are not invented.
- Original QR decodes to **https://wa.me/qr/Q6PY5EQN433UG1**. The brief's candidate button link is **https://wa.me/989201528232**. Both are preserved separately; a phone check must establish whether they reach the intended same account. The filename alone does not verify this.
- Review the editable privacy notice, data controller details, retention, lawful basis and contact procedure before production launch. The site does not claim legal compliance.
- Real mail delivery, deployed infrastructure, phone/WhatsApp account matching, field Core Web Vitals, and browser engines other than installed Chrome are not verified by local tests.

The build uses the supported Next.js App Router and Mongoose Node runtime integration described in [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation) and [Mongoose's Next.js guide](https://mongoosejs.com/docs/nextjs.html). `npm audit --omit=dev` was checked during implementation; dev lint tooling currently has an upstream `braces` advisory with no patched release. Do not apply the audit's suggested downgrade to Next 14. The vulnerable glob parser is used by development lint tooling, not an exposed application endpoint. Review advisories with each dependency update.
