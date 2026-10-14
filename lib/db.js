import mongoose from 'mongoose';
const cache = globalThis.__sunMongo || (globalThis.__sunMongo = { conn: null, promise: null });
export async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. No database fallback is used for mutations.');
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, bufferCommands: false });
  try { cache.conn = await cache.promise; return cache.conn; } catch (error) { cache.promise = null; throw error; }
}
