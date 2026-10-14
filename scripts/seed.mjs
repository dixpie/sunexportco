import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import { Product, PageContent, FAQ, SiteSettings, Inquiry, AdminUser, Session, RateLimit, Media } from '../lib/models.js';
import { productSeeds, pageSeeds, faqSeeds, settingsSeed } from '../lib/seed-data.js';
import { productSchema, pageSchema, faqSchema, settingsSchema } from '../lib/validation.js';
export async function seed() {
  await connectDB();
  await Promise.all([Product, PageContent, FAQ, SiteSettings, Inquiry, AdminUser, Session, RateLimit, Media].map(model => model.init()));
  for (const [model, values, schema] of [[Product, productSeeds, productSchema], [PageContent, pageSeeds, pageSchema], [FAQ, faqSeeds, faqSchema], [SiteSettings, [settingsSeed], settingsSchema]]) {
    await model.init();
    for (const value of values) { const data = schema.parse(value); await model.updateOne({ id: data.id }, { $setOnInsert: data }, { upsert: true }); }
  }
}
if (process.argv[1]?.endsWith('seed.mjs')) { try { await seed(); console.log('Initial content seeded. Existing edits preserved.'); } finally { await mongoose.disconnect(); } }
