import { readMedia } from '../../../../lib/media-storage.js';
import { connectDB } from '../../../../lib/db.js';
import { Media } from '../../../../lib/models.js';
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response(null, { status: 404 });
  try { await connectDB(); const media = await Media.findById(id).lean(); if (!media || !/^[a-f0-9-]+\.webp$/.test(media.filename)) return new Response(null, { status: 404 });
    return new Response(await readMedia(media), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response(null, { status: 404 }); }
}
