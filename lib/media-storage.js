import path from 'node:path';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { connectDB } from './db.js';
import { mediaStorage } from './media-config.js';

async function bucket() {
  const mongoose = await connectDB();
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' });
}

export async function storeMedia(filename, data) {
  const storage = mediaStorage();
  if (storage === 'mongodb') {
    const files = await bucket();
    const upload = files.openUploadStream(filename);
    try { await pipeline(Readable.from([data]), upload); }
    catch (error) { await upload.abort().catch(() => {}); throw error; }
    return { storage, storageId: upload.id };
  }
  await mkdir(process.env.MEDIA_ROOT, { recursive: true });
  await writeFile(path.join(process.env.MEDIA_ROOT, filename), data, { flag: 'wx' });
  return { storage };
}

export async function readMedia(media) {
  // Records created before storage adapters were introduced live on the filesystem.
  if (media.storage === 'mongodb') {
    const chunks = [];
    for await (const chunk of (await bucket()).openDownloadStream(media.storageId)) chunks.push(chunk);
    return Buffer.concat(chunks);
  }
  if (!process.env.MEDIA_ROOT || !path.isAbsolute(process.env.MEDIA_ROOT)) throw new Error('Filesystem media storage is unavailable.');
  return readFile(path.join(process.env.MEDIA_ROOT, media.filename));
}

export async function removeMedia(media) {
  if (media.storage === 'mongodb') return (await bucket()).delete(media.storageId);
  return unlink(path.join(process.env.MEDIA_ROOT, media.filename));
}
