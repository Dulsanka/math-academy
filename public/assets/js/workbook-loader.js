(function () {
  const match = window.location.pathname.match(/year(6|7|8|9|10|11|12|13)(?:_|\.|$)/i);
  if (!match) return;

  const year = Number(match[1]);
  const title = 'Year ' + year + ' NZ Mathematics Workbook';
  const levels = {
    6: 'Phase 2',
    7: 'Phase 3',
    8: 'Phase 3',
    9: 'Year 9 / Level 4–5',
    10: 'Year 10 / Level 5',
    11: 'Year 11 / NCEA Level 1',
    12: 'Year 12 / NCEA Level 2',
    13: 'Year 13 / NCEA Level 3'
  };

  document.body.dataset.theme = 'year' + year;
  document.title = title;
  document.getElementById('brand-home-btn').textContent = 'NZ' + year;
  document.getElementById('brand-home-btn').title = 'Return to Year ' + year + ' Curriculum Overview';
  document.getElementById('header-main-title').textContent = title;
  document.getElementById('header-sub-title').textContent =
    'New Zealand Curriculum (' + levels[year] + ') — 6 Strands, 16 Sub-Strands & PDF Answer Key Generator';
  document.querySelector('.strand-page-nav').setAttribute('aria-label', title + ' Strand Pages');
  document.getElementById('strand-page-heading').textContent =
    'Year ' + year + ' New Zealand Mathematics Curriculum — All 6 Strands';
  document.querySelector('#completion-pdf-banner p').textContent =
    'Your worked Year ' + year + ' NZ Mathematics solution sheet and PDF printout with answers are ready.';
  document.getElementById('printout-heading').textContent =
    '📄 Year ' + year + ' NZ Mathematics — Answer Key & Printout';

  const scripts = year <= 7
    ? ['/assets/js/year' + year + '-curriculum.js', '/assets/js/curriculum-workbook.js']
    : year >= 12
      ? ['/assets/js/year' + year + '-curriculum.js', '/assets/js/senior-workbook.js']
      : ['/assets/js/year' + year + '-workbook.js'];

  scripts.reduce(function (loaded, source) {
    return loaded.then(function () {
      return new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src = source;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    });
  }, Promise.resolve()).catch(function () {
    const message = document.createElement('p');
    message.className = 'workbook-load-error';
    message.setAttribute('role', 'alert');
    message.textContent = 'This workbook could not be loaded. Refresh the page or contact your administrator.';
    document.querySelector('.app-container').prepend(message);
  });
})();
