const tracker = require('./tracker');
const supertest = require('supertest');

function trackedApi(baseUrl) {
    const request = supertest(baseUrl);
    const methods = ['get', 'post', 'put', 'delete', 'patch'];

    const wrapped = {};
    methods.forEach(method => {
        wrapped[method] = (endpoint, testName = '') => {
            const fullUrl = baseUrl.replace(/\/$/, '') + endpoint;
            tracker.logCall(endpoint, method.toUpperCase(), 'api', fullUrl, testName);
            return request[method](endpoint);
        };
    });

    return wrapped;
}

module.exports = { trackedApi };
