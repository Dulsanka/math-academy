(function () {
  const match = window.location.pathname.match(/year(6|7|8|9|10|11|12|13)(?:_|\.|$)/i);
  const isArithmetic = window.location.pathname === '/1_interactive_math_workbook.html';
  if (!match && !isArithmetic) return;

  const year = match ? Number(match[1]) : null;
  const loadScript = function (source) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = source;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  function sanitizeSvg(markup) {
    if (typeof markup !== 'string' || markup.length > 32_000) return '';
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (parsed.querySelector('parsererror') || !parsed.documentElement || parsed.documentElement.localName !== 'svg') return '';
    const allowedTags = new Set(['svg', 'g', 'rect', 'text', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'path']);
    const allowedAttrs = new Set(['viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'text-anchor', 'font-size', 'font-weight', 'points', 'd', 'transform']);
    function clean(node) {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || '');
      if (node.nodeType !== Node.ELEMENT_NODE || !allowedTags.has(node.localName)) return null;
      const safe = document.createElementNS('http://www.w3.org/2000/svg', node.localName);
      Array.from(node.attributes).forEach(function (attribute) {
        if (!allowedAttrs.has(attribute.name)) return;
        const value = attribute.value;
        if (['fill', 'stroke'].includes(attribute.name) && !/^(none|#[0-9a-f]{3,8}|[a-z]{1,20})$/i.test(value)) return;
        if (attribute.name === 'text-anchor' && !/^(start|middle|end)$/i.test(value)) return;
        if (attribute.name === 'font-weight' && !/^(normal|bold|[1-9]00)$/i.test(value)) return;
        if (['viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'stroke-width', 'stroke-dasharray', 'font-size', 'points', 'd', 'transform'].includes(attribute.name) && !/^[0-9a-zA-Z.,+\-()\s]*$/.test(value)) return;
        safe.setAttribute(attribute.name, value);
      });
      Array.from(node.childNodes).forEach(function (child) {
        const safeChild = clean(child);
        if (safeChild) safe.appendChild(safeChild);
      });
      return safe;
    }
    const cleanRoot = clean(parsed.documentElement);
    return cleanRoot ? new XMLSerializer().serializeToString(cleanRoot) : '';
  }

  async function initialize() {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
    const session = await response.json();
    if (!response.ok || !session.authenticated || !session.user || !session.user.id) throw new Error('Sign-in is required.');
    document.body.dataset.accountId = session.user.id;
    window.mathAcademyProgressKey = function (key) {
      return 'mathAcademyProgress:' + encodeURIComponent(session.user.id) + ':' + key;
    };
    window.mathAcademySanitizeSvg = sanitizeSvg;
    const scripts = isArithmetic ? ['/assets/js/interactive-workbook.js'] : year <= 7
      ? ['/assets/js/year' + year + '-curriculum.js', '/assets/js/curriculum-workbook.js']
      : year >= 12
        ? ['/assets/js/year' + year + '-curriculum.js', '/assets/js/senior-workbook.js']
        : ['/assets/js/year' + year + '-workbook.js'];
    for (const source of scripts) await loadScript(source);
  }

  if (isArithmetic) {
    document.body.dataset.theme = 'arithmetic';
    initialize().catch(showLoadError);
    return;
  }
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

  initialize().catch(showLoadError);

  function showLoadError() {
    const message = document.createElement('p');
    message.className = 'workbook-load-error';
    message.setAttribute('role', 'alert');
    message.textContent = 'This workbook could not be loaded. Refresh the page or contact your administrator.';
    const container = document.querySelector('.app-container');
    if (container) container.prepend(message);
  }
})();
