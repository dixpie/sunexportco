import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PREVIEW_URL || 'http://localhost:3000';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
try {
  await mkdir('docs/qa', { recursive: true }); const page = await browser.newPage(); const results = []; const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function loadImages() { await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 50)); } window.scrollTo({ top: 0, behavior: 'instant' }); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); }); await page.waitForLoadState('networkidle'); await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0)); }
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/en', '/ru', '/en/products', '/ru/products', '/en/products/kiwi', '/ru/products/apple', '/en/contact', '/ru/contact', '/en/faq', '/ru/faq']) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      await loadImages();
      const result = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, h1: document.querySelectorAll('h1').length, brokenImages: [...document.images].filter(img => img.complete && !img.naturalWidth).length }));
      results.push({ width, route, status: response.status(), ...result });
      if (result.overflow || result.brokenImages || result.h1 !== 1 || response.status() !== 200) console.log('FAIL', JSON.stringify(results.at(-1)));
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(base + '/en', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'docs/qa/home-en-desktop.png', fullPage: true });
  await page.goto(base + '/en/products/kiwi', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'docs/qa/kiwi-en-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + '/ru', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'docs/qa/home-ru-mobile.png', fullPage: true });
  await page.goto(base + '/ru/contact', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'docs/qa/contact-ru-mobile.png', fullPage: true });
  await writeFile('docs/qa/preview-layouts.json', JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ checked: results.length, failures: results.filter(r => r.overflow || r.brokenImages || r.h1 !== 1 || r.status !== 200), errors }));
} finally { await browser.close(); }
