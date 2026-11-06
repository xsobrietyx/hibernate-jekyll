// Intercepted integration test: no measurements are forwarded to Google.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const root = path.resolve(process.argv[2] || '/tmp/hibernate-ga4-test-site');
  const tagFile = process.argv[3];
  const measurementId = process.argv[4];
  assert.ok(tagFile && /^G-[A-Z0-9]{6,}$/.test(measurementId || ''), 'Provide the build directory, downloaded Google tag script, and Measurement ID.');
  const captured = [];
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  try {
    const page = await browser.newPage();
    await page.route('**/*', async route => {
      const request = route.request(); const url = new URL(request.url());
      if (url.hostname === 'www.hibernate.ninja') {
        let name = url.pathname;
        if (name.endsWith('/')) name += 'index.html';
        const file = path.join(root, name);
        let body = await fs.readFile(file);
        if (file.endsWith('.html')) body = Buffer.from(body.toString().replaceAll('G-TEST123456', measurementId));
        return route.fulfill({ body, contentType: file.endsWith('.js') ? 'application/javascript' :
          file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html' });
      }
      captured.push({ url: request.url(), body: request.postData() || '' });
      if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js') {
        return route.fulfill({ body: await fs.readFile(tagFile), contentType: 'application/javascript' });
      }
      // Return locally, never forward measurement or advertising requests.
      return route.fulfill({ status: 204, body: '' });
    });
    await page.goto('https://www.hibernate.ninja/verkhovna-rada-neo4j-voting-graph/?email=PRIVATE_TEST_VALUE#PRIVATE_FRAGMENT',
      { referer: 'https://ref.example/path?token=PRIVATE_REFERRER' });
    assert.equal(captured.length, 0);
    await page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    await page.waitForFunction(() => Boolean(window.google_tag_manager));
    await page.evaluate(() => window.addEventListener('click', event => event.preventDefault()));
    await page.locator('a[download="votes.csv"]').click();
    await page.locator('a[download="seed.cypher"]').click();
    await page.locator('a[href^="https://neo4j.com/"]').first().click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.waitForTimeout(500);
    const events = [];
    for (const request of captured) {
      const url = new URL(request.url);
      if (!url.pathname.includes('collect')) continue;
      for (const line of (request.body || '').split('\n')) {
        const parameters = new URLSearchParams(url.search);
        for (const [key, value] of new URLSearchParams(line)) parameters.set(key, value);
        if (parameters.get('en')) events.push({ name: parameters.get('en'), parameters });
      }
    }
    assert.ok(events.some(event => event.name === 'page_view'), 'Pageview beacon missing');
    assert.ok(events.some(event => event.name === 'asset_download'), 'Download beacon missing');
    assert.ok(events.some(event => event.name === 'outbound_click'), 'Outbound beacon missing');
    assert.ok(events.some(event => event.name === 'article_scroll'), 'Scroll beacon missing');
    console.log('Real Google tag emitted these intercepted events:', events.map(event => event.name).join(', '));
    console.log('Events with private URL fields:', events.filter(event =>
      [...event.parameters.values()].some(value => value.includes('PRIVATE_'))).map(event => event.name));
    console.log('Automatic overlapping events:', events.filter(event => ['scroll','click','file_download','form_start','form_submit','view_search_results'].includes(event.name)).map(event => event.name));
    for (const request of captured) {
      if (!decodeURIComponent(request.url + request.body).includes('PRIVATE_')) continue;
      const url = new URL(request.url);
      const fields = [...new URLSearchParams(url.search), ...new URLSearchParams(request.body)];
      console.log('Unsanitized field names:', url.origin + url.pathname,
        fields.filter(([, value]) => value.includes('PRIVATE_')).map(([key]) => key));
    }
    assert.ok(captured.every(request => !decodeURIComponent(request.url + request.body).includes('PRIVATE_')),
      'A private URL parameter leaked into a Google request');
    assert.equal(events.filter(event => ['scroll','click','file_download','form_start','form_submit','view_search_results'].includes(event.name)).length, 0, 'Disable Enhanced Measurement to avoid overlapping automatic events.');
    console.log('All collection requests were handled locally; no synthetic events were sent to Google.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
