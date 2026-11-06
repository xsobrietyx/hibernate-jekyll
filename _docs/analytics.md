# Blog analytics

This blog uses a configuration-driven GA4 integration in the shared
`8-bit-ascii-theme`. The only site identifier is the **public** Measurement ID
in `_config.yml` under `analytics.ga4_measurement_id`. It is not an API secret.
An empty value keeps collection off.

## Activate the property

1. In Google Analytics, create/select the standard **Hibernate Ninja** property
   and a Web stream for `https://www.hibernate.ninja`. Use
   `America/Toronto` for reporting time if that is the desired reporting day.
2. Turn **Enhanced Measurement off** for this stream. Pageviews still come from
   the Google tag's configuration call; the blog supplies its own scroll,
   download, and outbound events. This also avoids automatic form/search events.
3. Copy the stream's `G-…` Measurement ID into `_config.yml` and deploy.
4. Accept analytics in a browser with no blocking extensions and verify a visit
   in **Reports → Realtime**. Declining must leave Google's tag unloaded.

The installed `gcloud` and existing ADC login were checked during setup; both
tokens lacked Analytics scopes. Google blocked a separate Analytics
authorization using the Cloud SDK's shared OAuth client. This did not change
the existing Google Cloud login. Further CLI administration needs your own
OAuth client authorized for `analytics.edit`, or an appropriately authorized
service account. Creating the first Analytics account also requires Google
Terms acceptance. Do not paste credentials or client secrets into this repo.

## Questions the reports answer

| Question | Report / event |
| --- | --- |
| Which posts attract readers? | Pages and screens, Views, Active users |
| Where do readers come from? | Traffic acquisition; source/medium and referrer |
| Do people stay? | Engagement metrics; this reflects measurable activity after consent |
| How far do readers navigate? | `article_scroll`, filtered by page and `percent_scrolled` |
| Are the examples useful? | `asset_download`, compared with views of the relevant article |
| Which external resources do readers use? | `outbound_click`, by destination domain |

Use event counts by **Page path and screen class** as a first Exploration.
The event parameters are visible in DebugView; register event-scoped custom
dimensions for any parameters you need to break down in your reports and
which are not already available as built-in dimensions. Useful names include
**Asset filename** (`file_name`) and **Destination domain** (`link_domain`).
Custom definitions apply to newly collected data and may take time to appear.

Treat scrolling as a navigation signal, not proof of reading. Download events
measure clicks, not completed downloads. Exclude your own visits before
judging small traffic totals. Expect ad blockers, refusal, and browser privacy
preferences to reduce the measured population; do not treat reports as a
complete count of everyone who accessed the site.

## Collection rules

- Only the production build and configured HTTPS hostnames can initialize it.
- Google receives no requests from this integration before opt-in or on decline.
- Browser GPC and an exposed DNT signal disable it.
- A local-storage preference lasts 180 days; blocked storage means per-page
  consent. The owner can opt out with `hibernate.analytics-disabled` set to `1`.
- Consent can be withdrawn using **Analytics settings** in the footer.
  Withdrawal sets the Google disable flag, removes accessible GA cookies, and
  reloads the page to remove the loaded third-party code.
- Query strings and fragments are removed from URLs supplied by the integration.
- Advertising consent stays denied; Google Signals/personalization are disabled.
- Third-party script blocking does not prevent reading or downloading files.

The public notice is `/privacy/`. The theme README documents the event schema
and owner-exclusion command. Browser checks intercept all external requests,
so test traffic never reaches the live property.

## Regression checks

The browser scripts require Playwright. Install it in a temporary tooling
directory rather than adding Node dependencies to the blog:

```bash
npm install --prefix /tmp/blog-analytics-tests playwright
```

Build the local theme in production with a **test** Measurement ID and the
allowed hostnames `www.hibernate.ninja,hibernate.ninja`, then run:

```bash
PLAYWRIGHT_MODULE=/tmp/blog-analytics-tests/node_modules/playwright \
  node _tests/analytics.browser.cjs /path/to/test-build
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if using an existing Chromium binary.
The suite checks consent, refusal, withdrawal/cookie removal, privacy signals,
URL cleaning, download/link events, scroll deduplication, hostname restrictions,
blocked scripts, and unavailable local storage. It also checks that accepting
consent preserves reading position. Google code is mocked and every request is
intercepted locally.

For an integration check using a downloaded copy of the real Google tag:

```bash
curl --fail --output /tmp/blog-google-tag.js \
  'https://www.googletagmanager.com/gtag/js?id=G-52ZPCZT6PK'
PLAYWRIGHT_MODULE=/tmp/blog-analytics-tests/node_modules/playwright \
  node _tests/analytics.real-tag.cjs \
  /path/to/test-build /tmp/blog-google-tag.js G-52ZPCZT6PK
```

The test build should use `G-TEST123456`; the integration check replaces that
ID only in its intercepted HTML. It executes the real Google code, but handles
every measurement request locally. It verifies actual serialized event names,
absence of private URL parameters, and absence of overlapping automatic events.

## Sources

- [GA4 setup](https://support.google.com/analytics/answer/14183469)
- [Basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [GA4 configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Enhanced Measurement](https://support.google.com/analytics/answer/9216061)
- [Analytics Admin API](https://developers.google.com/analytics/devguides/config/admin/v1)
