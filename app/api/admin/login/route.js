import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { AdminUser, Session } from '../../../../lib/models.js';
import { connectDB } from '../../../../lib/db.js';
import { loginSchema } from '../../../../lib/validation.js';
import { assertOrigin, limit, readJSON, apiError, verifyPassword, digest, secret } from '../../../../lib/security.js';
export async function POST(request) {
  try {
    assertOrigin(request); secret();
    const data = loginSchema.parse(await readJSON(request, 2000));
    await connectDB(); await limit(request, 'login', 10, 900);
    const user = await AdminUser.findOne({ email: data.email.toLowerCase(), active: true });
    // Run the password KDF even for unknown users.
    const valid = await verifyPassword(data.password, user?.passwordHash || '00000000000000000000000000000000:' + '00'.repeat(64));
    if (!user || !valid) return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await Session.create({ tokenHash: digest(token), adminId: user._id, expiresAt });
    (await cookies()).set('sun_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' && process.env.SITE_ORIGIN?.startsWith('https:'), sameSite: 'strict', path: '/', expires: expiresAt });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
