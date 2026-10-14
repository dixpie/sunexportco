import { cookies } from 'next/headers';
import { requireAdmin, apiError, digest } from '../../../../lib/security.js';
import { Session } from '../../../../lib/models.js';
export async function POST(request) {
  try { await requireAdmin(request, true); const jar = await cookies(); const token = jar.get('sun_session')?.value; if (token) await Session.deleteOne({ tokenHash: digest(token) }); jar.delete('sun_session'); return Response.json({ ok: true }); }
  catch (error) { return apiError(error); }
}
