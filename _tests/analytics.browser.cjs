// Run against a local production build. Every request is intercepted; Google
// collection is never contacted. PLAYWRIGHT_MODULE can point at a local install.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2] || '/tmp/hibernate-ga4-test-site');
const article = '/verkhovna-rada-neo4j-voting-graph/';
const consentKey = 'hibernate.analytics-consent.v1';
let checks = 0;

(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  try {
    async function fixture(options = {}) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const requests = [];
      const errors = [];
      await context.addInitScript(({ options, consentKey }) => {
        if (options.gpc) Object.defineProperty(navigator, 'globalPrivacyControl', { value: true });
        if (options.dnt) Object.defineProperty(navigator, 'doNotTrack', { value: '1' });
        if (options.preference) localStorage.setItem(consentKey, JSON.stringify({
          choice: options.preference,
          savedAt: Date.now() - (options.expired ? 181 * 86400000 : 0),
        }));
        if (options.owner) localStorage.setItem('hibernate.analytics-disabled', '1');
        if (options.noStorage) Object.defineProperty(window, 'localStorage', {
          get() { throw new DOMException('Storage disabled', 'SecurityError'); },
        });
      }, { options, consentKey });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'www.googletagmanager.com') {
          requests.push(url.href);
          if (options.blockTag) return route.abort('blockedbyclient');
          return route.fulfill({ contentType: 'application/javascript', body: '// Google tag mocked' });
        }
        assert.ok(['www.hibernate.ninja', 'hibernate.ninja', 'staging.hibernate.ninja'].includes(url.hostname),
          'Unexpected external request: ' + url.origin);
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';
        const file = path.resolve(root, '.' + pathname);
        assert.ok(file.startsWith(root + path.sep));
        let body = await fs.readFile(file);
        if (file.endsWith('.html') && options.invalidId) {
          body = Buffer.from(body.toString().replace(/data-measurement-id="[^"]+"/, 'data-measurement-id="GTM-WRONG"'));
        }
        return route.fulfill({ body, contentType: file.endsWith('.css') ? 'text/css' :
          file.endsWith('.js') ? 'application/javascript' : file.endsWith('.png') ? 'image/png' : 'text/html' });
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto((options.origin || 'https://www.hibernate.ninja') + article + '?email=private@example.net#secret',
        { referer: 'https://referrer.example/from?token=private' });
      const commands = () => page.evaluate(() => (window.dataLayer || []).map(command => Array.from(command)));
      const events = async () => (await commands()).filter(command => command[0] === 'event');
      const accept = async () => {
        await page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
        await page.waitForFunction(() => Boolean(document.querySelector('#blog-google-tag')));
      };
      const scrollBottom = async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      };
      const noNavigation = () => page.evaluate(() => window.addEventListener('click', event => event.preventDefault()));
      return { context, page, requests, errors, commands, events, accept, scrollBottom, noNavigation };
    }
    async function check(name, options, action) {
      const f = await fixture(options);
      try { await action(f); assert.deepEqual(f.errors, []); checks++; console.log('PASS: ' + name); }
      finally { await f.context.close(); }
    }

    await check('No Google requests or queued events before consent; mobile controls fit', {}, async f => {
      assert.equal(f.requests.length, 0);
      assert.deepEqual(await f.commands(), []);
      assert.equal(await f.page.locator('#analytics-consent').isVisible(), true);
      const box = await f.page.locator('#analytics-consent').boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.height <= 844);
    });
    await check('Decline persists without loading Google', {}, async f => {
      await f.page.getByRole('button', { name: 'Decline analytics' }).click();
      await f.page.reload();
      assert.equal(f.requests.length, 0);
      assert.equal(await f.page.locator('#analytics-consent').isVisible(), false);
      assert.deepEqual(await f.events(), []);
    });
    await check('One pageview configuration; denied ads; URLs cleaned; debug omitted', {}, async f => {
      const originalScroll = await f.page.evaluate(() => window.scrollY);
      await f.accept();
      assert.equal(await f.page.evaluate(() => window.scrollY), originalScroll);
      await f.page.waitForFunction(() => document.querySelector('#blog-google-tag').src.includes('G-TEST123456'));
      const commands = await f.commands();
      assert.equal(commands.filter(c => c[0] === 'config').length, 1);
      assert.equal(commands.filter(c => c[0] === 'event' && c[1] === 'page_view').length, 0);
      assert.equal(commands[0][0], 'consent');
      assert.equal(commands[0][1], 'default');
      assert.equal(commands[0][2].ad_storage, 'denied');
      assert.equal(commands[1][2].analytics_storage, 'granted');
      const globalDefaults = commands.find(c => c[0] === 'set')[1];
      assert.equal(globalDefaults.page_location, 'https://www.hibernate.ninja' + article);
      assert.equal(globalDefaults.page_referrer, 'https://referrer.example/from');
      const config = commands.find(c => c[0] === 'config')[2];
      assert.equal(config.page_location, 'https://www.hibernate.ninja' + article);
      assert.equal(config.page_referrer, 'https://referrer.example/from');
      assert.equal(config.allow_google_signals, false);
      assert.equal(config.allow_ad_personalization_signals, false);
      assert.equal(Object.hasOwn(config, 'debug_mode'), false);
      assert.equal(config.send_page_view, true);
    });
    await check('CSV and Cypher download clicks, external links, and URL sanitization', {}, async f => {
      await f.accept(); await f.noNavigation();
      await f.page.evaluate(() => {
        const csv = document.querySelector('a[download="votes.csv"]');
        csv.href += '?token=private#secret';
        csv.innerHTML = '<span>Download votes.csv</span>';
        document.querySelector('a[href^="https://neo4j.com/"]').href = 'https://example.net/docs?email=private#secret';
      });
      await f.page.locator('a[download="votes.csv"] span').click();
      await f.page.locator('a[download="seed.cypher"]').click();
      await f.page.locator('a[href^="https://example.net/"]').click();
      const events = (await f.events()).filter(c => ['asset_download', 'outbound_click'].includes(c[1]));
      assert.deepEqual(events.map(c => c[1]), ['asset_download', 'asset_download', 'outbound_click']);
      assert.equal(events[0][2].file_name, 'votes.csv');
      assert.equal(events[1][2].file_extension, 'cypher');
      assert.equal(events[2][2].link_domain, 'example.net');
      assert.ok(events.every(c => !JSON.stringify(c).includes('private') && !JSON.stringify(c).includes('secret')));
    });
    await check('Article scroll milestones are emitted once each', {}, async f => {
      await f.accept(); await f.scrollBottom();
      const milestones = async () => (await f.events()).filter(c => c[1] === 'article_scroll').map(c => c[2].percent_scrolled);
      assert.deepEqual(await milestones(), [25, 50, 75, 100]);
      await f.page.evaluate(() => window.scrollTo(0, 0));
      await f.scrollBottom();
      assert.deepEqual(await milestones(), [25, 50, 75, 100]);
    });
    await check('Pre-consent scrolling is not backfilled', {}, async f => {
      await f.scrollBottom(); await f.accept();
      await f.page.evaluate(() => window.scrollTo(0, 0)); await f.scrollBottom();
      assert.deepEqual((await f.events()).filter(c => c[1] === 'article_scroll'), []);
    });
    await check('Returning consent starts once without a banner', { preference: 'granted' }, async f => {
      assert.equal(await f.page.locator('#analytics-consent').isVisible(), false);
      assert.equal((await f.commands()).filter(c => c[0] === 'config').length, 1);
    });
    await check('Expired consent asks again without Google', { preference: 'granted', expired: true }, async f => {
      assert.equal(f.requests.length, 0);
      assert.equal(await f.page.locator('#analytics-consent').isVisible(), true);
    });
    for (const signal of ['gpc', 'dnt', 'owner']) await check(signal + ' overrides stored acceptance',
      { preference: 'granted', [signal]: true }, async f => {
        assert.equal(f.requests.length, 0); assert.deepEqual(await f.commands(), []);
      });
    await check('Unavailable storage permits page-only consent', { noStorage: true }, async f => {
      await f.accept(); await f.page.reload();
      assert.equal(await f.page.locator('#analytics-consent').isVisible(), true);
      assert.deepEqual(await f.commands(), []);
    });
    await check('Withdrawal removes Google cookies and reloads with tracking off', {}, async f => {
      await f.accept();
      await f.page.evaluate(() => {
        document.cookie = '_ga=mock; Path=/; Domain=hibernate.ninja; Secure';
        document.cookie = '_ga_TEST123456=mock; Path=/; Secure';
      });
      await f.page.getByRole('button', { name: 'Analytics settings', exact: true }).click();
      const loaded = f.page.waitForEvent('domcontentloaded');
      await f.page.getByRole('button', { name: 'Decline analytics', exact: true }).click();
      await loaded;
      assert.equal(await f.page.locator('#blog-google-tag').count(), 0);
      assert.equal((await f.context.cookies()).filter(c => c.name.startsWith('_ga')).length, 0);
      assert.deepEqual(await f.commands(), []);
    });
    await check('Invalid container IDs cannot initialize GA4', { preference: 'granted', invalidId: true }, async f => {
      assert.equal(f.requests.length, 0); assert.equal(await f.page.locator('#analytics-settings').count(), 0);
    });
    for (const origin of ['https://staging.hibernate.ninja', 'http://www.hibernate.ninja']) {
      await check('Tracking excluded on ' + origin, { origin, preference: 'granted' }, async f => {
        assert.equal(f.requests.length, 0); assert.deepEqual(await f.commands(), []);
      });
    }
    await check('A blocked Google script does not break site controls', { blockTag: true }, async f => {
      await f.accept(); await f.noNavigation();
      await f.page.locator('a[download="votes.csv"]').click();
      assert.equal((await f.events()).filter(c => c[1] === 'asset_download').length, 1);
      await f.page.getByRole('button', { name: 'Analytics settings', exact: true }).click();
      assert.equal(await f.page.locator('#analytics-consent').isVisible(), true);
    });
    console.log(`${checks} browser scenarios passed; no requests reached Google collection.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
