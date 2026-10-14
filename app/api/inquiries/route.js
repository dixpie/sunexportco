import { connectDB } from '../../../lib/db.js';
import { Inquiry, Product } from '../../../lib/models.js';
import { inquirySchema } from '../../../lib/validation.js';
import { assertOrigin, limit, readJSON, apiError } from '../../../lib/security.js';
export const runtime = 'nodejs';
export async function POST(request) {
  try {
    assertOrigin(request);
    const data = inquirySchema.parse(await readJSON(request));
    await connectDB(); await Inquiry.init(); await limit(request, 'inquiry', 8, 600);
    if (data.productId && !await Product.exists({ id: data.productId, status: 'published' })) return Response.json({ error: 'validation', fields: ['productId'] }, { status: 400 });
    const { website: ignored, ...record } = data; void ignored;
    // Unique requestId is enforced by MongoDB, including across processes and retries.
    try { await Inquiry.create({ ...record, status: 'new', privacyVersion: '2026-10-13', notificationStatus: 'not-configured' }); }
    catch (error) { if (error.code !== 11000) throw error; return Response.json({ received: true, duplicate: true }); }
    return Response.json({ received: true }, { status: 201 });
  } catch (error) { return apiError(error); }
}
