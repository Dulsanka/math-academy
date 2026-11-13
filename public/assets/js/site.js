    (function () {
      const authGate = document.getElementById('auth-gate');
      const loginForm = document.getElementById('login-form');
      const loginStatus = document.getElementById('login-status');
      const designPreview = document.getElementById('nz-design-preview');
      const designOption = document.getElementById('nz-design-option');
      const designDescription = document.getElementById('nz-design-description');
      const welcomeHero = document.querySelector('.welcome-hero');
      const allowedWorkbooks = new Set();
      let signedIn = false;

      const designDescriptions = {
        fern: 'A soft silver fern watermark over the current blue theme.',
        stars: 'The Southern Cross in fine, quiet blue linework.',
        contours: 'Aotearoa-inspired topographic contour lines.',
        pohutukawa: 'A restrained pōhutukawa flower and leaf watermark.'
      };

      function selectDesign(value) {
        const design = Object.prototype.hasOwnProperty.call(designDescriptions, value) ? value : 'fern';
        welcomeHero.dataset.nzDesign = design;
        designOption.value = design;
        designDescription.textContent = designDescriptions[design];
        try { window.localStorage.setItem('math-academy-nz-design-preview', design); } catch (_) { /* Preview still works when storage is unavailable. */ }
      }

      if (new URLSearchParams(window.location.search).get('designPreview') === '1') {
        designPreview.hidden = false;
        let savedDesign = 'fern';
        try { savedDesign = window.localStorage.getItem('math-academy-nz-design-preview') || savedDesign; } catch (_) { /* Use the default preview. */ }
        selectDesign(savedDesign);
        designOption.addEventListener('change', function () { selectDesign(designOption.value); });
      } else {
        welcomeHero.dataset.nzDesign = 'none';
      }

      function entitlementFor(wbKey) {
        if (wbKey === 'wb_arith') return 'arithmetic';
        if (wbKey && wbKey.indexOf('wb_y') === 0) return 'year' + wbKey.slice(4);
        return '';
      }

      async function authRequest(url, options) {
        const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
        const payload = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
        return payload;
      }

      function applyEntitlements(payload) {
        signedIn = true;
        allowedWorkbooks.clear();
        (payload.allowedWorkbooks || []).forEach(function (key) { allowedWorkbooks.add(key); });
        document.querySelectorAll('.requires-auth').forEach(function (el) { el.classList.remove('hidden'); });
        authGate.classList.add('hidden');
        document.querySelectorAll('.dock-wb-btn[data-select-wb], [data-launch-wb]').forEach(function (el) {
          const key = el.getAttribute('data-select-wb') || el.getAttribute('data-launch-wb');
          const entitlement = entitlementFor(key);
          const allowed = key === 'home' || allowedWorkbooks.has(entitlement);
          el.classList.toggle('hidden', !allowed);
        });
        const noWorkbooksMessage = document.getElementById('no-workbooks-message');
        noWorkbooksMessage.textContent = payload.user && payload.user.accountType === 'child'
          ? 'Your sign-in is ready. Your parent or guardian requested workbook access; an administrator must approve each workbook before it appears here.'
          : 'No workbooks are assigned to this account yet. Ask your academy administrator to grant access.';
        noWorkbooksMessage.classList.toggle('hidden', allowedWorkbooks.size > 0);
        document.getElementById('btn-admin-users').classList.toggle('hidden', !payload.user || payload.user.role !== 'admin');
        document.getElementById('btn-parent-portal').classList.toggle('hidden', !payload.user || payload.user.accountType !== 'parent');
        loginStatus.textContent = '';
      }

      function showSignedOut() {
        signedIn = false;
        document.querySelectorAll('.requires-auth').forEach(function (el) { el.classList.add('hidden'); });
        workbookViewportWrap.classList.add('hidden');
        authGate.classList.remove('hidden');
      }

      loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const submit = loginForm.querySelector('button[type="submit"]');
        submit.disabled = true;
        loginStatus.textContent = 'Signing in…';
        try {
          const payload = await authRequest('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginForm.username.value, password: loginForm.password.value })
          });
          const selectedType = loginForm.elements.accountType.value;
          const actualType = payload.user && payload.user.role === 'admin' ? 'admin' : payload.user && payload.user.accountType === 'parent' ? 'parent' : 'child';
          if (actualType !== 'admin' && selectedType !== actualType) {
            await authRequest('/api/auth/logout', { method: 'POST' });
            throw new Error('These credentials belong to a ' + actualType + ' account. Choose the matching sign-in option.');
          }
          loginForm.reset();
          if (actualType === 'parent') { window.location.assign('/parent.html'); return; }
          if (actualType === 'admin') { window.location.assign('/admin.html'); return; }
          applyEntitlements(payload);
        } catch (error) { loginStatus.textContent = error.message; }
        finally { submit.disabled = false; }
      });

      document.getElementById('btn-sign-out').addEventListener('click', async function () {
        try { await authRequest('/api/auth/logout', { method: 'POST' }); } catch (_) {}
        document.getElementById('workbook-iframe').src = 'about:blank';
        showSignedOut();
      });

      authRequest('/api/auth/me').then(function (payload) {
        if (payload.authenticated && payload.user && payload.user.role === 'admin') { window.location.replace('/admin.html'); return; }
        if (payload.authenticated) applyEntitlements(payload);
        else showSignedOut();
      }).catch(function () {
        showSignedOut();
        loginStatus.textContent = 'The access service is unavailable. Please try again later.';
      });

      const WORKBOOK_FILES = {
        wb_arith: '/1_interactive_math_workbook.html',
        wb_y6: '/6_year6_nz_mathematics_workbook.html',
        wb_y7: '/7_year7_nz_mathematics_workbook.html',
        wb_y8: '/2_year8_nz_mathematics_workbook.html',
        wb_y9: '/3_year9_nz_mathematics_workbook.html',
        wb_y10: '/4_year10_nz_mathematics_workbook.html',
        wb_y11: '/5_year11_nz_mathematics_workbook.html',
        wb_y12: '/8_year12_nz_mathematics_workbook.html',
        wb_y13: '/9_year13_nz_mathematics_workbook.html'
      };

      const landingPortalView = document.getElementById('landing-portal-view');
      const workbookViewportWrap = document.getElementById('workbook-viewport-wrap');
      const workbookIframe = document.getElementById('workbook-iframe');
      const dockWbBtns = document.querySelectorAll('.dock-wb-btn[data-select-wb]');
      const launchCards = document.querySelectorAll('[data-launch-wb]');
      const dockHomeBrand = document.getElementById('dock-home-brand');

      let currentWorkbookKey = 'home';

      function selectWorkbook(wbKey) {
        if (!signedIn) return;
        const entitlementKey = entitlementFor(wbKey);
        if (wbKey !== 'home' && !allowedWorkbooks.has(entitlementKey)) return;
        currentWorkbookKey = wbKey;
        dockWbBtns.forEach(function (btn) {
          btn.classList.toggle('active', btn.getAttribute('data-select-wb') === wbKey);
        });

        if (wbKey === 'home') {
          landingPortalView.classList.remove('hidden');
          workbookViewportWrap.classList.add('hidden');
          return;
        }

        const workbookFile = WORKBOOK_FILES[wbKey];
        if (!workbookFile) return;
        landingPortalView.classList.add('hidden');
        workbookViewportWrap.classList.remove('hidden');
        workbookIframe.src = workbookFile;
      }

      dockWbBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectWorkbook(btn.getAttribute('data-select-wb'));
        });
      });

      launchCards.forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          selectWorkbook(el.getAttribute('data-launch-wb'));
        });
      });

      dockHomeBrand.addEventListener('click', function () {
        selectWorkbook('home');
      });

      // PREPARED MATH TOPIC GUIDES
      const AI_KNOWLEDGE = {
        division: {
          title: '➗ Long Division: The DMSB (Divide, Multiply, Subtract, Bring Down) Cycle',
          concept: 'Long division breaks a large division problem into small, repeatable steps working from left to right across the dividend digits.',
          example: 'Worked Example (different numbers: 145 ÷ 6):<br/>1. Divide 1 by 6 → 0 (write 0 above 1, combine to make 14).<br/>2. Divide 14 by 6 → 2 (since 2 × 6 = 12). Write 2 in the quotient.<br/>3. Subtract 14 − 12 = 2, then follow the arrow (↓) to bring down 5 → 25.<br/>4. Divide 25 by 6 → 4 (since 4 × 6 = 24). Subtract 25 − 24 = Remainder 1 → Final Answer: 24 R 1!',
          nzContext: 'Used across New Zealand when splitting team costs, calculating unit prices at the supermarket, or converting units!'
        },
        fractions_gst: {
          title: '💰 Percentages, Reverse Percentages & NZ 15% GST',
          concept: 'In New Zealand, Goods and Services Tax (GST) is 15% (0.15). Adding GST multiplies a price by 1.15. Removing GST from a GST-inclusive price divides by 1.15 (or multiplies by 3/23 to find the GST portion alone).',
          example: 'Worked Example:<br/>• Add 15% GST to $80: $80 × 1.15 = $92.<br/>• Find pre-GST price from $230 GST-inclusive: $230 ÷ 1.15 = $200 (and the GST portion is $230 × 3 ÷ 23 = $30).',
          nzContext: 'Essential for NCEA Level 1 Financial Literacy, retail discounts, and invoices across Aotearoa New Zealand.'
        },
        exponents: {
          title: '⚡ Index Laws, Fractional Powers & Standard Form',
          concept: 'When multiplying powers with the same base, add the exponents: a^m × a^n = a^(m+n). For fractional powers (Year 11), a^(m/n) means take the nth root first, then raise to the power m.',
          example: 'Worked Example:<br/>• 2³ × 2⁴ = 2^(3+4) = 2⁷ = 128.<br/>• Fractional Exponent 27^(2/3): Cube root of 27 is 3, then 3² = 9!',
          nzContext: 'Used in science, bacterial growth models, earthquake Richter scales, and astronomical distances.'
        },
        algebra: {
          title: '📐 Linear Equations, Simultaneous Equations & Quadratics',
          concept: 'Balance equations by performing the same inverse operation on both sides. For quadratics (x + a)(x + b) = x² + (a+b)x + ab, add the constants for the middle term and multiply them for the end term.',
          example: 'Worked Example:<br/>• Solve 5x + 4 = 2x + 19 → Subtract 2x: 3x + 4 = 19 → Subtract 4: 3x = 15 → Divide by 3: x = 5.<br/>• Expand (x + 3)(x + 5) = x² + (3+5)x + (3×5) = x² + 8x + 15.',
          nzContext: 'Forms the core of Te Mātaiaho Phase 4 & NCEA Level 1 algebraic modeling.'
        },
        geometry: {
          title: '📏 Pythagoras, SOHCAHTOA Trigonometry & Circle Theorems',
          concept: 'In any right-angled triangle, a² + b² = c² (where c is the hypotenuse). In 3D cuboids, d² = l² + w² + h². In circles, the angle at the centre is twice the angle at the circumference (2θ).',
          example: 'Worked Example:<br/>• Right triangle with legs 6 cm and 8 cm: c² = 6² + 8² = 36 + 64 = 100 → c = √100 = 10 cm.<br/>• Trigonometry: If Hypotenuse = 20 cm and θ = 30° (sin 30° = 0.5), Opposite = 20 × 0.5 = 10 cm.',
          nzContext: 'Used in marine navigation bearings around the Hauraki Gulf, architecture, and surveying.'
        },
        stats_prob: {
          title: '📊 PPDAC Statistics, Quartiles (IQR), NCEA ICIs & Probability Trees',
          concept: 'The Interquartile Range (IQR = Q₃ − Q₁) measures the spread of the middle 50% of data. In Year 11 NCEA, the Informal Confidence Interval for the population median is Median ± 1.5 × IQR / √n.',
          example: 'Worked Example:<br/>• If Median = 60, IQR = 16, and sample size n = 64 (so √n = 8):<br/>  Margin = 1.5 × 16 ÷ 8 = 3 → ICI is [57, 63].<br/>• Probability Tree: For independent events P(A) = 0.4 and P(B) = 0.5, P(A and B) = 0.4 × 0.5 = 0.20.',
          nzContext: 'Aligned with the NZ Statistical Enquiry Cycle (PPDAC) used in CensusAtSchool NZ.'
        }
      };

      const aiCoachModal = document.getElementById('ai-coach-modal');
      const btnOpenAiCoach = document.getElementById('btn-open-ai-coach');
      const btnCloseAiModal = document.getElementById('btn-close-ai-modal');
      const aiResponseBox = document.getElementById('ai-response-box');
      const aiTopicBtns = document.querySelectorAll('.ai-topic-btn[data-ai-topic]');
      const aiQuestionInput = document.getElementById('ai-question-input');
      const btnAskAi = document.getElementById('btn-ask-ai');

      function renderAiTopic(key) {
        const item = AI_KNOWLEDGE[key] || AI_KNOWLEDGE.division;
        aiResponseBox.innerHTML =
          '<h4>' + item.title + '</h4>' +
          '<p style="margin-bottom:8px;"><strong>Concept Breakdown:</strong> ' + item.concept + '</p>' +
          '<div style="background:#eef6ff; border-left:4px solid #0284c7; padding:10px 12px; border-radius:8px; margin-bottom:8px;">' +
            item.example +
          '</div>' +
          '<p style="font-size:0.82rem; color:#0f766e;"><strong>🌏 Real-World NZ Application:</strong> ' + item.nzContext + '</p>';
      }

      btnOpenAiCoach.addEventListener('click', function () {
        aiCoachModal.classList.remove('hidden');
        renderAiTopic('division');
      });

      btnCloseAiModal.addEventListener('click', function () {
        aiCoachModal.classList.add('hidden');
      });

      aiTopicBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          aiTopicBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          renderAiTopic(btn.getAttribute('data-ai-topic'));
        });
      });

      function handleCustomAiQuery() {
        const q = (aiQuestionInput.value || '').trim().toLowerCase();
        if (!q) return;
        const matches = [
          { key: 'division', terms: ['division', 'divide', 'remainder', 'long division'] },
          { key: 'fractions_gst', terms: ['gst', 'percent', 'fraction', 'interest', 'ratio', 'discount'] },
          { key: 'exponents', terms: ['power', 'exponent', 'index', 'root', 'standard form'] },
          { key: 'algebra', terms: ['algebra', 'equation', 'quadratic', 'parabola', 'simultaneous'] },
          { key: 'geometry', terms: ['pythagoras', 'trigonometry', 'trig', 'sine', 'angle', 'circle', 'volume'] },
          { key: 'stats_prob', terms: ['statistics', 'statistic', 'probability', 'quartile', 'iqr', 'ici', 'ppdac', 'box plot'] }
        ];
        const match = matches.find(function (item) {
          return item.terms.some(function (term) { return q.includes(term); });
        });
        if (match) {
          renderAiTopic(match.key);
          return;
        }
        aiResponseBox.innerHTML = '<p><strong>No matching guide found.</strong> Try one of the listed topics: division, fractions, GST, exponents, algebra, geometry, statistics, or probability.</p>';
      }

      btnAskAi.addEventListener('click', handleCustomAiQuery);
      aiQuestionInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleCustomAiQuery();
      });

      // SCIENTIFIC CALCULATOR
      const calculatorModal = document.getElementById('calculator-modal');
      const btnOpenCalculator = document.getElementById('btn-open-calculator');
      const btnCloseCalcModal = document.getElementById('btn-close-calc-modal');
      const calcDisplay = document.getElementById('calc-display');
      const calcKeyBtns = document.querySelectorAll('.calc-key-btn[data-calc-key]');

      let calcExpr = '';

      function evaluateArithmetic(expression) {
        const source = String(expression || '').replace(/\s+/g, '');
        const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/]/g) || [];
        if (tokens.join('') !== source) throw new Error('Invalid expression.');
        let position = 0;
        function primary() {
          const token = tokens[position++];
          if (token === '+' || token === '-') return token === '-' ? -primary() : primary();
          if (token === '(') {
            const value = sum();
            if (tokens[position++] !== ')') throw new Error('Missing closing parenthesis.');
            return value;
          }
          if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('Expected a number.');
          return Number(token);
        }
        function product() {
          let value = primary();
          while (tokens[position] === '*' || tokens[position] === '/') {
            const operator = tokens[position++];
            const right = primary();
            value = operator === '*' ? value * right : value / right;
          }
          return value;
        }
        function sum() {
          let value = product();
          while (tokens[position] === '+' || tokens[position] === '-') {
            const operator = tokens[position++];
            const right = product();
            value = operator === '+' ? value + right : value - right;
          }
          return value;
        }
        const result = sum();
        if (position !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid arithmetic result.');
        return result;
      }

      btnOpenCalculator.addEventListener('click', function () {
        calculatorModal.classList.remove('hidden');
      });

      btnCloseCalcModal.addEventListener('click', function () {
        calculatorModal.classList.add('hidden');
      });

      calcKeyBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const k = btn.getAttribute('data-calc-key');
          if (k === 'C') {
            calcExpr = '';
            calcDisplay.value = '0';
          } else if (k === 'del') {
            calcExpr = calcExpr.slice(0, -1);
            calcDisplay.value = calcExpr || '0';
          } else if (k === 'sqrt') {
            const v = parseFloat(calcDisplay.value) || 0;
            calcExpr = String(Number(Math.sqrt(v).toFixed(4)));
            calcDisplay.value = calcExpr;
          } else if (k === 'sq') {
            const v = parseFloat(calcDisplay.value) || 0;
            calcExpr = String(Number((v * v).toFixed(4)));
            calcDisplay.value = calcExpr;
          } else if (k === 'sin30') {
            calcExpr += String(Math.sin(Math.PI / 6));
            calcDisplay.value = calcExpr;
          } else if (k === 'pi') {
            calcExpr += String(Math.PI);
            calcDisplay.value = calcExpr;
          } else if (k === '=') {
            try {
              const res = evaluateArithmetic(calcExpr || '0');
              calcExpr = String(Number(Number(res).toFixed(5)));
              calcDisplay.value = calcExpr;
            } catch (e) {
              calcDisplay.value = 'Error';
              calcExpr = '';
            }
          } else {
            calcExpr += k;
            calcDisplay.value = calcExpr;
          }
        });
      });

      // READ ALOUD (TEXT-TO-SPEECH)
      const btnReadAloud = document.getElementById('btn-read-aloud');
      btnReadAloud.addEventListener('click', function () {
        try {
          if (!('speechSynthesis' in window)) return;
          window.speechSynthesis.cancel();
          let textToRead = 'Welcome to the New Zealand Mathematics Master Academy. Select any of the 7 workbooks to begin.';
          if (currentWorkbookKey !== 'home' && workbookIframe.contentDocument) {
            const doc = workbookIframe.contentDocument;
            const el = doc.querySelector('h3, .step-text, .problem-badge');
            if (el && el.textContent) {
              textToRead = el.textContent;
            }
          }
          const utter = new SpeechSynthesisUtterance(textToRead);
          utter.rate = 0.96;
          window.speechSynthesis.speak(utter);
        } catch (e) {}
      });
    })();
