import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { connectDB } from './db.js';
import { AdminUser, Session, RateLimit } from './models.js';
const scrypt = promisify(scryptCallback);
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) { const salt = randomBytes(16).toString('hex'); const key = await scrypt(password, salt, 64); return `${salt}:${key.toString('hex')}`; }
export async function verifyPassword(password, stored) { const [salt, hash] = stored.split(':'); const key = await scrypt(password, salt, 64); const expected = Buffer.from(hash, 'hex'); return expected.length === key.length && timingSafeEqual(expected, key); }
export function secret() { if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.'); return process.env.SESSION_SECRET; }
export async function getAdmin() {
  const token = (await cookies()).get('sun_session')?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  await connectDB();
  const session = await Session.findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } }).lean();
  if (!session) return null;
  const user = await AdminUser.findOne({ _id: session.adminId, active: true }).select('email').lean();
  if (!user) return null;
  return { id: user._id.toString(), email: user.email, csrf: createHmac('sha256', secret()).update(token).digest('hex') };
}
export async function requireAdmin(request, mutation = false) {
  const admin = await getAdmin(); if (!admin) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if (mutation) { assertOrigin(request); const provided = request.headers.get('x-csrf-token') || ''; if (provided.length !== admin.csrf.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(admin.csrf))) throw Object.assign(new Error('Invalid CSRF token'), { status: 403 }); }
  return admin;
}
export function assertOrigin(request) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.SITE_ORIGIN || 'http://localhost:3000').origin;
  if (!origin || origin !== expected) throw Object.assign(new Error('Invalid request origin'), { status: 403 });
}
export async function readJSON(request, max = 16000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Object.assign(new Error('JSON required'), { status: 415 });
  const chunks = []; let length = 0; const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error('Request body required'), { status: 400 });
  while (true) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > max) { await reader.cancel(); throw Object.assign(new Error('Request too large'), { status: 413 }); } chunks.push(Buffer.from(value)); }
  const body = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(body); } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}
export async function limit(request, bucket, count, seconds) {
  await connectDB();
  const ip = process.env.TRUST_PROXY === 'true' ? request.headers.get('x-real-ip') || 'unknown' : 'single-origin';
  // Shared MongoDB atomic fixed windows, hashed identifiers, TTL cleanup.
  const window = Math.floor(Date.now() / (seconds * 1000));
  const key = digest(`${bucket}:${ip}:${window}`);
  let record;
  try { record = await RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * seconds * 1000) } }, { upsert: true, new: true }); }
  catch (err) { if (err.code !== 11000) throw err; record = await RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true }); }
  if (record.count > count) throw Object.assign(new Error('Too many requests. Please try later.'), { status: 429 });
}
export function apiError(error) {
  if (error.name === 'ZodError') return Response.json({ error: 'validation', fields: [...new Set(error.issues.map(i => i.path[0]))] }, { status: 400 });
  if (error.status) return Response.json({ error: error.message }, { status: error.status });
  if (error.code === 11000) return Response.json({ error: 'This identifier or localized slug already exists.' }, { status: 409 });
  // Do not log payloads, URI, emails, or database error objects.
  console.error('Request failed:', error.name || 'Error');
  return Response.json({ error: 'Service temporarily unavailable. Please retry.' }, { status: 503 });
}
