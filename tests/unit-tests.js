const { trackedApi, generateReport } = require('../src');
const tracker = require('../src/tracker');

(async () => {
    tracker.clear();
    const api = trackedApi('https://reqres.in');
    await api.get('/api/users?page=2').expect(200);
    generateReport('./coverage-reports');
})();
