const fs = require('fs');
const path = require('path');
const tracker = require('./tracker');

async function generateReport(outputDir = './coverage-reports') {
    const data = await tracker.getReportData();
    const total = data.length;
    const coveredUI = data.filter(e => e.ui).length;
    const coveredAPI = data.filter(e => e.api).length;

    const htmlRows = data.map(e => `
        <tr class="data-row">
            <td>${e.method}</td>
            <td class="full-url" title="${e.fullUrl || ''}">${e.fullUrl || ''}</td>
            <td>${e.testName || ''}</td>
            <td><span class="badge ${e.ui ? 'badge-success' : 'badge-fail'}">${e.ui ? '✅' : '❌'}<span class="visually-hidden">${e.ui ? 'Pass' : 'Fail'}</span></span></td>
            <td><span class="badge ${e.api ? 'badge-success' : 'badge-fail'}">${e.api ? '✅' : '❌'}<span class="visually-hidden">${e.api ? 'Pass' : 'Fail'}</span></span></td>
            <td>${e.count}</td>
        </tr>`).join('');

    const html = `
    <html>
    <head>
        <title>API + UI Test Coverage</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #f6f8fa; }
            .container { max-width: 1500px; margin: 48px auto; background: #fff; border-radius: 16px; box-shadow: 0 6px 32px rgba(0,0,0,0.10); padding: 48px 32px; }
            h1 { color: #2d3a4b; font-size: 2.2rem; margin-bottom: 0.5em; }
            .summary { margin-bottom: 24px; display: flex; gap: 18px; flex-wrap: wrap; }
            .summary-stat { display: flex; align-items: center; font-size: 1.18rem; font-weight: 600; background: #f4f8fb; border-radius: 8px; padding: 8px 18px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); color: #2d3a4b; }
            .summary-stat .stat-label { margin-right: 8px; font-weight: 500; color: #555; font-size: 1.05rem; }
            .summary-stat.total { background: #e0e7ff; color: #2d3a4b; }
            .summary-stat.ui { background: #e6fbe9; color: #1b3c1b; }
            .summary-stat.api { background: #eaf6ff; color: #1a3c7a; }
            .search-bar { margin-bottom: 18px; width: 100%; max-width: 400px; padding: 10px 14px; border: 1px solid #bfc7d1; border-radius: 6px; font-size: 1rem; box-shadow: 0 1px 2px rgba(0,0,0,0.03); box-sizing: border-box; }
            .table-responsive { width: 100%; overflow-x: auto; }
            table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 16px; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); min-width: 1100px; font-size: 1.08rem; }
            th, td { padding: 12px 10px; text-align: center; }
            th { background: linear-gradient(90deg, #4f8cff 0%, #6edb8f 100%); color: #fff; font-weight: 600; font-size: 1.05rem; border: none; }
            td.full-url { max-width: 520px; word-break: break-all; white-space: normal; overflow-wrap: anywhere; }
            tr.data-row { transition: background 0.2s; }
            tr.data-row:nth-child(even) { background: #f4f8fb; }
            tr.data-row:nth-child(odd) { background: #eaf3fa; }
            tr.data-row:hover { background: #d1eaff; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 1rem; font-weight: 600; }
            .badge-success { background: #6edb8f; color: #1b3c1b; }
            .badge-fail { background: #ffb3b3; color: #7a1a1a; }
            .visually-hidden { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
            @media (max-width: 800px) {
                .container { padding: 16px 2vw; }
                table { min-width: 600px; font-size: 0.95rem; }
                th, td { padding: 8px 6px; }
            }
            @media (max-width: 600px) {
                .container { padding: 8px 0; }
                h1 { font-size: 1.3rem; }
                .summary p { display: block; margin: 0 0 6px 0; }
                .search-bar { font-size: 0.95rem; padding: 8px 8px; }
                table { min-width: 400px; font-size: 0.9rem; }
            }
        </style>
    </head>
    <body>
      <div class="container">
        <h1>API + UI Test Coverage</h1>
        <div class="summary">
          <span class="summary-stat total"><span class="stat-label">Total Endpoints:</span> <b>${total}</b></span>
          <span class="summary-stat ui"><span class="stat-label">Covered by UI:</span> <b>${coveredUI}</b></span>
          <span class="summary-stat api"><span class="stat-label">Covered by API:</span> <b>${coveredAPI}</b></span>
        </div>
        <input type="text" id="searchInput" class="search-bar" placeholder="Search by URL, method, or status...">
        <div class="table-responsive">
        <table id="coverageTable">
            <thead>
            <tr><th>Method</th><th>Full URL</th><th>Test Name</th><th>UI Tested</th><th>API Tested</th><th>Call Count</th></tr>
            </thead>
            <tbody>
            ${htmlRows}
            </tbody>
        </table>
        </div>
      </div>
        <script>
        // Search/filter functionality
        document.getElementById('searchInput').addEventListener('keyup', function() {
          var filter = this.value.toLowerCase();
          var rows = document.querySelectorAll('table tr.data-row');
          rows.forEach(function(row) {
            row.style.display = row.textContent.toLowerCase().includes(filter) ? '' : 'none';
          });
        });
        // Sortable columns
        document.querySelectorAll('#coverageTable th').forEach((th, idx) => {
          th.addEventListener('click', function() {
            const table = th.closest('table');
            const tbody = table.querySelector('tbody');
            Array.from(tbody.querySelectorAll('tr'))
              .sort((a, b) => {
                const aText = a.children[idx].textContent.trim();
                const bText = b.children[idx].textContent.trim();
                return aText.localeCompare(bText, undefined, {numeric: true});
              })
              .forEach(tr => tbody.appendChild(tr));
          });
        });
        </script>
    </body>
    </html>`;

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'coverage-report.html'), html);
    fs.writeFileSync(path.join(outputDir, 'coverage-report.json'), JSON.stringify(data, null, 2));
    console.log(`Coverage report generated in ${outputDir}`);
}


function clearCoverageReports(reportsDir = './coverage-reports') {
  const filesToDelete = [
    'coverage-tracker.sqlite',
    'coverage-report.html',
    'coverage-report.json'
  ];
  filesToDelete.forEach(file => {
    const filePath = path.join(reportsDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

module.exports = { generateReport, clearCoverageReports };
