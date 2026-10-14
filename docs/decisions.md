# Implementation decisions

- Local application only; no Site registration, cloud publication or external deployment.
- Next.js 16.4.0 and compatible React/Mongoose dependencies were checked against the npm registry and official runtime documentation. Dependency lockfile is committed for reproducible installs.
- Server-rendered public pages use published MongoDB records, with tagged five-minute content caches and immediate expiration on admin updates. A development-only seed catalog is available without a database configuration; mutations have no fallback.
- English defaults through a permanent root redirect. Stable product IDs and per-locale slugs support equivalent language switching and quote preselection. Both languages use LTR. Local Inter Latin/Cyrillic weights are 400, 600 and 700; headings use a system editorial serif to match the references without another downloaded font family.
- Seven items do not need catalog filters. Availability remains inquiry-based. Unknown specs are described as details to confirm instead of many empty table rows.
- Public pages retain the supplied visual hierarchy. Small image sources are kept compact; only the clean high-resolution hero crop is displayed broadly. Temporary wordmark uses real text, and all controls remain HTML.
- Admin interface is English; public copy, form outcomes, accessibility labels and metadata are localized. Administrative previews can inspect either language. Publication does not authorize external deployment.
- Inquiry validation is shared between browser and server, while the server remains authoritative. DB unique keys enforce idempotency and DB atomic counters enforce rate limits. Honeypot, bounded body parsing, origin checks, strict allowlisted schemas and a reverse-proxy deployment contract reduce abuse. Admin mutations also require a session-bound CSRF token.
- Uploads accept JPEG/PNG/WebP only, verify decoded format and pixel limits, re-encode to WebP, and store durable files outside public source with MongoDB metadata. SVG and executable uploads are refused. Originals are not overwritten.
- No mail integration is configured without credentials. A saved inquiry records notification status accurately. Optional analytics events contain only an event name.
- Product JSON-LD intentionally omits offers, prices, ratings and reviews; no product rich-result eligibility is promised. The draft privacy content explicitly requires business/legal review.
