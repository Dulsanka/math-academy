    (function () {
      const CURRENT_YEAR = Number((document.body.dataset.theme || 'year12').replace(/\D/g, '')) || 12;
      // =========================================================================
      // SOUND ENGINE (Web Audio API)
      // =========================================================================
      const sound = {
        enabled: true,
        ctx: null,
        play: function (type) {
          if (!this.enabled) return;
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this.ctx) this.ctx = new AudioCtx();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            if (type === 'step') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, now);
              osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.09);
              gain.gain.setValueAtTime(0.08, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
              osc.start(now);
              osc.stop(now + 0.11);
            } else if (type === 'correct') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(523.25, now);
              osc.frequency.setValueAtTime(659.25, now + 0.08);
              osc.frequency.setValueAtTime(783.99, now + 0.16);
              gain.gain.setValueAtTime(0.12, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
              osc.start(now);
              osc.stop(now + 0.32);
            } else if (type === 'wrong') {
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(210, now);
              osc.frequency.linearRampToValueAtTime(170, now + 0.15);
              gain.gain.setValueAtTime(0.07, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
              osc.start(now);
              osc.stop(now + 0.17);
            }
          } catch (e) {}
        }
      };

      function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      // =========================================================================
      const CURRICULUM_MODULES = window.MATH_CURRICULUM_MODULES;
      const CURRICULUM_META = window.MATH_CURRICULUM_META;
      if (!Array.isArray(CURRICULUM_MODULES) || !CURRICULUM_META) throw new Error('Senior curriculum data is unavailable.');

      function makeSvgCard(title, innerSvg) {
        return (
          '<svg viewBox="0 0 460 150" width="100%" height="150" style="max-width:480px; font-family:Inter,sans-serif;">' +
          '<rect x="2" y="2" width="456" height="146" rx="12" fill="#f8fafc" stroke="#bae6fd" stroke-width="2"/>' +
          '<text x="16" y="24" font-size="12" font-weight="800" fill="#0369a1">' + title + '</text>' +
          innerSvg +
          '</svg>'
        );
      }

      function generateQuestionsForModule(moduleId, seedOffset) {
        const senior3 = CURRENT_YEAR === 13, questions = [];
        const round = n => Number(n.toFixed(2));
        const add = (topic, prompt, step1, value1, step2, answer, unit) => {
          const final = String(answer);
          questions.push({ topic, prompt,
            svgHtml: makeSvgCard(topic, '<text x="230" y="88" text-anchor="middle" font-size="15" font-weight="800">' + prompt.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</text>'),
            steps: [{label:step1,expected:String(value1),unit:unit||''},{label:step2,expected:final,unit:unit||''}],
            finalAnswer:final, altAnswers:unit?[final+unit]:[] });
        };
        for(let step=0;step<10;step++) {
          const i = step + Math.abs(Number(seedOffset) || 0);
          const n=2+i%6, c=2+i%5;
          switch(moduleId) {
            case 'num_types': if(senior3){const k=1+i%3;add('Complex numbers','For z = '+3*k+' + '+4*k+'i, find its modulus.','Square and add the components',25*k*k,'Take the square root',5*k);}else{const p=3+i%6;add('Exponential equations','Solve 2^x = '+Math.pow(2,p)+' for x.','Write the right side as a power of 2',p,'Match the exponents',p);} break;
            case 'num_ops': if(senior3){const p=2+i%6;add('Logarithms','Solve log base 2 of '+Math.pow(2,p)+' = x.','Rewrite as 2^x = '+Math.pow(2,p),p,'Match the exponents',p);}else{const principal=1000+i*100,one=round(principal*1.05),amount=round(one*1.05);add('Compound growth','An account has $'+principal+' and grows by 5% yearly. Find its value after 2 years.','Calculate value after year one',one,'Apply 5% growth again',amount,'$');} break;
            case 'num_prop': if(senior3){const first=2+i%4,total=first*15;add('Geometric series','Find the sum of the first four terms of '+first+', '+first*2+', '+first*4+', ...','Use S4 = first term x (2^4 - 1)',total,'Evaluate the series',total);}else{const x=3+i%4,target=x+2,k=(4+i%5)*12,y=k/target;add('Inverse proportion','y varies inversely with x. If y='+k/x+' at x='+x+', find y at x='+target+'.','Find the constant k = xy',k,'Calculate y = k / '+target,round(y));} break;
            case 'alg_expr': if(senior3){const x=2+i%4,l=2+i%4,d=1+i%5,v=x*x*x+l*x+d;add('Polynomial functions','Evaluate f(x)=x^3+'+l+'x+'+d+' at x='+x+'.','Calculate x cubed',x*x*x,'Add the remaining terms',v);}else{const k=2+i%8,v=10+k;add('Polynomial factorisation','Simplify (x^2-'+k*k+')/(x-'+k+'), then evaluate at x=10.','Simplify to x + '+k+' and substitute x=10',v,'State the simplified value',v);} break;
            case 'alg_linear': if(senior3){const x=1+i%5,coef=2+i%6,slope=2*coef*x;add('Differentiation','For f(x)='+coef+'x^2+'+c+', find the gradient at x='+x+'.','Differentiate: f prime = '+2*coef+'x',slope,'Evaluate at x='+x,slope);}else{const x=3+i%6,y=2+i%5,sum=x+y,diff=x-y;add('Simultaneous equations','Solve x+y='+sum+' and x-y='+diff+'. Find x.','Add the equations to get 2x',sum+diff,'Divide by 2',x);} break;
            case 'alg_patterns': if(senior3){const coef=2+i%5,d=1+i%4,t=2+i%4,area=coef*t*t/2+d*t;add('Integration','Find area under y='+coef+'x+'+d+' from x=0 to x='+t+'.','Evaluate antiderivative at the upper bound',area,'Subtract its value at zero',area);}else{const h=2+i%6,k=3+i%8,v=h*h+k;add('Quadratic functions','For y=(x-'+h+')^2+'+k+', find the y-intercept.','Identify the vertex x-coordinate',h,'Substitute x=0: h squared + k',v);} break;
            case 'meas_units': {const x=2+i%4,coef=2+i%5,l=2+i%6,rate=2*coef*x+l;add(senior3?'Kinematics and acceleration':'Rates of change',senior3?'Velocity v(t)='+coef+'t^2+'+l+'. Find acceleration at t='+x+'.':'For f(x)='+coef+'x^2+'+l+'x, find f prime at x='+x+'.','Differentiate the function',rate,'Evaluate the derivative',rate,senior3?'m/s^2':'');break;}
            case 'meas_area_vol': {if(senior3){const side=2+i%6,area=side*side;add('Calculus optimisation','A square has side '+side+' m. Find its area.',area,'Use the area formula',area,'m^2');}else{const coef=2+i%6,limit=2+i%5,area=coef*limit*limit/2;add('Integration and area','Find the area under y='+coef+'x from x=0 to x='+limit+'.',area,'Evaluate the integral at the upper bound',area,'square units');}break;}
            case 'meas_time': if(senior3){const coef=2+i%5,t=2+i%4,d=coef*t*t/2;add('Area under a curve','Velocity is v(t)='+coef+'t. Find distance from t=0 to t='+t+'.','Integrate velocity and evaluate at t='+t,d,'Subtract value at t=0',d,'m');}else{const a=2+i%5,t=2+i%5,b=2*a*t;add('Calculus optimisation','h(t)=-'+a+'t^2+'+b+'t. At what time is its maximum?','Use t=-b/(2a); calculate 2a',2*a,'Calculate the turning point time',t,'s');} break;
            case 'geom_shapes': if(senior3){add('Trigonometric equations','Solve sin(theta)=0.5 for 0 <= theta <= 90 degrees.','Recall the exact angle',30,'State the solution in degrees',30,'degrees');}else{const x=3+i%5,y=4+i%4,ar=x*y/2;add('Trigonometry and triangle area','A triangle has sides '+x+' cm and '+y+' cm with included angle 90 degrees. Find its area.','Use area = 1/2 ab sin(C)',ar,'Evaluate one half times '+x+' times '+y,ar,'cm^2');} break;
            case 'geom_trans': if(senior3){const ax=2+i%5,ay=1+i%4,bx=1+i%3,by=2+i%5,dot=ax*bx+ay*by;add('Vectors','Find the dot product of ('+ax+','+ay+') and ('+bx+','+by+').','Multiply matching components and add',dot,'State the dot product',dot);}else{const k=1+i%4;add('Vectors','Find the magnitude of vector ('+3*k+','+4*k+').','Square and add the components',25*k*k,'Take the square root',5*k);} break;
            case 'stat_enquiry': if(senior3){const sample=[100,400,900,1600][i%4],margin=round(100/Math.sqrt(sample));add('Evaluating reports','Margin of error is about 100/sqrt(n) percentage points. For n='+sample+', find the margin.','Calculate sqrt(n)',Math.sqrt(sample),'Calculate 100 / sqrt(n)',margin,'percentage points');}else{const sample=[25,36,64,100][i%4],iqr=4+(i%4)*4,median=50+i*2,m=1.5*iqr/Math.sqrt(sample);add('Statistical investigations','Median='+median+', IQR='+iqr+', n='+sample+'. Find the upper estimate using median + 1.5 x IQR / sqrt(n).','Calculate the interval margin',m,'Add it to the median',median+m);} break;
            case 'stat_analysis': {const pred=40+i*3,obs=pred+5+i%7,res=obs-pred;add('Regression residuals','Predicted='+pred+', observed='+obs+'. Find the residual (observed - predicted).','Subtract predicted from observed',res,'State the residual',res);break;}
            case 'stat_trends': if(senior3){const lo=40+i*2,hi=lo+12,mid=(lo+hi)/2;add('Inference and interval estimates','A confidence interval is ['+lo+', '+hi+']. Find its midpoint.','Add the endpoints',lo+hi,'Divide the total by 2',mid);}else{const trend=100+i*10,seas=5+i*2;add('Statistical modelling','Trend='+trend+' and seasonal effect +'+seas+'. Find the forecast.','Identify the trend',trend,'Add the seasonal effect',trend+seas);} break;
            case 'prob_exp': if(senior3){add('Binomial distributions','For a binomial variable n=4 and p=0.5, find its expected value.','Use E(X)=np',2,'Multiply n by p',2);}else{const p=[0.25,0.5,0.75][i%3],prob=round(3*p*(1-p)*(1-p));add('Probability distributions','Three independent trials have success probability '+p+'. Find probability of exactly one success.','There are 3 positions for the success',3,'Calculate 3 x p x (1-p)^2',prob);} break;
            case 'prob_theo': {const success=2+i%5,total=10+i%6,prob=round(success/total);add('Conditional probability','There are '+success+' successes among '+total+' outcomes. Find the probability of success.', 'Write successes divided by total',prob,'Round to 2 decimal places',prob);break;}
            default:return [];
          }
        }
        return questions;
      }

      // Generate mixed questions across this year's curriculum modules.
      function generateFullCurriculumRandom25(seedOffset) {
        const list = [];
        for (let i = 0; i < 25; i++) {
          const mod = CURRICULUM_MODULES[i % CURRICULUM_MODULES.length];
          const modQs = generateQuestionsForModule(mod.id, (seedOffset || 0) + i);
          const picked = modQs[i % modQs.length];
          picked.topic = mod.strandName + ' • ' + picked.topic;
          list.push(picked);
        }
        return list;
      }

      // =========================================================================
      // STATE MANAGEMENT
      // =========================================================================
      const state = {
        view: 'curriculum', // 'curriculum' | 'student' | 'tutor' | 'printout'
        activeStrandFilter: 'all',
        activeModuleId: 'num_types',
        activeModuleTitle: CURRICULUM_MODULES[0].title,
        seedCounter: 0,
        activeQuestionIdx: 0,
        questions: [],
        pdfAutoTriggered: false,
        stars: 0,
        streak: 0,
        elapsedSeconds: 0,
        timerHandle: null
      };

      const PROGRESS_STORAGE_KEY = window.mathAcademyProgressKey('year' + CURRENT_YEAR);

      function saveProgress() {
        try {
          const snapshot = {};
          Object.keys(state).forEach(function (key) {
            if (key !== 'timerHandle') snapshot[key] = state[key];
          });
          localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(snapshot));
        } catch (e) {}
      }

      function scheduleProgressSave() {
        if (progressSaveTimeout) clearTimeout(progressSaveTimeout);
        progressSaveTimeout = setTimeout(saveProgress, 250);
      }

      function restoreProgress() {
        try {
          const saved = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || 'null');
          if (!saved || !Array.isArray(saved.questions) || !saved.questions.length) return false;
          if (saved.questions.some(function (question) { return !question || typeof question !== 'object' || !Array.isArray(question.steps); })) return false;
          saved.questions.forEach(function (question) {
            question.topic = String(question.topic || '').slice(0, 300);
            question.prompt = String(question.prompt || '').slice(0, 2000);
            question.svgHtml = window.mathAcademySanitizeSvg(question.svgHtml || '');
            question.steps.forEach(function (step) {
              if (!step || typeof step !== 'object') throw new Error('Invalid saved question step.');
              step.label = String(step.label || '').slice(0, 500);
              step.expected = String(step.expected || '').slice(0, 200);
              step.unit = String(step.unit || '').slice(0, 40);
            });
          });
          Object.keys(saved).forEach(function (key) {
            if (key in state && key !== 'timerHandle') state[key] = saved[key];
          });
          return true;
        } catch (e) {
          return false;
        }
      }

      window.addEventListener('pagehide', saveProgress);

      function wrapRawQuestionsIntoState(rawList) {
        return rawList.map(function (rq, idx) {
          return {
            index: idx,
            topic: rq.topic,
            prompt: rq.prompt,
            svgHtml: rq.svgHtml,
            steps: rq.steps.map(function (st) {
              return { label: st.label, expected: String(st.expected).trim(), unit: st.unit || '' };
            }),
            finalAnswer: String(rq.finalAnswer).trim(),
            altAnswers: (rq.altAnswers || []).map(function (a) { return String(a).toLowerCase().replace(/\s+/g, ''); }),
            currentStepIdx: 0,
            stepInputs: {},
            wrongSteps: {},
            finalAnswerInput: '',
            answerFeedbackType: '',
            answerFeedbackMessage: '',
            isCompleted: false,
            notes: '',
            drawingDataUrl: ''
          };
        });
      }

      function launchModuleWorkbook(moduleId, targetView) {
        state.activeModuleId = moduleId;
        if (moduleId === 'random_25') {
          state.activeModuleTitle = '25-Question Year ' + CURRENT_YEAR + ' NZ Mathematics Workbook Random Mix';
          state.questions = wrapRawQuestionsIntoState(generateFullCurriculumRandom25(state.seedCounter));
        } else {
          const mod = CURRICULUM_MODULES.find(function (m) { return m.id === moduleId; }) || CURRICULUM_MODULES[0];
          state.activeModuleTitle = mod.title + ' (10 Questions)';
          state.questions = wrapRawQuestionsIntoState(generateQuestionsForModule(mod.id, state.seedCounter));
        }
        state.activeQuestionIdx = 0;
        state.pdfAutoTriggered = false;
        setView(targetView || 'student');
      }

      function getActiveQ() {
        return state.questions[state.activeQuestionIdx];
      }

      function getCompletedCount() {
        let c = 0;
        for (let i = 0; i < state.questions.length; i++) {
          if (state.questions[i].isCompleted) c++;
        }
        return c;
      }

      // =========================================================================
      // DOM REFERENCES
      // =========================================================================
      const brandHomeBtn = document.getElementById('brand-home-btn');
      const statStars = document.getElementById('stat-stars');
      const statStreak = document.getElementById('stat-streak');
      const statTimer = document.getElementById('stat-timer');
      const btnSoundToggle = document.getElementById('btn-sound-toggle');

      const btnTabCurriculum = document.getElementById('btn-tab-curriculum');
      const btnTabStudent = document.getElementById('btn-tab-student');
      const btnTabTutor = document.getElementById('btn-tab-tutor');
      const btnTabPrintout = document.getElementById('btn-tab-printout');

      const strandNavBtns = document.querySelectorAll('.strand-nav-btn[data-strand-page]');
      const btnLaunchRandom25 = document.getElementById('btn-launch-random-25');
      const btnHeroRandom25 = document.getElementById('btn-hero-random-25');

      const curriculumPageView = document.getElementById('curriculum-page-view');
      const strandPageHeading = document.getElementById('strand-page-heading');
      const strandPageDesc = document.getElementById('strand-page-desc');
      const substrandCardsMount = document.getElementById('substrand-cards-mount');

      const workbookActiveShell = document.getElementById('workbook-active-shell');
      const activeModuleTitle = document.getElementById('active-module-title');
      const progressFill = document.getElementById('progress-fill');
      const progressCountBadge = document.getElementById('progress-count-badge');
      const questionPillsRow = document.getElementById('question-pills-row');
      const btnRegenerateSet = document.getElementById('btn-regenerate-set');
      const btnQuickPdf = document.getElementById('btn-quick-pdf');

      const completionPdfBanner = document.getElementById('completion-pdf-banner');
      const completionBannerTitle = document.getElementById('completion-banner-title');
      const btnBannerDownloadPdf = document.getElementById('btn-banner-download-pdf');
      const btnBannerViewPrintout = document.getElementById('btn-banner-view-printout');

      const tutorPanel = document.getElementById('tutor-panel');
      const tutorQuestionsTbody = document.getElementById('tutor-questions-tbody');
      const btnTutorRandomize = document.getElementById('btn-tutor-randomize');
      const btnTutorAutocomplete = document.getElementById('btn-tutor-autocomplete');
      const btnTutorSave = document.getElementById('btn-tutor-save');

      const workspaceLayout = document.getElementById('workspace-layout');
      const questionTopicBadge = document.getElementById('question-topic-badge');
      const questionMainPrompt = document.getElementById('question-main-prompt');
      const visualDiagramStage = document.getElementById('visual-diagram-stage');
      const stepsLadderMount = document.getElementById('steps-ladder-mount');

      const btnHintStep = document.getElementById('btn-hint-step');
      const btnCheckStep = document.getElementById('btn-check-step');
      const btnShowSteps = document.getElementById('btn-show-steps');
      const btnRestartQ = document.getElementById('btn-restart-q');

      const btnPrevQuestion = document.getElementById('btn-prev-question');
      const btnNextQuestion = document.getElementById('btn-next-question');
      const questionBottomStatus = document.getElementById('question-bottom-status');

      const answerCard = document.getElementById('answer-card');
      const answerStatusBadge = document.getElementById('answer-status-badge');
      const answerHelperText = document.getElementById('answer-helper-text');
      const finalAnswerInput = document.getElementById('final-answer-input');
      const btnSubmitAnswer = document.getElementById('btn-submit-answer');
      const answerFeedback = document.getElementById('answer-feedback');

      const btnTabTextNotes = document.getElementById('btn-tab-text-notes');
      const btnTabDrawNotes = document.getElementById('btn-tab-draw-notes');
      const problemNotesTextarea = document.getElementById('problem-notes-textarea');
      const scratchCanvasWrap = document.getElementById('scratch-canvas-wrap');
      const scratchCanvas = document.getElementById('scratch-canvas');
      const notesSaveIndicator = document.getElementById('notes-save-indicator');
      const btnClearNotes = document.getElementById('btn-clear-notes');

      const printoutSection = document.getElementById('printout-section');
      const printoutHeading = document.getElementById('printout-heading');
      const printoutSubtitle = document.getElementById('printout-subtitle');
      const printoutGrid = document.getElementById('printout-grid');
      const btnGeneratePdfFile = document.getElementById('btn-generate-pdf-file');
      const btnWindowPrint = document.getElementById('btn-window-print');
      const btnBackToWorkbook = document.getElementById('btn-back-to-workbook');

      // =========================================================================
      // RENDER CURRICULUM STRAND PAGES (PAGE SEPARATED BY STRAND)
      // =========================================================================
      const STRAND_META = CURRICULUM_META.strands;

      function renderCurriculumPage(strandFilter) {
        state.activeStrandFilter = strandFilter || 'all';
        const meta = STRAND_META[state.activeStrandFilter] || STRAND_META.all;
        strandPageHeading.textContent = meta.title;
        strandPageDesc.textContent = meta.desc;

        strandNavBtns.forEach(function (btn) {
          btn.classList.toggle('active', btn.getAttribute('data-strand-page') === state.activeStrandFilter && state.view === 'curriculum');
        });
        btnLaunchRandom25.classList.toggle('active', state.activeModuleId === 'random_25' && state.view !== 'curriculum');

        const filtered = CURRICULUM_MODULES.filter(function (m) {
          return state.activeStrandFilter === 'all' || m.strandId === state.activeStrandFilter;
        });

        substrandCardsMount.innerHTML = '';
        filtered.forEach(function (mod) {
          const card = document.createElement('div');
          card.className = 'substrand-card';

          const bulletsHtml = mod.topics.map(function (t) {
            return '<li>' + t + '</li>';
          }).join('');

          card.innerHTML =
            '<div>' +
              '<div class="substrand-header">' +
                '<span class="substrand-tag">' + mod.badge + '</span>' +
                '<span style="font-size:0.75rem; font-weight:800; color:#475569;">10 Questions</span>' +
              '</div>' +
              '<h3>' + mod.title + '</h3>' +
              '<ul class="topic-bullet-list">' + bulletsHtml + '</ul>' +
            '</div>' +
            '<div class="substrand-actions">' +
              '<button type="button" class="btn-primary" style="flex:1;" data-open-mod="' + mod.id + '" data-open-view="student">' +
                'Start 10 Questions →' +
              '</button>' +
              '<button type="button" class="btn-secondary" data-open-mod="' + mod.id + '" data-open-view="tutor">' +
                '⚙️ Customize' +
              '</button>' +
            '</div>';

          substrandCardsMount.appendChild(card);
        });

        const openBtns = substrandCardsMount.querySelectorAll('[data-open-mod]');
        openBtns.forEach(function (b) {
          b.addEventListener('click', function () {
            const mId = b.getAttribute('data-open-mod');
            const vw = b.getAttribute('data-open-view');
            launchModuleWorkbook(mId, vw);
          });
        });
      }

      // =========================================================================
      // RENDER ACTIVE QUESTION WORKSPACE (PROGRESSIVE STEP LADDER + RIGHT ANSWER)
      // =========================================================================
      function renderAll() {
        scheduleProgressSave();
        statStars.textContent = '⭐ ' + state.stars + ' Stars';
        statStreak.textContent = '🔥 ' + state.streak + ' Streak';

        const totalQ = state.questions.length;
        const completedCount = getCompletedCount();
        const pct = totalQ > 0 ? Math.round((completedCount / totalQ) * 100) : 0;

        activeModuleTitle.textContent = state.activeModuleTitle;
        progressFill.style.width = pct + '%';
        progressCountBadge.textContent = completedCount + ' / ' + totalQ + ' Completed';

        if (completedCount === totalQ && totalQ > 0) {
          completionBannerTitle.textContent = '🎉 Congratulations! All ' + totalQ + ' Questions Are Complete!';
          completionPdfBanner.classList.add('visible');
        } else {
          completionPdfBanner.classList.remove('visible');
        }

        // Render Question Selector Pills
        questionPillsRow.classList.toggle('grid-25', totalQ > 10);
        questionPillsRow.innerHTML = '';
        for (let i = 0; i < totalQ; i++) {
          const qItem = state.questions[i];
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'q-pill-btn';
          if (i === state.activeQuestionIdx) pill.classList.add('active');
          if (qItem.isCompleted) pill.classList.add('completed');

          const shortDetail = qItem.prompt.length > 28 ? (qItem.prompt.slice(0, 26) + '…') : qItem.prompt;
          pill.innerHTML =
            '<span class="q-pill-num">' + (qItem.isCompleted ? '✓ ' : '') + 'Q' + (i + 1) + ' • ' + escapeHtml(qItem.topic.split(String.fromCharCode(8226)).pop().trim()) + '</span>' +
            '<span class="q-pill-sub">' + escapeHtml(shortDetail) + '</span>';

          pill.addEventListener('click', (function (idx) {
            return function () {
              state.activeQuestionIdx = idx;
              renderAll();
              loadScratchForActiveQ();
              focusCurrentStepInput();
            };
          })(i));
          questionPillsRow.appendChild(pill);
        }

        const q = getActiveQ();
        if (!q) return;
        const qNum = state.activeQuestionIdx + 1;
        const isExamMode = state.activeModuleId === 'random_25';

        btnHintStep.style.display = isExamMode ? 'none' : '';
        btnCheckStep.style.display = isExamMode ? 'none' : '';
        btnShowSteps.style.display = isExamMode ? 'none' : '';

        const subHintEl = document.getElementById('question-sub-hint');
        if (subHintEl) {
          subHintEl.textContent = isExamMode
            ? '📝 Pure Test Mode (25-Q Exam): No step descriptions, tips, or guides are shown during the exam. Solve using your Notes/Scratchpad and enter your Final Answer on the right!'
            : 'Complete each guided step below. As each step is solved, the next step and arrow (↓) will appear!';
        }

        questionTopicBadge.textContent = 'Question ' + qNum + ' of ' + totalQ + '  •  ' + q.topic;
        questionMainPrompt.textContent = q.prompt;
        visualDiagramStage.style.display = isExamMode ? 'none' : '';
        visualDiagramStage.innerHTML = isExamMode ? '' : q.svgHtml;

        // Render Progressive Step-by-Step Ladder (hidden in 25-Q Pure Exam Mode!)
        stepsLadderMount.innerHTML = '';
        if (isExamMode) {
          const examNotice = document.createElement('div');
          examNotice.className = 'step-row-card';
          examNotice.style.background = '#f8fafc';
          examNotice.style.borderColor = '#cbd5e1';
          examNotice.innerHTML =
            '<div class="step-row-left">' +
              '<div class="step-num-circle" style="background:#6d28d9; color:#fff;">📝</div>' +
              '<span class="step-label-text" style="color:#334155;">Pure Exam Mode: Step-by-step guides and hints are hidden during this 25-question test. Once all 25 questions are completed, the full answers and step-by-step solutions will be revealed!</span>' +
            '</div>';
          stepsLadderMount.appendChild(examNotice);
        }
        for (let sIdx = 0; !isExamMode && sIdx < q.steps.length; sIdx++) {
          if (sIdx > q.currentStepIdx) break; // Only reveal up to the active step!

          if (sIdx > 0) {
            const arrowDiv = document.createElement('div');
            arrowDiv.className = 'step-arrow-connector';
            arrowDiv.textContent = '↓';
            stepsLadderMount.appendChild(arrowDiv);
          }

          const stepObj = q.steps[sIdx];
          const isDone = sIdx < q.currentStepIdx;
          const isCurr = sIdx === q.currentStepIdx;

          const rowCard = document.createElement('div');
          rowCard.className = 'step-row-card' + (isCurr ? ' active-step' : '') + (isDone ? ' completed-step' : '');

          const leftDiv = document.createElement('div');
          leftDiv.className = 'step-row-left';
          leftDiv.innerHTML =
            '<div class="step-num-circle">' + (isDone ? '✓' : (sIdx + 1)) + '</div>' +
            '<span class="step-label-text">' + escapeHtml(stepObj.label) + '</span>';

          const rightDiv = document.createElement('div');
          rightDiv.className = 'step-row-right';

          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'step-input-box' + (isDone ? ' locked' : '') + (q.wrongSteps[sIdx] ? ' wrong' : '');
          inp.value = isDone ? stepObj.expected : (q.stepInputs[sIdx] || '');
          inp.placeholder = isCurr ? 'Type step value...' : '';
          inp.readOnly = isDone;
          inp.dataset.sidx = String(sIdx);

          if (isCurr) {
            inp.addEventListener('input', function (e) {
              q.stepInputs[sIdx] = e.target.value;
              delete q.wrongSteps[sIdx];
              inp.classList.remove('wrong');
              // Auto-advance when exact match is typed
              if (normalizeAns(e.target.value) === normalizeAns(stepObj.expected)) {
                q.currentStepIdx++;
                state.stars += 1;
                state.streak += 1;
                sound.play('step');
                renderAll();
                if (q.currentStepIdx >= q.steps.length) {
                  finalAnswerInput.focus();
                } else {
                  focusCurrentStepInput();
                }
              }
            });

            inp.addEventListener('keydown', function (e) {
              if (e.key === 'Enter') {
                e.preventDefault();
                checkActiveStep();
              }
            });
          }

          rightDiv.appendChild(inp);
          if (stepObj.unit) {
            const uSpan = document.createElement('span');
            uSpan.className = 'step-unit-suffix';
            uSpan.textContent = stepObj.unit;
            rightDiv.appendChild(uSpan);
          }

          rowCard.appendChild(leftDiv);
          rowCard.appendChild(rightDiv);
          stepsLadderMount.appendChild(rowCard);
        }

        // Bottom Navigation
        btnPrevQuestion.disabled = state.activeQuestionIdx === 0;
        btnNextQuestion.textContent = state.activeQuestionIdx === totalQ - 1
          ? ('View ' + totalQ + '-Question Printout →')
          : ('Next Question (Q' + (qNum + 1) + ') →');
        questionBottomStatus.textContent = 'Question ' + qNum + ' of ' + totalQ + (q.isCompleted ? ' (Completed ✓)' : '');

        // Right Side Answer Box State
        const allStepsDone = isExamMode || (q.currentStepIdx >= q.steps.length);
        finalAnswerInput.value = q.finalAnswerInput || '';
        if (allStepsDone) {
          answerCard.classList.add('unlocked');
          answerStatusBadge.className = 'status-lock-badge ready';
          answerStatusBadge.textContent = q.isCompleted ? 'Answered ✓' : (isExamMode ? 'Exam Mode — Open' : 'Unlocked — Enter Answer!');
          answerHelperText.textContent = isExamMode
            ? 'Pure Test Mode: Enter your final answer below. Full answers and worked steps will be shown once all 25 questions are done:'
            : 'All steps complete! Enter your final answer below:';
          finalAnswerInput.disabled = false;
          btnSubmitAnswer.disabled = false;
          btnSubmitAnswer.textContent = isExamMode ? 'Submit Exam Answer' : 'Check Final Answer';
        } else {
          answerCard.classList.remove('unlocked');
          answerStatusBadge.className = 'status-lock-badge';
          answerStatusBadge.textContent = 'Finish Steps First';
          answerHelperText.textContent = 'Complete the guided steps on the left to unlock the final Answer box.';
          finalAnswerInput.disabled = true;
          btnSubmitAnswer.disabled = true;
          btnSubmitAnswer.textContent = 'Check Final Answer';
        }

        if (q.answerFeedbackType === 'correct') {
          answerFeedback.className = 'answer-feedback correct';
          answerFeedback.textContent = q.answerFeedbackMessage;
        } else if (q.answerFeedbackType === 'incorrect') {
          answerFeedback.className = 'answer-feedback incorrect';
          answerFeedback.textContent = q.answerFeedbackMessage;
        } else {
          answerFeedback.className = 'answer-feedback';
          answerFeedback.textContent = '';
        }

        problemNotesTextarea.value = q.notes || '';
        notesSaveIndicator.textContent = 'Saved for Question ' + qNum;
      }

      function normalizeAns(str) {
        return String(str || '').toLowerCase().replace(/\s+/g, '');
      }

      function focusCurrentStepInput() {
        const activeInp = stepsLadderMount.querySelector('input.step-input-box:not(.locked)');
        if (activeInp) {
          activeInp.focus();
        }
      }

      function checkActiveStep() {
        const q = getActiveQ();
        if (!q || q.currentStepIdx >= q.steps.length) return;
        const sIdx = q.currentStepIdx;
        const stepObj = q.steps[sIdx];
        const userVal = normalizeAns(q.stepInputs[sIdx]);
        if (userVal === normalizeAns(stepObj.expected)) {
          q.currentStepIdx++;
          state.stars += 1;
          state.streak += 1;
          sound.play('step');
          renderAll();
          if (q.currentStepIdx >= q.steps.length) {
            finalAnswerInput.focus();
          } else {
            focusCurrentStepInput();
          }
        } else {
          q.wrongSteps[sIdx] = true;
          state.streak = 0;
          sound.play('wrong');
          renderAll();
          focusCurrentStepInput();
        }
      }

      function checkFinalAnswer() {
        const q = getActiveQ();
        if (!q) return;
        const rawUser = (finalAnswerInput.value || '').trim();
        q.finalAnswerInput = rawUser;

        if (!rawUser) {
          q.answerFeedbackType = 'incorrect';
          q.answerFeedbackMessage = 'Please type your final answer in the Answer box first.';
          renderAll();
          return;
        }

        const normUser = normalizeAns(rawUser);
        const validSet = new Set([normalizeAns(q.finalAnswer)]);
        q.altAnswers.forEach(function (a) { validSet.add(normalizeAns(a)); });

        if (state.activeModuleId === 'random_25') {
          const isRight = validSet.has(normUser);
          if (!q.isCompleted && isRight) {
            state.stars += 5;
            state.streak += 1;
          }
          q.isCompleted = true;
          q.answerFeedbackType = 'correct';
          q.answerFeedbackMessage = '📝 Answer saved for Question ' + (state.activeQuestionIdx + 1) + '! Full worked steps and answers will be shown once all 25 questions are completed.';
          sound.play('step');
          renderAll();

          const totalQ = state.questions.length;
          if (getCompletedCount() === totalQ && !state.pdfAutoTriggered) {
            state.pdfAutoTriggered = true;
            setView('printout');
            generateAndDownloadPdfFile();
          } else {
            for (let nextI = 1; nextI <= totalQ; nextI++) {
              const cand = (state.activeQuestionIdx + nextI) % totalQ;
              if (!state.questions[cand].isCompleted) {
                state.activeQuestionIdx = cand;
                renderAll();
                loadScratchForActiveQ();
                finalAnswerInput.focus();
                break;
              }
            }
          }
          return;
        }

        if (validSet.has(normUser)) {
          if (!q.isCompleted) {
            state.stars += 5;
            state.streak += 1;
          }
          q.isCompleted = true;
          q.answerFeedbackType = 'correct';
          q.answerFeedbackMessage = '🌟 Correct! Final Answer: ' + q.finalAnswer;
          sound.play('correct');
          renderAll();

          if (getCompletedCount() === state.questions.length && !state.pdfAutoTriggered) {
            state.pdfAutoTriggered = true;
            setView('printout');
            generateAndDownloadPdfFile();
          }
        } else {
          state.streak = 0;
          q.answerFeedbackType = 'incorrect';
          q.answerFeedbackMessage = 'Not quite! Check your final step on the left (Expected: ' + q.finalAnswer + ').';
          sound.play('wrong');
          renderAll();
        }
      }

      // =========================================================================
      // TUTOR TABLE EDITOR
      // =========================================================================
      function renderTutorTable() {
        tutorQuestionsTbody.innerHTML = '';
        for (let i = 0; i < state.questions.length; i++) {
          const q = state.questions[i];
          const stepVals = q.steps.map(function (s) { return s.expected; }).join(' | ');
          const tr = document.createElement('tr');
          tr.innerHTML =
            '<td style="font-weight:800;">Q' + (i + 1) + '</td>' +
            '<td><input type="text" class="tutor-input tutor-topic-inp" value="' + escapeHtml(q.topic) + '" /></td>' +
            '<td><input type="text" class="tutor-input tutor-prompt-inp" value="' + escapeHtml(q.prompt) + '" /></td>' +
            '<td><input type="text" class="tutor-input tutor-steps-inp" value="' + escapeHtml(stepVals) + '" title="Separate step values with |" /></td>' +
            '<td><input type="text" class="tutor-input tutor-ans-inp" value="' + escapeHtml(q.finalAnswer) + '" /></td>';
          tutorQuestionsTbody.appendChild(tr);
        }
      }

      function saveTutorTableEdits() {
        const topicInps = tutorQuestionsTbody.querySelectorAll('.tutor-topic-inp');
        const promptInps = tutorQuestionsTbody.querySelectorAll('.tutor-prompt-inp');
        const stepsInps = tutorQuestionsTbody.querySelectorAll('.tutor-steps-inp');
        const ansInps = tutorQuestionsTbody.querySelectorAll('.tutor-ans-inp');

        for (let i = 0; i < state.questions.length; i++) {
          const q = state.questions[i];
          q.topic = topicInps[i].value.trim() || q.topic;
          q.prompt = promptInps[i].value.trim() || q.prompt;
          const parts = stepsInps[i].value.split('|').map(function (p) { return p.trim(); }).filter(Boolean);
          for (let s = 0; s < q.steps.length; s++) {
            if (parts[s] !== undefined) q.steps[s].expected = parts[s];
          }
          q.finalAnswer = ansInps[i].value.trim() || q.finalAnswer;
        }
      }

      // =========================================================================
      // ON-SCREEN PRINTOUT & PURE-JS MULTI-PAGE VECTOR PDF GENERATOR
      // =========================================================================
      function renderPrintoutCards() {
        const totalQ = state.questions.length;
        const completedCount = getCompletedCount();
        printoutHeading.textContent = "Year " + CURRENT_YEAR + " - NZ Mathematics Workbook ? " + state.activeModuleTitle + " Answer Key";
        printoutSubtitle.textContent =
          'Completed ' + completedCount + ' of ' + totalQ + ' Questions  •  Stars: ' + state.stars + ' ⭐';

        printoutGrid.innerHTML = '';
        for (let i = 0; i < totalQ; i++) {
          const q = state.questions[i];
          const card = document.createElement('div');
          card.className = 'printout-q-card';

          const stepsHtml = q.steps.map(function (st, idx) {
            return '<div style="font-size:0.8rem; color:#1e293b; margin-bottom:3px;"><strong>Step ' + (idx + 1) + ':</strong> ' + escapeHtml(st.label) + ' → <span style="color:#0369a1; font-weight:800;">' + escapeHtml(st.expected) + ' ' + escapeHtml(st.unit) + '</span></div>';
          }).join('');

          const studentAns = q.finalAnswerInput ? q.finalAnswerInput : (q.isCompleted ? q.finalAnswer : 'Not entered');
          card.innerHTML =
            '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:8px;">' +
              '<strong style="font-size:0.92rem; color:#0f172a;">Q' + (i + 1) + ': ' + escapeHtml(q.topic) + '</strong>' +
              '<span style="background:#dcfce7; color:#166534; font-weight:800; font-size:0.78rem; padding:2px 9px; border-radius:999px;">Ans: ' + escapeHtml(q.finalAnswer) + '</span>' +
            '</div>' +
            '<p style="font-size:0.84rem; font-weight:700; color:#334155; margin-bottom:8px;">' + escapeHtml(q.prompt) + '</p>' +
            '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; margin-bottom:8px;">' + stepsHtml + '</div>' +
            '<div style="font-size:0.8rem; color:#475569; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">' +
              '<span><strong>Student\'s Answer:</strong> ' + escapeHtml(studentAns) + '</span>' +
              '<span><strong>Notes:</strong> ' + escapeHtml(q.notes || 'None') + '</span>' +
            '</div>';

          printoutGrid.appendChild(card);
        }
      }

      function escapeHtml(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function pdfEscapeText(str) {
        return String(str || '')
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
      }

      function generateAndDownloadPdfFile() {
        const totalQ = state.questions.length;
        const questionsPerPage = 5;
        const numPages = Math.ceil(totalQ / questionsPerPage) || 1;
        const pageStreams = [];
        const completedCount = getCompletedCount();
        const dateStr = new Date().toLocaleDateString();

        for (let p = 0; p < numPages; p++) {
          let s = '';
          const startQ = p * questionsPerPage + 1;
          const endQ = Math.min((p + 1) * questionsPerPage, totalQ);

          // Top Page Header Box
          s += '0.91 0.96 0.99 rg 0.01 0.52 0.78 RG 1.2 w 30 772 535 46 re B\n';
          s += '0.06 0.09 0.16 rg\n';
          s += 'BT /F2 13 Tf 42 798 Td (' + pdfEscapeText("Year " + CURRENT_YEAR + " - NZ Mathematics Workbook - Answer Printout") + ') Tj ET\n';
          s += '0.30 0.38 0.48 rg\n';
          const subLine = 'Module: ' + state.activeModuleTitle + '  |  Completed: ' + completedCount + '/' + totalQ + '  |  Date: ' + dateStr + '  |  Page ' + (p + 1) + '/' + numPages + ' (Q' + startQ + '-Q' + endQ + ')';
          s += 'BT /F1 8.5 Tf 42 782 Td (' + pdfEscapeText(subLine.slice(0, 95)) + ') Tj ET\n';

          for (let localIdx = 0; localIdx < questionsPerPage; localIdx++) {
            const qIdx = p * questionsPerPage + localIdx;
            if (qIdx >= totalQ) break;
            const q = state.questions[qIdx];

            const cardTopY = 755 - localIdx * 142;
            const cardH = 130;
            const cardBottomY = cardTopY - cardH;

            s += '0.99 0.995 1 rg 0.78 0.85 0.92 RG 1 w 30 ' + cardBottomY + ' 535 ' + cardH + ' re B\n';
            s += '0.93 0.97 0.99 rg 30 ' + (cardTopY - 22) + ' 535 22 re f\n';

            s += '0.06 0.09 0.16 rg\n';
            s += 'BT /F2 9.5 Tf 40 ' + (cardTopY - 15) + ' Td (' + pdfEscapeText('Q' + (qIdx + 1) + ' [' + q.topic + ']') + ') Tj ET\n';

            s += '0.04 0.48 0.24 rg\n';
            s += 'BT /F2 9.5 Tf 410 ' + (cardTopY - 15) + ' Td (' + pdfEscapeText('Official Answer: ' + q.finalAnswer) + ') Tj ET\n';

            s += '0.12 0.18 0.28 rg\n';
            s += 'BT /F2 8.5 Tf 40 ' + (cardTopY - 36) + ' Td (' + pdfEscapeText('Question: ' + q.prompt.slice(0, 92)) + ') Tj ET\n';
            if (q.prompt.length > 92) {
              s += 'BT /F1 8.5 Tf 40 ' + (cardTopY - 47) + ' Td (' + pdfEscapeText(q.prompt.slice(92, 184)) + ') Tj ET\n';
            }

            let stepY = cardTopY - 62;
            for (let stIdx = 0; stIdx < q.steps.length; stIdx++) {
              const st = q.steps[stIdx];
              const stLine = '  ' + st.label + '  -->  ' + st.expected + (st.unit ? (' ' + st.unit) : '');
              s += 'BT /F1 8 Tf 44 ' + stepY + ' Td (' + pdfEscapeText(stLine.slice(0, 102)) + ') Tj ET\n';
              stepY -= 12;
            }

            const studentAns = q.finalAnswerInput ? q.finalAnswerInput : (q.isCompleted ? q.finalAnswer : 'Not entered');
            const bottomMeta = "Student's Answer: " + studentAns + '    |    Notes: ' + (q.notes || 'None').replace(/\r?\n/g, ' ');
            s += '0.28 0.35 0.45 rg\n';
            s += 'BT /F2 8 Tf 40 ' + (cardBottomY + 10) + ' Td (' + pdfEscapeText(bottomMeta.slice(0, 100)) + ') Tj ET\n';
          }

          pageStreams.push(s);
        }

        const objects = [];
        objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
        const firstPageObjId = 6;
        const firstStreamObjId = 6 + numPages;
        const kidsIds = [];
        for (let p = 0; p < numPages; p++) kidsIds.push((firstPageObjId + p) + ' 0 R');
        objects.push('2 0 obj\n<< /Type /Pages /Kids [' + kidsIds.join(' ') + '] /Count ' + numPages + ' >>\nendobj\n');
        objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
        objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
        objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n');

        for (let p = 0; p < numPages; p++) {
          objects.push(
            (firstPageObjId + p) + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
            '/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ' + (firstStreamObjId + p) + ' 0 R >>\nendobj\n'
          );
        }
        for (let p = 0; p < numPages; p++) {
          objects.push(
            (firstStreamObjId + p) + ' 0 obj\n<< /Length ' + pageStreams[p].length + ' >>\nstream\n' + pageStreams[p] + 'endstream\nendobj\n'
          );
        }

        let pdfContent = '%PDF-1.4\n';
        const offsets = [0];
        for (let i = 0; i < objects.length; i++) {
          offsets.push(pdfContent.length);
          pdfContent += objects[i];
        }
        const xrefStart = pdfContent.length;
        pdfContent += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
        for (let i = 1; i <= objects.length; i++) {
          pdfContent += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
        }
        pdfContent += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF';

        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Year' + CURRENT_YEAR + '_NZ_Mathematics_Workbook_Answers.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      }

      // =========================================================================
      // DIGITAL SCRATCHPAD CANVAS
      // =========================================================================
      let isDrawing = false;
      const scratchCtx = scratchCanvas.getContext('2d');
      scratchCtx.lineWidth = 2.3;
      scratchCtx.lineCap = 'round';
      scratchCtx.strokeStyle = '#0369a1';

      function getCanvasPt(e) {
        const rect = scratchCanvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (cx - rect.left) * (scratchCanvas.width / rect.width),
          y: (cy - rect.top) * (scratchCanvas.height / rect.height)
        };
      }

      scratchCanvas.addEventListener('mousedown', function (e) {
        isDrawing = true;
        const pt = getCanvasPt(e);
        scratchCtx.beginPath();
        scratchCtx.moveTo(pt.x, pt.y);
      });
      scratchCanvas.addEventListener('mousemove', function (e) {
        if (!isDrawing) return;
        const pt = getCanvasPt(e);
        scratchCtx.lineTo(pt.x, pt.y);
        scratchCtx.stroke();
      });
      window.addEventListener('mouseup', function () {
        if (isDrawing) {
          isDrawing = false;
          const q = getActiveQ();
          if (q) { q.drawingDataUrl = scratchCanvas.toDataURL(); scheduleProgressSave(); }
        }
      });
      scratchCanvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isDrawing = true;
        const pt = getCanvasPt(e);
        scratchCtx.beginPath();
        scratchCtx.moveTo(pt.x, pt.y);
      }, { passive: false });
      scratchCanvas.addEventListener('touchmove', function (e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pt = getCanvasPt(e);
        scratchCtx.lineTo(pt.x, pt.y);
        scratchCtx.stroke();
      }, { passive: false });
      scratchCanvas.addEventListener('touchend', function () {
        if (isDrawing) {
          isDrawing = false;
          const q = getActiveQ();
          if (q) { q.drawingDataUrl = scratchCanvas.toDataURL(); scheduleProgressSave(); }
        }
      });

      function loadScratchForActiveQ() {
        scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        const q = getActiveQ();
        if (q && q.drawingDataUrl) {
          const img = new Image();
          img.onload = function () { scratchCtx.drawImage(img, 0, 0); };
          img.src = q.drawingDataUrl;
        }
      }

      // =========================================================================
      // VIEW SWITCHING & EVENT LISTENERS
      // =========================================================================
      function setView(newView) {
        state.view = newView;
        const isCurr = newView === 'curriculum';

        curriculumPageView.classList.toggle('hidden', !isCurr);
        workbookActiveShell.classList.toggle('hidden', isCurr);

        btnTabStudent.classList.toggle('hidden', isCurr);
        btnTabTutor.classList.toggle('hidden', isCurr);
        btnTabPrintout.classList.toggle('hidden', isCurr);

        btnTabCurriculum.classList.toggle('active', newView === 'curriculum');
        btnTabStudent.classList.toggle('active', newView === 'student');
        btnTabTutor.classList.toggle('active', newView === 'tutor');
        btnTabPrintout.classList.toggle('active', newView === 'printout');

        if (isCurr) {
          renderCurriculumPage(state.activeStrandFilter);
          return;
        }

        tutorPanel.classList.toggle('hidden', newView !== 'tutor');
        workspaceLayout.classList.toggle('hidden', newView !== 'student');
        printoutSection.classList.toggle('hidden', newView !== 'printout');

        if (newView === 'tutor') {
          renderTutorTable();
        } else if (newView === 'printout') {
          renderPrintoutCards();
        } else {
          renderAll();
          loadScratchForActiveQ();
          focusCurrentStepInput();
        }
      }

      // Strand Page Navigation Buttons
      strandNavBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const strandPage = btn.getAttribute('data-strand-page');
          state.activeStrandFilter = strandPage;
          setView('curriculum');
        });
      });

      btnLaunchRandom25.addEventListener('click', function () {
        launchModuleWorkbook('random_25', 'student');
      });

      btnHeroRandom25.addEventListener('click', function () {
        launchModuleWorkbook('random_25', 'student');
      });

      brandHomeBtn.addEventListener('click', function () {
        state.activeStrandFilter = 'all';
        setView('curriculum');
      });

      btnTabCurriculum.addEventListener('click', function () {
        setView('curriculum');
      });
      btnTabStudent.addEventListener('click', function () {
        setView('student');
      });
      btnTabTutor.addEventListener('click', function () {
        setView('tutor');
      });
      btnTabPrintout.addEventListener('click', function () {
        setView('printout');
      });

      btnSoundToggle.addEventListener('click', function () {
        sound.enabled = !sound.enabled;
        btnSoundToggle.textContent = sound.enabled ? '🔊 Sound On' : '🔇 Muted';
      });

      btnRegenerateSet.addEventListener('click', function () {
        state.seedCounter += 3;
        launchModuleWorkbook(state.activeModuleId, state.view);
      });

      btnQuickPdf.addEventListener('click', function () {
        setView('printout');
        generateAndDownloadPdfFile();
      });

      btnBannerDownloadPdf.addEventListener('click', function () {
        generateAndDownloadPdfFile();
      });

      btnBannerViewPrintout.addEventListener('click', function () {
        setView('printout');
      });

      btnGeneratePdfFile.addEventListener('click', function () {
        generateAndDownloadPdfFile();
      });

      btnWindowPrint.addEventListener('click', function () {
        window.print();
      });

      btnBackToWorkbook.addEventListener('click', function () {
        setView('student');
      });

      // Tutor Actions
      btnTutorRandomize.addEventListener('click', function () {
        state.seedCounter += 5;
        launchModuleWorkbook(state.activeModuleId, 'tutor');
      });

      btnTutorAutocomplete.addEventListener('click', function () {
        saveTutorTableEdits();
        for (let i = 0; i < state.questions.length; i++) {
          const q = state.questions[i];
          q.currentStepIdx = q.steps.length;
          q.finalAnswerInput = q.finalAnswer;
          q.isCompleted = true;
          q.answerFeedbackType = 'correct';
          q.answerFeedbackMessage = 'Completed!';
        }
        renderAll();
        setView('printout');
        generateAndDownloadPdfFile();
      });

      btnTutorSave.addEventListener('click', function () {
        saveTutorTableEdits();
        setView('student');
      });

      // Student Workspace Buttons
      btnHintStep.addEventListener('click', function () {
        const q = getActiveQ();
        if (!q || q.currentStepIdx >= q.steps.length) return;
        const sIdx = q.currentStepIdx;
        q.stepInputs[sIdx] = q.steps[sIdx].expected;
        checkActiveStep();
      });

      btnCheckStep.addEventListener('click', function () {
        checkActiveStep();
      });

      btnShowSteps.addEventListener('click', function () {
        const q = getActiveQ();
        if (!q) return;
        q.currentStepIdx = q.steps.length;
        renderAll();
        finalAnswerInput.focus();
      });

      btnRestartQ.addEventListener('click', function () {
        const q = getActiveQ();
        if (!q) return;
        q.currentStepIdx = 0;
        q.stepInputs = {};
        q.wrongSteps = {};
        q.finalAnswerInput = '';
        q.answerFeedbackType = '';
        q.isCompleted = false;
        renderAll();
        focusCurrentStepInput();
      });

      btnPrevQuestion.addEventListener('click', function () {
        if (state.activeQuestionIdx > 0) {
          state.activeQuestionIdx--;
          renderAll();
          loadScratchForActiveQ();
          focusCurrentStepInput();
        }
      });

      btnNextQuestion.addEventListener('click', function () {
        if (state.activeQuestionIdx < state.questions.length - 1) {
          state.activeQuestionIdx++;
          renderAll();
          loadScratchForActiveQ();
          focusCurrentStepInput();
        } else {
          setView('printout');
        }
      });

      btnSubmitAnswer.addEventListener('click', function () {
        checkFinalAnswer();
      });

      finalAnswerInput.addEventListener('input', function (e) {
        const q = getActiveQ();
        if (q) { q.finalAnswerInput = e.target.value; scheduleProgressSave(); }
      });

      finalAnswerInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkFinalAnswer();
        }
      });

      btnTabTextNotes.addEventListener('click', function () {
        btnTabTextNotes.classList.add('active');
        btnTabDrawNotes.classList.remove('active');
        problemNotesTextarea.classList.remove('hidden');
        scratchCanvasWrap.classList.add('hidden');
      });

      btnTabDrawNotes.addEventListener('click', function () {
        btnTabDrawNotes.classList.add('active');
        btnTabTextNotes.classList.remove('active');
        scratchCanvasWrap.classList.remove('hidden');
        problemNotesTextarea.classList.add('hidden');
      });

      problemNotesTextarea.addEventListener('input', function () {
        const q = getActiveQ();
        if (!q) return;
        q.notes = problemNotesTextarea.value;
        scheduleProgressSave();
        notesSaveIndicator.textContent = 'Notes saved for Question ' + (state.activeQuestionIdx + 1) + ' ✓';
      });

      btnClearNotes.addEventListener('click', function () {
        const q = getActiveQ();
        if (!q) return;
        if (!scratchCanvasWrap.classList.contains('hidden')) {
          scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
          q.drawingDataUrl = '';
          scheduleProgressSave();
          notesSaveIndicator.textContent = 'Drawing cleared';
        } else {
          q.notes = '';
          scheduleProgressSave();
          problemNotesTextarea.value = '';
          notesSaveIndicator.textContent = 'Notes cleared';
        }
      });

      // Timer Loop
      setInterval(function () {
        if (state.view === 'student') {
          state.elapsedSeconds++;
          const m = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, '0');
          const s = String(state.elapsedSeconds % 60).padStart(2, '0');
          statTimer.textContent = '⏱️ ' + m + ':' + s;
        }
      }, 1000);

      // Restore the last local session or open the curriculum overview.
      if (restoreProgress()) {
        setView(state.view);
        if (state.view === 'student') loadScratchForActiveQ();
      } else {
        launchModuleWorkbook('num_types', 'curriculum');
      }
    })();
