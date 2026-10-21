import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mediaStorage } from '../lib/media-config.js';
import { register } from '../instrumentation.js';

test('Vercel uses MongoDB without a media directory and ignores stale MEDIA_ROOT values', () => {
  for (const MEDIA_ROOT of [undefined, 'uploads', 'G:/Develop/sunexportco/uploads']) {
    assert.equal(mediaStorage({ VERCEL: '1', MEDIA_ROOT }), 'mongodb');
  }
  assert.equal(mediaStorage({ MEDIA_STORAGE: 'mongodb' }), 'mongodb');
  assert.throws(() => mediaStorage({ VERCEL: '1', MEDIA_STORAGE: 'filesystem', MEDIA_ROOT: '/tmp' }), /not persistent/);
  assert.throws(() => mediaStorage({ MEDIA_STORAGE: 'unknown' }), /MEDIA_STORAGE/);
});

test('filesystem deployments still require an absolute media directory', () => {
  assert.throws(() => mediaStorage({}), /MEDIA_ROOT/);
  assert.throws(() => mediaStorage({ MEDIA_ROOT: 'uploads' }), /MEDIA_ROOT/);
  assert.equal(mediaStorage({ MEDIA_ROOT: path.resolve('uploads') }), 'filesystem');
});

test('production startup on Vercel accepts absent MEDIA_ROOT and retains other configuration checks', async () => {
  const original = { ...process.env };
  try {
    Object.assign(process.env, { NEXT_RUNTIME: 'nodejs', NODE_ENV: 'production', VERCEL: '1', MONGODB_URI: 'mongodb://localhost/test', SESSION_SECRET: 'x'.repeat(32), SITE_ORIGIN: 'https://example.test' });
    for (const key of ['MEDIA_ROOT', 'MEDIA_STORAGE', 'NEXT_PHASE']) delete process.env[key];
    await register();
    process.env.SESSION_SECRET = 'short';
    await assert.rejects(register(), /SESSION_SECRET/);
    delete process.env.MONGODB_URI;
    await assert.rejects(register(), /MONGODB_URI/);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});
