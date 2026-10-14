import { revalidateTag } from 'next/cache';
import { requireAdmin, readJSON, apiError } from '../../../../lib/security.js';
import { Product, PageContent, FAQ, SiteSettings, Inquiry, Media } from '../../../../lib/models.js';
import { productSchema, pageSchema, faqSchema, settingsSchema, inquiryUpdateSchema } from '../../../../lib/validation.js';
const resources = { products: { model: Product, schema: productSchema, tag: 'catalog' }, pages: { model: PageContent, schema: pageSchema, tag: 'content' }, faqs: { model: FAQ, schema: faqSchema, tag: 'content' }, settings: { model: SiteSettings, schema: settingsSchema, tag: 'settings' }, inquiries: { model: Inquiry, schema: inquiryUpdateSchema }, media: { model: Media } };
export async function GET(request, { params }) {
  try {
    await requireAdmin(request); const { resource } = await params; const config = resources[resource]; if (!config) return Response.json({ error: 'Not found' }, { status: 404 });
    const url = new URL(request.url); const status = url.searchParams.get('status');
    const filter = resource === 'inquiries' && ['new', 'contacted', 'quoted', 'closed'].includes(status) ? { status } : {};
    const offset = Math.max(0, Math.min(100000, Number(url.searchParams.get('offset')) || 0));
    const [records, total] = await Promise.all([config.model.find(filter).sort(resource === 'inquiries' || resource === 'media' ? { createdAt: -1 } : { order: 1, id: 1 }).skip(offset).limit(100).lean(), config.model.countDocuments(filter)]);
    return Response.json({ records, total }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
export async function PUT(request, { params }) {
  try {
    await requireAdmin(request, true); const { resource } = await params; const config = resources[resource]; if (!config?.schema) return Response.json({ error: 'Not found' }, { status: 404 });
    const input = await readJSON(request, 40000);
    if (resource === 'inquiries') {
      const { _id, ...fields } = input;
      if (typeof _id !== 'string' || !/^[a-f0-9]{24}$/.test(_id)) return Response.json({ error: 'Invalid record' }, { status: 400 });
      const updated = await Inquiry.findByIdAndUpdate(_id, { $set: inquiryUpdateSchema.parse(fields) }, { new: true, runValidators: true });
      if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ ok: true });
    }
    const data = config.schema.parse(input);
    await config.model.findOneAndUpdate({ id: data.id }, { $set: data }, { upsert: true, new: true, runValidators: true });
    // Immediate expiration: the next public request reads the latest published data.
    revalidateTag(config.tag, { expire: 0 });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
