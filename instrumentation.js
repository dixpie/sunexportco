export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    const missing = ['MONGODB_URI', 'SESSION_SECRET', 'SITE_ORIGIN'].filter(key => !process.env[key]);
    if (missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}. See README.`);
    if (process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.');
    const origin = new URL(process.env.SITE_ORIGIN); if (origin.pathname !== '/' || origin.search || origin.hash) throw new Error('SITE_ORIGIN must be an origin without path, query, or hash.');
    const { mediaStorage } = await import('./lib/media-config.js'); mediaStorage();
  }
}
