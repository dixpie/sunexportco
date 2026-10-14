import mongoose from 'mongoose';
import { randomBytes, scryptSync } from 'node:crypto';
import { connectDB } from '../lib/db.js';
import { AdminUser } from '../lib/models.js';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(); const password = process.env.ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 16 || password.length > 256) throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of 16–256 characters.');
try { await connectDB(); await AdminUser.init(); if (await AdminUser.exists({ email })) throw new Error('Admin already exists. Bootstrap never overwrites a password.');
  const salt = randomBytes(16).toString('hex'); await AdminUser.create({ email, passwordHash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}` }); console.log('Admin created. Remove bootstrap credentials from the runtime environment.');
} finally { await mongoose.disconnect(); }
