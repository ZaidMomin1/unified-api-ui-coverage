const tracker = require('./tracker');

/**
 * Attaches API call tracking to a Playwright page. Logs all /api/ requests made during the test.
 * @param {import('playwright').Page} page - The Playwright page object to attach tracking to.
 * @param {object} testInfo - The test information object, should contain a 'title' property for the test name.
 */
async function attachPlaywrightTracking(page, testInfo) {
    await page.route('**/*', (route) => {
        const request = route.request();
        const url = new URL(request.url());
        // Capture only API calls
        if (url.pathname.startsWith('/api/')) {
            const testName = page.__currentTestName || '';
            tracker.logCall(url.pathname + url.search, request.method(), 'ui', request.url(), testInfo.title);
        }
        route.continue();
    });
}

module.exports = { attachPlaywrightTracking };
