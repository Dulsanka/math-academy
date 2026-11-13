(function () {
  const match = window.location.pathname.match(/year(6|7|8|9|10|11|12|13)(?:_|\.|$)/i);
  const isArithmetic = window.location.pathname === '/1_interactive_math_workbook.html';
  if (!match && !isArithmetic) return;

  const year = match ? Number(match[1]) : null;
  let loadErrorDisplayed = false;
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
    if (session.user.accountType === 'child') installProgressReporter(session.user.id, isArithmetic ? 'arithmetic' : 'year' + year);
    window.mathAcademySanitizeSvg = sanitizeSvg;
    const scripts = isArithmetic ? ['/assets/js/interactive-workbook.js'] : year <= 7
      ? ['/assets/js/year' + year + '-curriculum.js', '/assets/js/curriculum-workbook.js']
      : year >= 12
        ? ['/assets/js/year' + year + '-curriculum.js', '/assets/js/senior-workbook.js']
        : ['/assets/js/year' + year + '-workbook.js'];
    for (const source of scripts) {
      await loadScript(source);
      if (year >= 12 && source.indexOf('-curriculum.js') !== -1 &&
          (!Array.isArray(window.MATH_CURRICULUM_MODULES) || !window.MATH_CURRICULUM_META)) {
        throw new Error('Senior curriculum data failed to initialize.');
      }
    }
    if (year >= 12 && !window.mathAcademySeniorWorkbookReady) {
      throw new Error('Senior workbook engine failed to initialize.');
    }
  }

  function installProgressReporter(userId, workbookKey) {
    const nativeSetItem = Storage.prototype.setItem;
    let reportTimer = 0;
    let pendingSummary = null;
    function sendSummary(summary) {
      if (!summary) return;
      fetch('/api/progress', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(summary), keepalive: true }).catch(function () {});
    }
    function makeSummary(storageKey, raw) {
      let snapshot;
      try { snapshot = JSON.parse(raw); } catch { return null; }
      if (!snapshot || !Array.isArray(snapshot.questions) || !snapshot.questions.length) return null;
      const moduleKey = String(snapshot.activeModuleId || snapshot.workbookOp || workbookKey).slice(0, 120);
      const title = String(snapshot.activeModuleTitle || snapshot.workbookOp || (workbookKey === 'arithmetic' ? 'Arithmetic practice' : workbookKey.toUpperCase() + ' practice')).slice(0, 160);
      const questions = snapshot.questions.slice(0, 25);
      const topics = new Map();
      let completedQuestions = 0;
      let errorCount = 0;
      for (const question of questions) {
        const completed = Boolean(question && question.isCompleted);
        if (completed) completedQuestions += 1;
        const mistakes = question && question.wrongSteps && typeof question.wrongSteps === 'object' ? Object.keys(question.wrongSteps).length : 0;
        errorCount += mistakes;
        const name = String((question && question.topic) || title).slice(0, 120);
        if (!topics.has(name)) topics.set(name, { name, totalQuestions: 0, completedQuestions: 0, errorCount: 0 });
        const topic = topics.get(name); topic.totalQuestions += 1; topic.completedQuestions += completed ? 1 : 0; topic.errorCount += mistakes;
      }
      const seed = String(snapshot.seedCounter || 0);
      const metaKey = 'mathAcademyProgressSession:' + encodeURIComponent(userId) + ':' + workbookKey + ':' + moduleKey + ':' + seed;
      let sessionId = localStorage.getItem(metaKey);
      if (!sessionId) { sessionId = crypto.randomUUID(); localStorage.setItem(metaKey, sessionId); }
      return { workbookKey, sessionId, moduleKey, title, totalQuestions: questions.length,
        completedQuestions, errorCount, elapsedSeconds: Math.max(0, Math.min(604800, Number(snapshot.elapsedSeconds) || 0)),
        stars: Math.max(0, Math.min(1000000, Number(snapshot.stars) || 0)), topics: Array.from(topics.values()).slice(0, 25) };
    }
    Storage.prototype.setItem = function (key, value) {
      nativeSetItem.call(this, key, value);
      if (this !== window.localStorage || typeof key !== 'string' || !key.startsWith('mathAcademyProgress:' + encodeURIComponent(userId) + ':')) return;
      const summary = makeSummary(key, String(value));
      if (!summary) return;
      pendingSummary = summary;
      clearTimeout(reportTimer);
      reportTimer = setTimeout(function () {
        sendSummary(pendingSummary);
        pendingSummary = null;
      }, 600);
    };
    window.addEventListener('pagehide', function () { clearTimeout(reportTimer); sendSummary(pendingSummary); pendingSummary = null; }, { once: true });
  }

  function reportInitializationError() {
    showLoadError();
  }

  window.addEventListener('error', reportInitializationError);
  window.addEventListener('unhandledrejection', reportInitializationError);

  function startInitialization() {
    initialize().catch(showLoadError);
  }

  if (isArithmetic) {
    document.body.dataset.theme = 'arithmetic';
    startInitialization();
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

  startInitialization();

  function showLoadError() {
    if (loadErrorDisplayed) return;
    loadErrorDisplayed = true;
    const message = document.createElement('p');
    message.className = 'workbook-load-error';
    message.setAttribute('role', 'alert');
    message.textContent = 'This workbook encountered a problem and could not display its questions. Refresh the page; if it continues, contact your administrator.';
    const container = document.querySelector('.app-container');
    if (container) container.prepend(message);
  }
})();
