import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PERFORMANCE_URL || 'http://localhost:3007';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
try {
  const metrics = [];
  for (const scenario of [{ name: 'Desktop, local network, no CPU throttle', width: 1440, height: 1000, throttle: false }, { name: 'Mobile, simulated 1.6 Mbps / 150 ms latency / 4x CPU slowdown', width: 390, height: 844, throttle: true }]) {
    const context = await browser.newContext({ viewport: { width: scenario.width, height: scenario.height } });
    await context.addInitScript(() => {
      window.__sunMetrics = { lcp: null, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__sunMetrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__sunMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    const page = await context.newPage();
    if (scenario.throttle) { const session = await context.newCDPSession(page); await session.send('Network.enable'); await session.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8 }); await session.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
    const response = await page.goto(base + '/en', { waitUntil: 'networkidle' });
    if (!response.ok()) throw new Error('Performance server returned an error.');
    await page.waitForTimeout(1200);
    const result = await page.evaluate(() => { const nav = performance.getEntriesByType('navigation')[0]; return { ...window.__sunMetrics, ttfb: nav.responseStart - nav.requestStart, transferredBytes: performance.getEntriesByType('resource').reduce((total, entry) => total + entry.transferSize, 0), navigationDuration: nav.duration }; });
    metrics.push({ scenario: scenario.name, viewport: `${scenario.width}x${scenario.height}`, lcpMs: result.lcp === null ? null : Math.round(result.lcp), cls: Number(result.cls.toFixed(4)), ttfbMs: Math.round(result.ttfb), resourceTransferredBytes: result.transferredBytes, navigationDurationMs: Math.round(result.navigationDuration) });
    await context.close();
  }
  await mkdir('docs/qa', { recursive: true });
  const report = { testedAt: new Date().toISOString(), server: 'Local production Next.js server with isolated MongoDB', tool: 'Chrome PerformanceObserver and CDP', metrics, limitations: ['Single local cold-browser sample per scenario; this is lab evidence, not real-user field data or a Lighthouse score.', 'INP requires representative interactions and field sampling; no INP estimate is claimed.', 'Local server latency does not represent hosting, destination markets, CDN behavior or production MongoDB.'] };
  await writeFile('docs/qa/performance.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
