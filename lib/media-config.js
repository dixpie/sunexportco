import { isAbsolute } from 'node:path';

export function mediaStorage(env = process.env) {
  const storage = env.MEDIA_STORAGE || (env.VERCEL === '1' ? 'mongodb' : 'filesystem');
  if (!['mongodb', 'filesystem'].includes(storage)) throw new Error('MEDIA_STORAGE must be mongodb or filesystem.');
  if (storage === 'filesystem') {
    if (env.VERCEL === '1') throw new Error('Vercel requires MEDIA_STORAGE=mongodb because its filesystem is not persistent.');
    if (!env.MEDIA_ROOT || !isAbsolute(env.MEDIA_ROOT)) throw new Error('MEDIA_ROOT must be an absolute persistent directory for filesystem media storage.');
  }
  return storage;
}
