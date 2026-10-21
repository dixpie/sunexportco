import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { storeMedia, readMedia, removeMedia } from '../lib/media-storage.js';
import { Media } from '../lib/models.js';
import { GET } from '../app/api/media/[id]/route.js';

test('durable MongoDB media round trip and legacy filesystem compatibility', async () => {
  const original = { ...process.env };
  let mongo; let directory;
  try {
    mongo = await MongoMemoryServer.create({ binary: { downloadDir: path.resolve('.local/mongodb') } });
    Object.assign(process.env, { MONGODB_URI: mongo.getUri('media_test'), VERCEL: '1' });
    delete process.env.MEDIA_ROOT; delete process.env.MEDIA_STORAGE;
    // More than one GridFS chunk, to exercise complete upload and download.
    const data = Buffer.alloc(600000, 42);
    const filename = `${randomUUID()}.webp`;
    const stored = await storeMedia(filename, data);
    assert.equal(stored.storage, 'mongodb');
    const record = await Media.create({ filename, ...stored });
    const persisted = await Media.findById(record._id).lean();
    assert.deepEqual(await readMedia(persisted), data);
    const response = await GET(new Request('http://localhost/api/media/test'), { params: Promise.resolve({ id: String(record._id) }) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), data);
    await removeMedia(persisted);
    assert.equal(await mongoose.connection.db.collection('media.chunks').countDocuments(), 0);
    assert.equal((await GET(new Request('http://localhost'), { params: { id: String(record._id) } })).status, 404);
    assert.equal((await GET(new Request('http://localhost'), { params: { id: '../invalid' } })).status, 404);

    directory = await mkdtemp(path.join(os.tmpdir(), 'sunexportco-media-'));
    delete process.env.VERCEL;
    process.env.MEDIA_ROOT = directory;
    const local = { filename, ...await storeMedia(filename, data) };
    assert.equal(local.storage, 'filesystem');
    assert.deepEqual(await readMedia(local), data);
    assert.deepEqual(await readMedia({ filename }), data);
    await removeMedia(local);
  } finally {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (directory) await rm(directory, { recursive: true, force: true });
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});
