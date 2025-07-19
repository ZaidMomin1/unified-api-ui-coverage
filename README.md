# unified-api-ui-coverage

**Unified API + UI Test Coverage for Playwright and Node.js**

Easily track and visualize which API endpoints are covered by your UI and API tests. Generate beautiful HTML and JSON reports showing endpoint coverage, test names, and call counts.

---

## Features
- Track API calls from both UI (Playwright) and direct API tests (supertest or Playwright APIRequestContext)
- See which endpoints are covered by UI, API, or both
- Modern, filterable HTML report with search, sorting, and summary stats
- Test name, method, full URL, and call count for every tracked call
- Works with Playwright, supertest, or any Node.js HTTP client
- SQLite-backed for robust multi-process support

---

## Installation

```sh
npm install unified-api-ui-coverage
```

---

## Usage

### 1. **Track API Calls in UI Tests (Playwright)**

```js
const { attachPlaywrightTracking } = require('unified-api-ui-coverage');

test.beforeEach(async ({ page }, testInfo) => {
  await attachPlaywrightTracking(page, testInfo);
});
```

### 2. **Track API Calls in API Tests (supertest)**

```js
const { trackedApi } = require('unified-api-ui-coverage');
const api = trackedApi('https://reqres.in');

test('Direct API testing', async ({}, testInfo) => {
  const res = await api.get('/api/users?page=2', testInfo.title);
  expect(res.status).toBe(200);
});
```

### 3. **Track API Calls in Playwright-native API Tests**

```js
const tracker = require('unified-api-ui-coverage/src/tracker');

test('Playwright-native API test', async ({ request }, testInfo) => {
  const endpoint = '/api/users?page=2';
  const method = 'GET';
  const fullUrl = 'https://reqres.in' + endpoint;
  tracker.logCall(endpoint, method, 'api', fullUrl, testInfo.title);
  const res = await request.get(fullUrl);
  expect(res.status()).toBe(200);
});
```

### 4. **Generate the Coverage Report**

```js
const { generateReport } = require('unified-api-ui-coverage');
generateReport('./coverage-reports');
```
Or add a test that calls `generateReport` at the end of your suite.

---

## API

### `attachPlaywrightTracking(page, testInfo)`
Tracks all API calls made by the given Playwright `page`.

### `trackedApi(baseUrl)`
Returns a wrapper for supertest-based API calls that logs coverage.

### `tracker.logCall(endpoint, method, source, fullUrl, testName)`
Manually log an API/UI call for coverage.

### `generateReport(outputDir)`
Generates HTML and JSON coverage reports in the given directory.

---

## License

MIT License. See [LICENSE](./LICENSE). 