// Builds without secrets are supported for review. Production serving fails closed.
if (process.env.ALLOW_INDEXING === 'true') {
  const origin = process.env.SITE_ORIGIN;
  if (!origin || !origin.startsWith('https://') || new URL(origin).pathname !== '/') throw new Error('Indexing requires a canonical HTTPS SITE_ORIGIN.');
}
