import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import sharp from 'sharp';
import { requireAdmin, apiError } from '../../../../lib/security.js';
import { Media } from '../../../../lib/models.js';
export async function POST(request) {
  try {
    await requireAdmin(request, true);
    if (!process.env.MEDIA_ROOT || !path.isAbsolute(process.env.MEDIA_ROOT)) throw Object.assign(new Error('Configure an absolute persistent MEDIA_ROOT before uploading.'), { status: 503 });
    if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) throw Object.assign(new Error('Maximum upload size is 5 MB.'), { status: 413 });
    const form = await request.formData(); const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function' || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) throw Object.assign(new Error('Use a JPEG, PNG, or WebP image up to 5 MB.'), { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const decoder = sharp(buffer, { limitInputPixels: 24000000 });
    let result;
    try { const metadata = await decoder.metadata(); if (!['jpeg', 'png', 'webp'].includes(metadata.format)) throw new Error('Unsupported'); result = await decoder.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true }); }
    catch { throw Object.assign(new Error('Invalid image content or dimensions.'), { status: 400 }); }
    const filename = `${randomUUID()}.webp`; await mkdir(process.env.MEDIA_ROOT, { recursive: true });
    await writeFile(path.join(process.env.MEDIA_ROOT, filename), result.data, { flag: 'wx' });
    const media = await Media.create({ filename, originalName: path.basename(file.name).slice(0, 180), mime: 'image/webp', size: result.data.length, width: result.info.width, height: result.info.height, sha256: createHash('sha256').update(result.data).digest('hex'), alt: { en: '', ru: '' } });
    return Response.json({ src: `/api/media/${media._id}`, width: media.width, height: media.height }, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function GET(request) {
  try { await requireAdmin(request); const offset = Math.max(0, Math.min(100000, Number(new URL(request.url).searchParams.get('offset')) || 0)); const records = await Media.find().sort({ createdAt: -1 }).skip(offset).limit(100).lean(); return Response.json({ records, total: await Media.countDocuments() }, { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return apiError(error); }
}
