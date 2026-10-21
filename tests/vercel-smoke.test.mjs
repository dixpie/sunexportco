import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash, createHmac } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seed } from '../scripts/seed.mjs';
import { AdminUser, Session, Media } from '../lib/models.js';

test('production HTTP startup, upload and persistence on Vercel without MEDIA_ROOT', { timeout: 120000 }, async () => {
  const original = { ...process.env };
  let mongo; let server; let log = '';
  try {
    mongo = await MongoMemoryServer.create({ binary: { downloadDir: path.resolve('.local/mongodb') } });
    process.env.MONGODB_URI = mongo.getUri('vercel_smoke');
    await seed();
    const token = randomBytes(32).toString('hex');
    const secret = randomBytes(48).toString('hex');
    const admin = await AdminUser.create({ email: 'smoke@example.test', passwordHash: 'unused', active: true });
    await Session.create({ tokenHash: createHash('sha256').update(token).digest('hex'), adminId: admin._id, expiresAt: new Date(Date.now() + 600000) });
    const listener = createServer();
    listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    const base = `http://localhost:${port}`;
    // Empty values prevent Next.js from loading development storage settings from .env.local.
    const env = { ...process.env, NODE_ENV: 'production', VERCEL: '1', SITE_ORIGIN: base, SESSION_SECRET: secret, ALLOW_INDEXING: 'false', MEDIA_ROOT: '', MEDIA_STORAGE: '' };
    delete env.NEXT_PHASE;
    async function start() {
      server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      server.stdout.on('data', data => { log += data; }); server.stderr.on('data', data => { log += data; });
      for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null) throw new Error(`Server exited: ${log}`);
        try { if ((await fetch(`${base}/en`)).ok) return; } catch {}
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      throw new Error(`Server failed to start: ${log}`);
    }
    async function stop() { const child = server; if (child && child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; } server = null; }
    await start();
    assert.equal((await fetch(`${base}/ru`)).status, 200);
    const headers = { Origin: base, Cookie: `sun_session=${token}`, 'x-csrf-token': createHmac('sha256', secret).update(token).digest('hex') };
    const body = new FormData();
    body.set('file', new Blob([await readFile('public/media/apple.webp')], { type: 'image/webp' }), 'apple.webp');
    const upload = await fetch(`${base}/api/admin/media`, { method: 'POST', headers, body });
    assert.equal(upload.status, 201, await upload.clone().text());
    const media = await upload.json();
    const record = await Media.findById(media.src.split('/').at(-1)).lean();
    assert.equal(record.storage, 'mongodb');
    const first = await fetch(base + media.src); assert.equal(first.status, 200);
    const bytes = Buffer.from(await first.arrayBuffer()); assert.ok(bytes.length > 0);
    const invalid = new FormData(); invalid.set('file', new Blob(['not an image'], { type: 'image/jpeg' }), 'bad.jpg');
    assert.equal((await fetch(`${base}/api/admin/media`, { method: 'POST', headers, body: invalid })).status, 400);
    await stop(); await start();
    const afterRestart = await fetch(base + media.src); assert.equal(afterRestart.status, 200);
    assert.deepEqual(Buffer.from(await afterRestart.arrayBuffer()), bytes);
    await stop();
  } finally {
    if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
    await mongoose.disconnect(); if (mongo) await mongo.stop();
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});
