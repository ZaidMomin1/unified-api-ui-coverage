const { attachPlaywrightTracking } = require('./playwright-hook');
const { trackedApi } = require('./api-wrapper');
const { generateReport } = require('./reporter');


module.exports = {
    attachPlaywrightTracking,
    trackedApi,
    generateReport
};
