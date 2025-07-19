const { generateReport } = require('../src/reporter');
const path = require('path');

const outputDir = process.argv[2] || path.resolve('./coverage-reports');

console.log(`Generating API + UI Coverage Report...`);
generateReport(outputDir);
console.log(`Report ready at: ${outputDir}/coverage-report.html`);
