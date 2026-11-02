    (function () {
      // =========================================================================
      // SOUND ENGINE (Web Audio API Chimes, 100% Offline, Safe with Mute)
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
              osc.frequency.setValueAtTime(523.25, now); // C5
              osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.09); // E5
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
              osc.frequency.setValueAtTime(220, now);
              osc.frequency.linearRampToValueAtTime(175, now + 0.15);
              gain.gain.setValueAtTime(0.08, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
              osc.start(now);
              osc.stop(now + 0.18);
            }
          } catch (e) {
            // Ignore audio errors
          }
        }
      };

      // =========================================================================
      // CURATED DEFAULT SETS & RANDOM PROBLEM GENERATOR
      // =========================================================================
      const CURATED_SETS = {
        div: [
          { op: 'div', numA: '100', numB: '7', extraDecimals: 0 },
          { op: 'div', numA: '84', numB: '4', extraDecimals: 0 },
          { op: 'div', numA: '735', numB: '5', extraDecimals: 0 },
          { op: 'div', numA: '432', numB: '12', extraDecimals: 0 },
          { op: 'div', numA: '948', numB: '6', extraDecimals: 0 },
          { op: 'div', numA: '125.5', numB: '5', extraDecimals: 0 },
          { op: 'div', numA: '625', numB: '25', extraDecimals: 0 },
          { op: 'div', numA: '1000', numB: '8', extraDecimals: 0 },
          { op: 'div', numA: '378', numB: '9', extraDecimals: 0 },
          { op: 'div', numA: '15', numB: '4', extraDecimals: 2 }
        ],
        add: [
          { op: 'add', numA: '47', numB: '38', extraDecimals: 0 },
          { op: 'add', numA: '156', numB: '239', extraDecimals: 0 },
          { op: 'add', numA: '485', numB: '376', extraDecimals: 0 },
          { op: 'add', numA: '1248', numB: '675', extraDecimals: 0 },
          { op: 'add', numA: '64.5', numB: '28.7', extraDecimals: 0 },
          { op: 'add', numA: '3904', numB: '2589', extraDecimals: 0 },
          { op: 'add', numA: '758', numB: '495', extraDecimals: 0 },
          { op: 'add', numA: '125.45', numB: '64.8', extraDecimals: 0 },
          { op: 'add', numA: '4829', numB: '3795', extraDecimals: 0 },
          { op: 'add', numA: '999', numB: '888', extraDecimals: 0 }
        ],
        sub: [
          { op: 'sub', numA: '82', numB: '47', extraDecimals: 0 },
          { op: 'sub', numA: '354', numB: '128', extraDecimals: 0 },
          { op: 'sub', numA: '605', numB: '248', extraDecimals: 0 },
          { op: 'sub', numA: '940', numB: '376', extraDecimals: 0 },
          { op: 'sub', numA: '85.4', numB: '37.8', extraDecimals: 0 },
          { op: 'sub', numA: '1520', numB: '685', extraDecimals: 0 },
          { op: 'sub', numA: '4002', numB: '1568', extraDecimals: 0 },
          { op: 'sub', numA: '145.6', numB: '58.35', extraDecimals: 0 },
          { op: 'sub', numA: '7315', numB: '2849', extraDecimals: 0 },
          { op: 'sub', numA: '5000', numB: '1746', extraDecimals: 0 }
        ],
        mul: [
          { op: 'mul', numA: '34', numB: '6', extraDecimals: 0 },
          { op: 'mul', numA: '78', numB: '5', extraDecimals: 0 },
          { op: 'mul', numA: '145', numB: '7', extraDecimals: 0 },
          { op: 'mul', numA: '46', numB: '12', extraDecimals: 0 },
          { op: 'mul', numA: '64', numB: '25', extraDecimals: 0 },
          { op: 'mul', numA: '12.5', numB: '4', extraDecimals: 0 },
          { op: 'mul', numA: '238', numB: '14', extraDecimals: 0 },
          { op: 'mul', numA: '309', numB: '8', extraDecimals: 0 },
          { op: 'mul', numA: '125', numB: '24', extraDecimals: 0 },
          { op: 'mul', numA: '45.2', numB: '15', extraDecimals: 0 }
        ]
      };

      function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      function generateSingleRandomProblem(opType, difficulty) {
        const diff = difficulty || 'standard';
        if (opType === 'add') {
          if (diff === 'starter') {
            return { op: 'add', numA: String(randInt(12, 89)), numB: String(randInt(11, 79)), extraDecimals: 0 };
          } else if (diff === 'challenge') {
            return { op: 'add', numA: String(randInt(1200, 48999)), numB: String(randInt(950, 39999)), extraDecimals: 0 };
          } else if (diff === 'decimals') {
            const a = (randInt(120, 4500) / 10).toFixed(1);
            const b = (randInt(85, 2900) / 10).toFixed(1);
            return { op: 'add', numA: a, numB: b, extraDecimals: 0 };
          }
          return { op: 'add', numA: String(randInt(115, 980)), numB: String(randInt(85, 890)), extraDecimals: 0 };
        }

        if (opType === 'sub') {
          if (diff === 'starter') {
            const b = randInt(11, 48);
            const a = b + randInt(14, 50);
            return { op: 'sub', numA: String(a), numB: String(b), extraDecimals: 0 };
          } else if (diff === 'challenge') {
            const b = randInt(850, 19500);
            const a = b + randInt(1250, 29500);
            return { op: 'sub', numA: String(a), numB: String(b), extraDecimals: 0 };
          } else if (diff === 'decimals') {
            const b = randInt(85, 950);
            const a = b + randInt(110, 1450);
            return { op: 'sub', numA: (a / 10).toFixed(1), numB: (b / 10).toFixed(1), extraDecimals: 0 };
          }
          const b = randInt(75, 480);
          const a = b + randInt(95, 510);
          return { op: 'sub', numA: String(a), numB: String(b), extraDecimals: 0 };
        }

        if (opType === 'mul') {
          if (diff === 'starter') {
            return { op: 'mul', numA: String(randInt(12, 49)), numB: String(randInt(2, 9)), extraDecimals: 0 };
          } else if (diff === 'challenge') {
            return { op: 'mul', numA: String(randInt(112, 895)), numB: String(randInt(12, 48)), extraDecimals: 0 };
          } else if (diff === 'decimals') {
            return { op: 'mul', numA: (randInt(115, 895) / 10).toFixed(1), numB: String(randInt(3, 16)), extraDecimals: 0 };
          }
          return { op: 'mul', numA: String(randInt(24, 185)), numB: String(randInt(3, 15)), extraDecimals: 0 };
        }

        // Default: 'div'
        if (diff === 'starter') {
          const d = randInt(2, 9);
          const a = d * randInt(11, 35) + randInt(0, d - 1);
          return { op: 'div', numA: String(a), numB: String(d), extraDecimals: 0 };
        } else if (diff === 'challenge') {
          const d = randInt(6, 25);
          const a = randInt(350, 8950);
          return { op: 'div', numA: String(a), numB: String(d), extraDecimals: 0 };
        } else if (diff === 'decimals') {
          const d = [2, 4, 5, 8][randInt(0, 3)];
          const a = (randInt(15, 395) * d) / 10;
          return { op: 'div', numA: String(a), numB: String(d), extraDecimals: 0 };
        }
        const d = randInt(3, 12);
        const a = randInt(65, 850);
        return { op: 'div', numA: String(a), numB: String(d), extraDecimals: 0 };
      }

      function generateProblemList(workbookOp, difficulty, orderMode) {
        if (workbookOp === 'random') {
          // 25 Mixed Questions from all 4 types!
          const opsCycle = ['add', 'sub', 'mul', 'div'];
          const list = [];
          // Include 100 ÷ 7 as one of the division questions if curated
          for (let i = 0; i < 25; i++) {
            const op = opsCycle[i % 4];
            if (orderMode === 'curated' && i < 16) {
              const sourceSet = CURATED_SETS[op];
              const item = sourceSet[Math.floor(i / 4) % sourceSet.length];
              list.push({ op: item.op, numA: item.numA, numB: item.numB, extraDecimals: item.extraDecimals });
            } else {
              list.push(generateSingleRandomProblem(op, difficulty));
            }
          }
          return list;
        }

        // 10 Questions for a specific operation ('add' | 'sub' | 'mul' | 'div')
        if (orderMode === 'curated' && difficulty === 'standard' && CURATED_SETS[workbookOp]) {
          return CURATED_SETS[workbookOp].map(function (item) {
            return { op: item.op, numA: item.numA, numB: item.numB, extraDecimals: item.extraDecimals };
          });
        }

        const list = [];
        for (let i = 0; i < 10; i++) {
          list.push(generateSingleRandomProblem(workbookOp, difficulty));
        }
        return list;
      }

      // =========================================================================
      // APPLICATION STATE
      // =========================================================================
      const state = {
        view: 'home',            // 'home' | 'child' | 'tutor' | 'printout'
        workbookOp: 'div',       // 'add' | 'sub' | 'mul' | 'div' | 'random'
        difficulty: 'standard',
        activeQuestionIdx: 0,
        questions: [],           // 10 items (or 25 items when workbookOp === 'random')
        pdfAutoTriggered: false,
        stars: 0,
        streak: 0,
        elapsedSeconds: 0,
        timerHandle: null,
        notesTab: 'text'         // 'text' | 'draw'
      };

      const PROGRESS_STORAGE_KEY = 'mathAcademyProgress:interactive';
      let progressSaveTimeout = null;

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
          Object.keys(saved).forEach(function (key) {
            if (key in state && key !== 'timerHandle') state[key] = saved[key];
          });
          return true;
        } catch (e) {
          return false;
        }
      }

      window.addEventListener('pagehide', saveProgress);

      function getOpSymbol(op) {
        if (op === 'add') return '+';
        if (op === 'sub') return '−';
        if (op === 'mul') return '×';
        return '÷';
      }

      function getOpName(op) {
        if (op === 'add') return 'Addition';
        if (op === 'sub') return 'Subtraction';
        if (op === 'mul') return 'Multiplication';
        if (op === 'div') return 'Long Division';
        return '25-Question Random Mix';
      }

      // =========================================================================
      // NUMBER FORMAT VALIDATION
      // =========================================================================
      function validateNumberFormat(rawStr, label, mustBePositive) {
        const trimmed = (rawStr || '').trim();
        if (!trimmed) {
          return { valid: false, error: 'Please enter a value for ' + label + '.' };
        }
        const regex = /^\d{1,5}(\.\d{1,5})?$/;
        if (!regex.test(trimmed)) {
          return {
            valid: false,
            error: label + ' must have up to 5 digits before the decimal point and up to 5 decimal places (e.g. 12345.67895).'
          };
        }
        const num = Number(trimmed);
        if (isNaN(num)) {
          return { valid: false, error: label + ' is not a valid number.' };
        }
        if (mustBePositive && num <= 0) {
          return { valid: false, error: label + ' must be greater than 0.' };
        }
        return { valid: true, value: trimmed, num: num };
      }

      // =========================================================================
      // ENGINE 1: LONG DIVISION COMPILER (100% Preserved)
      // =========================================================================
      function buildDivisionPlan(dividendStr, divisorStr, extraDecimals) {
        const divParts = divisorStr.split('.');
        const dvdParts = dividendStr.split('.');
        const divisorDecCount = divParts[1] ? divParts[1].length : 0;
        const dividendDecCount = dvdParts[1] ? dvdParts[1].length : 0;

        const shiftPlaces = divisorDecCount;
        const divisorIntStr = (divParts[0] + (divParts[1] || '')).replace(/^0+(?=\d)/, '');
        const divisorInt = parseInt(divisorIntStr, 10) || 1;

        let combinedDvdDigits = dvdParts[0] + (divParts.length > 1 || dvdParts.length > 1 ? (dvdParts[1] || '') : '');
        if (shiftPlaces > dividendDecCount) {
          combinedDvdDigits += '0'.repeat(shiftPlaces - dividendDecCount);
        }

        const intDigitsAfterShift = dvdParts[0].length + shiftPlaces;
        let intPartStr = combinedDvdDigits.slice(0, intDigitsAfterShift).replace(/^0+(?=\d)/, '');
        if (!intPartStr) intPartStr = '0';
        let fracPartStr = combinedDvdDigits.slice(intDigitsAfterShift);

        const totalFracLen = fracPartStr.length + extraDecimals;
        if (extraDecimals > 0) {
          fracPartStr = fracPartStr.padEnd(totalFracLen, '0');
        }

        const fullDigitsStr = intPartStr + fracPartStr;
        const digits = fullDigitsStr.split('').map(function (ch) { return parseInt(ch, 10); });
        const hasDecimalPoint = fracPartStr.length > 0;
        const decColIndex = hasDecimalPoint ? intPartStr.length : -1;

        const N = digits.length;
        const steps = [];
        const workRows = [];

        let curVal = 0;
        let curStartCol = 0;
        let hasStartedSubtraction = false;
        const quotientDigits = [];

        for (let col = 0; col < N; col++) {
          if (col === 0) {
            curVal = digits[0];
            curStartCol = 0;
          }

          const qDigit = Math.floor(curVal / divisorInt);
          quotientDigits.push(qDigit);

          if (!hasStartedSubtraction && qDigit === 0 && col < N - 1) {
            steps.push({
              type: 'quotient',
              col: col,
              expectedDigits: ['0'],
              prompt: 'Divide ' + curVal + ' by ' + divisorInt + '. Since ' + curVal + ' is smaller than ' + divisorInt + ', write 0 in the quotient above ' + digits[col] + '.'
            });
            curVal = curVal * 10 + digits[col + 1];
            continue;
          }

          if (hasStartedSubtraction && qDigit === 0 && col < N - 1) {
            steps.push({
              type: 'quotient',
              col: col,
              expectedDigits: ['0'],
              prompt: curVal + ' is smaller than ' + divisorInt + ', so write 0 in the quotient above ' + digits[col] + '.'
            });

            const lastRemRow = workRows[workRows.length - 1];
            const lastProdRow = workRows[workRows.length - 2];
            const nextDigit = String(digits[col + 1]);
            const bdStepIdx = steps.length;

            if (lastProdRow) {
              lastProdRow.extraArrows = lastProdRow.extraArrows || [];
              lastProdRow.extraArrows.push({ col: col + 1, appearAtStep: bdStepIdx });
            }
            lastRemRow.cells[col + 1] = {
              expected: nextDigit,
              stepIdx: bdStepIdx,
              cellIdx: 0
            };

            steps.push({
              type: 'bringdown',
              col: col + 1,
              expectedDigits: [nextDigit],
              prompt: 'Follow the arrow (↓) and bring down ' + nextDigit + ' next to ' + curVal + ' to make ' + (curVal * 10 + digits[col + 1]) + '.'
            });

            curVal = curVal * 10 + digits[col + 1];
            continue;
          }

          if (hasStartedSubtraction && qDigit === 0 && col === N - 1) {
            steps.push({
              type: 'quotient',
              col: col,
              expectedDigits: ['0'],
              prompt: curVal + ' is smaller than ' + divisorInt + ', so write 0 in the quotient above ' + digits[col] + '.'
            });
            break;
          }

          hasStartedSubtraction = true;

          steps.push({
            type: 'quotient',
            col: col,
            expectedDigits: [String(qDigit)],
            prompt: 'Divide ' + curVal + ' by ' + divisorInt + '. How many times does ' + divisorInt + ' go into ' + curVal + '? Write ' + qDigit + ' above ' + digits[col] + '.'
          });

          const productVal = qDigit * divisorInt;
          const productStr = String(productVal);
          const prodStartCol = col - productStr.length + 1;
          const prodStepIdx = steps.length;

          const prodCellsMap = {};
          for (let i = 0; i < productStr.length; i++) {
            const c = prodStartCol + i;
            prodCellsMap[c] = {
              expected: productStr[i],
              stepIdx: prodStepIdx,
              cellIdx: i
            };
          }

          const lineStartCol = Math.min(curStartCol, prodStartCol);
          const lineEndCol = col;

          const remVal = curVal - productVal;
          const remStr = String(remVal);
          const remStartCol = col - remStr.length + 1;
          const remStepIdx = prodStepIdx + 1;

          const hasNextDigit = col < N - 1;
          const bdStepIdx = hasNextDigit ? remStepIdx + 1 : null;

          workRows.push({
            type: 'product',
            cells: prodCellsMap,
            appearAtStep: prodStepIdx,
            lineCols: [lineStartCol, lineEndCol],
            lineAppearAtStep: remStepIdx,
            arrowCol: hasNextDigit ? col + 1 : null,
            arrowAppearAtStep: bdStepIdx,
            extraArrows: []
          });

          steps.push({
            type: 'product',
            col: col,
            expectedDigits: productStr.split(''),
            prompt: 'Multiply ' + qDigit + ' × ' + divisorInt + ' = ' + productVal + '. Write ' + productVal + ' underneath ' + curVal + '.'
          });

          const remCellsMap = {};
          for (let i = 0; i < remStr.length; i++) {
            const c = remStartCol + i;
            remCellsMap[c] = {
              expected: remStr[i],
              stepIdx: remStepIdx,
              cellIdx: i
            };
          }

          if (hasNextDigit) {
            const nextDigitStr = String(digits[col + 1]);
            remCellsMap[col + 1] = {
              expected: nextDigitStr,
              stepIdx: bdStepIdx,
              cellIdx: 0
            };
          }

          workRows.push({
            type: 'remainder',
            cells: remCellsMap,
            appearAtStep: remStepIdx
          });

          steps.push({
            type: 'subtract',
            col: col,
            expectedDigits: remStr.split(''),
            prompt: 'Subtract ' + curVal + ' − ' + productVal + ' = ' + remVal + '. Write ' + remVal + ' below the subtraction line.'
          });

          if (hasNextDigit) {
            const nextDigitStr = String(digits[col + 1]);
            const combinedNextStr = remVal === 0 ? nextDigitStr : String(remVal) + nextDigitStr;
            steps.push({
              type: 'bringdown',
              col: col + 1,
              expectedDigits: [nextDigitStr],
              prompt: 'Follow the arrow (↓) and bring down ' + nextDigitStr + ' next to ' + remVal + ' to make ' + combinedNextStr + '.'
            });

            curVal = remVal * 10 + digits[col + 1];
            curStartCol = remVal === 0 ? col + 1 : remStartCol;
          } else {
            curVal = remVal;
          }
        }

        let rawQuotientStr = '';
        for (let i = 0; i < quotientDigits.length; i++) {
          if (i === decColIndex) rawQuotientStr += '.';
          rawQuotientStr += String(quotientDigits[i]);
        }
        const cleanQuotientStr = rawQuotientStr.replace(/^0+(?=\d)/, '');
        const formattedAnswer = (curVal > 0 && decColIndex === -1)
          ? (cleanQuotientStr + ' R ' + curVal)
          : (curVal > 0 ? (cleanQuotientStr + ' (R ' + curVal + ')') : cleanQuotientStr);

        return {
          op: 'div',
          rawNumA: dividendStr,
          rawNumB: divisorStr,
          shiftPlaces: shiftPlaces,
          divisorInt: divisorInt,
          digits: digits,
          decColIndex: decColIndex,
          quotientDigits: quotientDigits,
          rawQuotientStr: rawQuotientStr,
          cleanQuotientStr: cleanQuotientStr,
          finalRemainder: curVal,
          formattedAnswer: formattedAnswer,
          steps: steps,
          workRows: workRows
        };
      }

      // =========================================================================
      // ENGINE 2: COLUMNAR ADDITION WITH CARRIES COMPILER
      // =========================================================================
      function buildAdditionPlan(numAStr, numBStr) {
        const partsA = numAStr.split('.');
        const partsB = numBStr.split('.');
        const decLen = Math.max((partsA[1] || '').length, (partsB[1] || '').length);
        const intLen = Math.max(partsA[0].length, partsB[0].length);

        const padIntA = partsA[0].padStart(intLen, ' ');
        const padIntB = partsB[0].padStart(intLen, ' ');
        const padFracA = decLen > 0 ? (partsA[1] || '').padEnd(decLen, '0') : '';
        const padFracB = decLen > 0 ? (partsB[1] || '').padEnd(decLen, '0') : '';

        // Extra leading column 0 reserved for potential overflow carry
        const totalCols = 1 + intLen + decLen;
        const decColIndex = decLen > 0 ? (1 + intLen) : -1;

        const rowADigits = (' ' + padIntA + padFracA).split('');
        const rowBDigits = (' ' + padIntB + padFracB).split('');

        const steps = [];
        const sumCells = {};
        const carryCells = {};

        let carry = 0;
        const answerDigitsArr = new Array(totalCols).fill('');

        for (let c = totalCols - 1; c >= 1; c--) {
          const dA = rowADigits[c] === ' ' ? 0 : parseInt(rowADigits[c], 10);
          const dB = rowBDigits[c] === ' ' ? 0 : parseInt(rowBDigits[c], 10);
          const colSum = dA + dB + carry;
          const onesDigit = String(colSum % 10);
          const nextCarry = Math.floor(colSum / 10);

          const stepIdx = steps.length;
          sumCells[c] = { expected: onesDigit, stepIdx: stepIdx, cellIdx: 0 };
          answerDigitsArr[c] = onesDigit;

          const carryNote = carry > 0 ? (' + carry ' + carry) : '';
          steps.push({
            type: 'add_col',
            col: c,
            expectedDigits: [onesDigit],
            prompt: 'Add column: ' + dA + ' + ' + dB + carryNote + ' = ' + colSum + '. Write ' + onesDigit + ' below the line.'
          });

          if (nextCarry > 0) {
            if (c > 1) {
              const carryStepIdx = steps.length;
              carryCells[c - 1] = { expected: String(nextCarry), stepIdx: carryStepIdx, cellIdx: 0 };
              steps.push({
                type: 'carry',
                col: c - 1,
                expectedDigits: [String(nextCarry)],
                prompt: 'Since the column sum was ' + colSum + ', write the carry ' + nextCarry + ' in the box at the top of the next column left.'
              });
            } else {
              // Final overflow into col 0
              const overStepIdx = steps.length;
              sumCells[0] = { expected: String(nextCarry), stepIdx: overStepIdx, cellIdx: 0 };
              answerDigitsArr[0] = String(nextCarry);
              steps.push({
                type: 'add_overflow',
                col: 0,
                expectedDigits: [String(nextCarry)],
                prompt: 'Write the final carried ' + nextCarry + ' in the leftmost answer box.'
              });
            }
          }
          carry = nextCarry;
        }

        let rawAns = '';
        for (let c = 0; c < totalCols; c++) {
          if (c === decColIndex) rawAns += '.';
          if (answerDigitsArr[c] !== '') rawAns += answerDigitsArr[c];
        }
        const cleanAns = rawAns.replace(/^0+(?=\d)/, '');

        return {
          op: 'add',
          rawNumA: numAStr,
          rawNumB: numBStr,
          shiftPlaces: 0,
          totalCols: totalCols,
          decColIndex: decColIndex,
          rowADigits: rowADigits,
          rowBDigits: rowBDigits,
          sumCells: sumCells,
          carryCells: carryCells,
          cleanQuotientStr: cleanAns,
          rawQuotientStr: rawAns,
          finalRemainder: 0,
          formattedAnswer: cleanAns,
          steps: steps
        };
      }

      // =========================================================================
      // ENGINE 3: COLUMNAR SUBTRACTION WITH BORROWING COMPILER
      // =========================================================================
      function buildSubtractionPlan(numAStr, numBStr) {
        let aStr = numAStr;
        let bStr = numBStr;
        if (Number(aStr) < Number(bStr)) {
          // Ensure top number >= bottom number for standard column subtraction
          const tmp = aStr;
          aStr = bStr;
          bStr = tmp;
        }

        const partsA = aStr.split('.');
        const partsB = bStr.split('.');
        const decLen = Math.max((partsA[1] || '').length, (partsB[1] || '').length);
        const intLen = Math.max(partsA[0].length, partsB[0].length);

        const padIntA = partsA[0].padStart(intLen, ' ');
        const padIntB = partsB[0].padStart(intLen, ' ');
        const padFracA = decLen > 0 ? (partsA[1] || '').padEnd(decLen, '0') : '';
        const padFracB = decLen > 0 ? (partsB[1] || '').padEnd(decLen, '0') : '';

        const totalCols = intLen + decLen;
        const decColIndex = decLen > 0 ? intLen : -1;

        const rowADigits = (padIntA + padFracA).split('');
        const rowBDigits = (padIntB + padFracB).split('');
        const workingA = rowADigits.map(function (ch) { return ch === ' ' ? 0 : parseInt(ch, 10); });

        const steps = [];
        const diffCells = {};
        const borrowBadges = {}; // col -> { text, appearAtStep }
        const crossedCols = {};  // col -> appearAtStep
        const answerDigitsArr = new Array(totalCols).fill('');

        for (let c = totalCols - 1; c >= 0; c--) {
          if (rowADigits[c] === ' ' && rowBDigits[c] === ' ') continue;
          let topVal = workingA[c];
          const botVal = rowBDigits[c] === ' ' ? 0 : parseInt(rowBDigits[c], 10);
          const stepIdx = steps.length;

          let borrowExplain = '';
          if (topVal < botVal) {
            // Find donor column to the left
            let donor = c - 1;
            while (donor >= 0 && workingA[donor] === 0) {
              donor--;
            }
            if (donor >= 0) {
              workingA[donor] -= 1;
              crossedCols[donor] = stepIdx;
              borrowBadges[donor] = { text: String(workingA[donor]), appearAtStep: stepIdx };
              for (let m = donor + 1; m < c; m++) {
                workingA[m] = 9;
                crossedCols[m] = stepIdx;
                borrowBadges[m] = { text: '9', appearAtStep: stepIdx };
              }
              topVal += 10;
              workingA[c] = topVal;
              crossedCols[c] = stepIdx;
              borrowBadges[c] = { text: String(topVal), appearAtStep: stepIdx };
              borrowExplain = ' (After borrowing 1 ten from the left, ' + rowADigits[c] + ' becomes ' + topVal + ')';
            }
          }

          const diffVal = topVal - botVal;
          const diffChar = String(diffVal);
          diffCells[c] = { expected: diffChar, stepIdx: stepIdx, cellIdx: 0 };
          answerDigitsArr[c] = diffChar;

          steps.push({
            type: 'sub_col',
            col: c,
            expectedDigits: [diffChar],
            prompt: 'Subtract column: ' + topVal + ' − ' + botVal + ' = ' + diffVal + borrowExplain + '. Write ' + diffChar + ' below the line.'
          });
        }

        let rawAns = '';
        for (let c = 0; c < totalCols; c++) {
          if (c === decColIndex) rawAns += '.';
          if (answerDigitsArr[c] !== '') rawAns += answerDigitsArr[c];
        }
        let cleanAns = rawAns.replace(/^0+(?=\d)/, '');
        if (cleanAns.startsWith('.')) cleanAns = '0' + cleanAns;

        return {
          op: 'sub',
          rawNumA: aStr,
          rawNumB: bStr,
          shiftPlaces: 0,
          totalCols: totalCols,
          decColIndex: decColIndex,
          rowADigits: rowADigits,
          rowBDigits: rowBDigits,
          diffCells: diffCells,
          borrowBadges: borrowBadges,
          crossedCols: crossedCols,
          cleanQuotientStr: cleanAns,
          rawQuotientStr: rawAns,
          finalRemainder: 0,
          formattedAnswer: cleanAns,
          steps: steps
        };
      }

      // =========================================================================
      // ENGINE 4: LONG COLUMNAR MULTIPLICATION COMPILER
      // =========================================================================
      function buildMultiplicationPlan(numAStr, numBStr) {
        const partsA = numAStr.split('.');
        const partsB = numBStr.split('.');
        const decA = (partsA[1] || '').length;
        const decB = (partsB[1] || '').length;
        const totalDecPlaces = decA + decB;

        const intStrA = (partsA[0] + (partsA[1] || '')).replace(/^0+(?=\d)/, '') || '0';
        const intStrB = (partsB[0] + (partsB[1] || '')).replace(/^0+(?=\d)/, '') || '0';

        const bigA = BigInt(intStrA);
        const bigB = BigInt(intStrB);
        const totalProdStr = (bigA * bigB).toString();

        // Format final answer with decimal point if totalDecPlaces > 0
        let formattedAns = totalProdStr;
        if (totalDecPlaces > 0) {
          const padded = totalProdStr.padStart(totalDecPlaces + 1, '0');
          const splitPos = padded.length - totalDecPlaces;
          formattedAns = padded.slice(0, splitPos) + '.' + padded.slice(splitPos);
          formattedAns = formattedAns.replace(/\.?0+$/, '');
        }

        const totalCols = Math.max(intStrA.length, intStrB.length, totalProdStr.length) + 1;
        const rowADigits = intStrA.padStart(totalCols, ' ').split('');
        const rowBDigits = intStrB.padStart(totalCols, ' ').split('');

        const steps = [];
        const partialRows = [];
        const bDigits = intStrB.split('').map(function (ch) { return parseInt(ch, 10); });

        if (bDigits.length === 1) {
          // Single-row right-to-left digit multiplication
          const prodPadded = totalProdStr.padStart(totalCols, ' ');
          const cellsMap = {};
          let carry = 0;
          const multB = bDigits[0];

          for (let c = totalCols - 1; c >= totalCols - totalProdStr.length; c--) {
            const idxInA = c - (totalCols - intStrA.length);
            const dA = idxInA >= 0 ? parseInt(intStrA[idxInA], 10) : 0;
            const val = dA * multB + carry;
            const expectedChar = prodPadded[c];
            const stepIdx = steps.length;

            cellsMap[c] = { expected: expectedChar, stepIdx: stepIdx, cellIdx: 0 };
            if (idxInA >= 0) {
              const carryNote = carry > 0 ? (' + carry ' + carry) : '';
              steps.push({
                type: 'mul_digit',
                col: c,
                expectedDigits: [expectedChar],
                prompt: 'Multiply ' + dA + ' × ' + multB + carryNote + ' = ' + val + '. Write ' + expectedChar + ' in the product row.'
              });
              carry = Math.floor(val / 10);
            } else {
              steps.push({
                type: 'mul_overflow',
                col: c,
                expectedDigits: [expectedChar],
                prompt: 'Write the carried ' + expectedChar + ' in the leftmost product column.'
              });
            }
          }

          partialRows.push({
            label: 'product',
            appearAtStep: 0,
            showBottomLine: false,
            cells: cellsMap
          });
        } else {
          // Multi-digit multiplier: Partial Product rows + Final Sum row
          for (let p = 0; p < bDigits.length; p++) {
            const bIdx = bDigits.length - 1 - p;
            const dB = bDigits[bIdx];
            const partialValStr = (bigA * BigInt(dB)).toString() + '0'.repeat(p);
            const startCol = totalCols - partialValStr.length;
            const stepIdx = steps.length;

            const cellsMap = {};
            for (let i = 0; i < partialValStr.length; i++) {
              cellsMap[startCol + i] = {
                expected: partialValStr[i],
                stepIdx: stepIdx,
                cellIdx: i
              };
            }

            const placeName = p === 0 ? 'ones' : (p === 1 ? 'tens (shifted 1 place with 0)' : ('10^' + p + ' place (shifted with ' + p + ' zeros)'));
            partialRows.push({
              label: 'partial',
              appearAtStep: stepIdx,
              showBottomLine: p === bDigits.length - 1,
              lineAppearAtStep: stepIdx + 1,
              cells: cellsMap
            });

            steps.push({
              type: 'partial_product',
              col: startCol,
              expectedDigits: partialValStr.split(''),
              prompt: 'Partial Product ' + (p + 1) + ': Multiply ' + intStrA + ' × ' + dB + ' in the ' + placeName + ' = ' + partialValStr + '.'
            });
          }

          // Final Sum Row below the partial products
          const sumStepIdx = steps.length;
          const sumStartCol = totalCols - totalProdStr.length;
          const sumCellsMap = {};
          for (let i = 0; i < totalProdStr.length; i++) {
            sumCellsMap[sumStartCol + i] = {
              expected: totalProdStr[i],
              stepIdx: sumStepIdx,
              cellIdx: i
            };
          }

          partialRows.push({
            label: 'final_sum',
            appearAtStep: sumStepIdx,
            showBottomLine: false,
            cells: sumCellsMap
          });

          steps.push({
            type: 'mul_sum',
            col: sumStartCol,
            expectedDigits: totalProdStr.split(''),
            prompt: 'Add the partial products together to get ' + totalProdStr + '.'
          });
        }

        return {
          op: 'mul',
          rawNumA: numAStr,
          rawNumB: numBStr,
          shiftPlaces: 0,
          totalCols: totalCols,
          totalDecPlaces: totalDecPlaces,
          rowADigits: rowADigits,
          rowBDigits: rowBDigits,
          partialRows: partialRows,
          cleanQuotientStr: formattedAns,
          rawQuotientStr: totalProdStr,
          finalRemainder: 0,
          formattedAnswer: formattedAns,
          steps: steps
        };
      }

      // =========================================================================
      // UNIFIED QUESTION COMPILER
      // =========================================================================
      function buildPlanForQuestion(op, numAStr, numBStr, extraDecimals) {
        if (op === 'add') return buildAdditionPlan(numAStr, numBStr);
        if (op === 'sub') return buildSubtractionPlan(numAStr, numBStr);
        if (op === 'mul') return buildMultiplicationPlan(numAStr, numBStr);
        return buildDivisionPlan(numAStr, numBStr, extraDecimals);
      }

      function createQuestionObject(idx, op, numAStr, numBStr, extraDecimals) {
        const plan = buildPlanForQuestion(op, numAStr, numBStr, extraDecimals);
        return {
          index: idx,
          op: op,
          rawDividend: plan.rawNumA,
          rawDivisor: plan.rawNumB,
          extraDecimals: extraDecimals || 0,
          plan: plan,
          currentStepIdx: 0,
          stepInputs: {},
          wrongCells: {},
          finalAnswerInput: '',
          answerFeedbackType: '',
          answerFeedbackMessage: '',
          isCompleted: false,
          notes: '',
          drawingDataUrl: ''
        };
      }

      function initWorkbookQuestions(workbookOp, difficulty, orderMode, targetView) {
        state.workbookOp = workbookOp;
        state.difficulty = difficulty || 'standard';
        const list = generateProblemList(workbookOp, state.difficulty, orderMode || 'curated');

        state.questions = [];
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          state.questions.push(
            createQuestionObject(i, item.op, String(item.numA), String(item.numB), parseInt(item.extraDecimals, 10) || 0)
          );
        }
        state.activeQuestionIdx = 0;
        state.pdfAutoTriggered = false;
        state.elapsedSeconds = 0;
        startTimer();
        setView(targetView || 'child');
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
      // DOM ELEMENTS
      // =========================================================================
      const brandHomeBadge = document.getElementById('brand-home-badge');
      const appMainTitle = document.getElementById('app-main-title');
      const appSubtitle = document.getElementById('app-subtitle');

      const statStars = document.getElementById('stat-stars');
      const statStreak = document.getElementById('stat-streak');
      const statTimer = document.getElementById('stat-timer');
      const btnSoundToggle = document.getElementById('btn-sound-toggle');

      const btnHomeView = document.getElementById('btn-home-view');
      const btnChildMode = document.getElementById('btn-child-mode');
      const btnTutorMode = document.getElementById('btn-tutor-mode');
      const btnPrintoutMode = document.getElementById('btn-printout-mode');

      const frontPageView = document.getElementById('front-page-view');
      const frontDifficultySelect = document.getElementById('front-difficulty-select');
      const frontQuestionOrder = document.getElementById('front-question-order');

      const workbookActiveShell = document.getElementById('workbook-active-shell');
      const workbookCategoryLabel = document.getElementById('workbook-category-label');
      const progressFill = document.getElementById('progress-fill');
      const progressCountBadge = document.getElementById('progress-count-badge');
      const questionPillsRow = document.getElementById('question-pills-row');
      const btnRegenerateRandom = document.getElementById('btn-regenerate-random');
      const btnQuickPdf = document.getElementById('btn-quick-pdf');

      const completionPdfBanner = document.getElementById('completion-pdf-banner');
      const completionBannerTitle = document.getElementById('completion-banner-title');
      const completionBannerDesc = document.getElementById('completion-banner-desc');
      const btnBannerDownloadPdf = document.getElementById('btn-banner-download-pdf');
      const btnBannerViewPrintout = document.getElementById('btn-banner-view-printout');

      const tutorPanel = document.getElementById('tutor-panel');
      const tutorPanelTitle = document.getElementById('tutor-panel-title');
      const tutorError = document.getElementById('tutor-error');
      const tutorQuestionsTbody = document.getElementById('tutor-questions-tbody');
      const btnSetStarter = document.getElementById('btn-set-starter');
      const btnSetStandard = document.getElementById('btn-set-standard');
      const btnSetChallenge = document.getElementById('btn-set-challenge');
      const btnSetDecimals = document.getElementById('btn-set-decimals');
      const btnTutorFillAll = document.getElementById('btn-tutor-fill-all');
      const btnTutorResetAll = document.getElementById('btn-tutor-reset-all');
      const btnApplyAllQuestions = document.getElementById('btn-apply-all-questions');

      const workspaceLayout = document.getElementById('workspace-layout');
      const currentProblemBadge = document.getElementById('current-problem-badge');
      const decimalShiftBadge = document.getElementById('decimal-shift-badge');
      const btnToggleHelper = document.getElementById('btn-toggle-helper');
      const helperDrawer = document.getElementById('helper-drawer');
      const helperDrawerTitle = document.getElementById('helper-drawer-title');
      const helperFactsGrid = document.getElementById('helper-facts-grid');
      const btnHintStep = document.getElementById('btn-hint-step');
      const btnCheckStep = document.getElementById('btn-check-step');
      const btnPreviewSolution = document.getElementById('btn-preview-solution');
      const btnResetProblem = document.getElementById('btn-reset-problem');

      const stepBanner = document.getElementById('step-banner');
      const stepInstruction = document.getElementById('step-instruction');
      const stepCounterPill = document.getElementById('step-counter-pill');
      const divisionGridMount = document.getElementById('division-grid-mount');

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
      const btnClearNotes = document.getElementById('btn-clear-notes');
      const notesSaveIndicator = document.getElementById('notes-save-indicator');

      const printoutSection = document.getElementById('printout-section');
      const printoutMainHeading = document.getElementById('printout-main-heading');
      const printoutSubtitle = document.getElementById('printout-subtitle');
      const printoutGrid = document.getElementById('printout-grid');
      const btnGeneratePdfFile = document.getElementById('btn-generate-pdf-file');
      const btnWindowPrint = document.getElementById('btn-window-print');
      const btnBackToWorkbook = document.getElementById('btn-back-to-workbook');

      // =========================================================================
      // TIMER & GAMIFICATION STATS
      // =========================================================================
      function formatSeconds(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return m + ':' + s;
      }

      function startTimer() {
        if (state.timerHandle) clearInterval(state.timerHandle);
        state.timerHandle = setInterval(function () {
          if (state.view === 'child') {
            state.elapsedSeconds++;
            statTimer.textContent = '⏱️ ' + formatSeconds(state.elapsedSeconds);
          }
        }, 1000);
      }

      function updateStatsBar() {
        statStars.textContent = '⭐ ' + state.stars + ' Stars';
        statStreak.textContent = '🔥 ' + state.streak + ' Streak';
        statTimer.textContent = '⏱️ ' + formatSeconds(state.elapsedSeconds);
      }

      // =========================================================================
      // DIGITAL SCRATCHPAD CANVAS (MOUSE & TOUCH DRAWING)
      // =========================================================================
      let isDrawing = false;
      const scratchCtx = scratchCanvas.getContext('2d');
      scratchCtx.lineWidth = 2.4;
      scratchCtx.lineCap = 'round';
      scratchCtx.strokeStyle = '#1e3a8a';

      function getCanvasCoords(e) {
        const rect = scratchCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = scratchCanvas.width / rect.width;
        const scaleY = scratchCanvas.height / rect.height;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      }

      scratchCanvas.addEventListener('mousedown', function (e) {
        isDrawing = true;
        const pt = getCanvasCoords(e);
        scratchCtx.beginPath();
        scratchCtx.moveTo(pt.x, pt.y);
      });

      scratchCanvas.addEventListener('mousemove', function (e) {
        if (!isDrawing) return;
        const pt = getCanvasCoords(e);
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
        const pt = getCanvasCoords(e);
        scratchCtx.beginPath();
        scratchCtx.moveTo(pt.x, pt.y);
      }, { passive: false });

      scratchCanvas.addEventListener('touchmove', function (e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pt = getCanvasCoords(e);
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

      function loadScratchDrawingForActiveQ() {
        scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        const q = getActiveQ();
        if (q && q.drawingDataUrl) {
          const img = new Image();
          img.onload = function () {
            scratchCtx.drawImage(img, 0, 0);
          };
          img.src = q.drawingDataUrl;
        }
      }

      // =========================================================================
      // RENDER NAVIGATION PILLS & PROGRESS BAR
      // =========================================================================
      function renderProgressAndPills() {
        const totalQ = state.questions.length;
        const completedCount = getCompletedCount();
        const pct = totalQ > 0 ? Math.round((completedCount / totalQ) * 100) : 0;

        workbookCategoryLabel.textContent = getOpName(state.workbookOp) + ' (' + totalQ + ' Questions):';
        progressFill.style.width = pct + '%';
        progressCountBadge.textContent = completedCount + ' / ' + totalQ + ' Completed';

        if (completedCount === totalQ && totalQ > 0) {
          progressCountBadge.classList.add('all-done');
          completionBannerTitle.textContent = '🎉 Congratulations! All ' + totalQ + ' Questions Are Complete!';
          completionBannerDesc.textContent = 'Your ' + totalQ + '-question worked solution sheet and PDF printout with answers are ready.';
          completionPdfBanner.classList.add('visible');
        } else {
          progressCountBadge.classList.remove('all-done');
          completionPdfBanner.classList.remove('visible');
        }

        questionPillsRow.classList.toggle('grid-25', totalQ > 10);
        questionPillsRow.innerHTML = '';

        for (let i = 0; i < totalQ; i++) {
          const q = state.questions[i];
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'q-pill-btn';
          if (i === state.activeQuestionIdx) btn.classList.add('active');
          if (q.isCompleted) btn.classList.add('completed');

          const statusIcon = q.isCompleted ? '✓ ' : '';
          const sym = getOpSymbol(q.op);
          btn.innerHTML =
            '<span class="q-pill-num">' + statusIcon + 'Q' + (i + 1) + '</span>' +
            '<span class="q-pill-sub">' + q.rawDividend + ' ' + sym + ' ' + q.rawDivisor + '</span>';

          btn.addEventListener('click', (function (idx) {
            return function () {
              switchToQuestion(idx);
            };
          })(i));

          questionPillsRow.appendChild(btn);
        }
      }

      function switchToQuestion(idx) {
        if (idx < 0 || idx >= state.questions.length) return;
        state.activeQuestionIdx = idx;
        if (state.view === 'printout') {
          setView('child');
        } else {
          renderAll();
          loadScratchDrawingForActiveQ();
          focusActiveInput();
        }
      }

      // =========================================================================
      // RENDER TUTOR SETUP TABLE (10 OR 25 QUESTIONS)
      // =========================================================================
      function renderTutorTable() {
        const totalQ = state.questions.length;
        tutorPanelTitle.textContent = '🎓 Tutor ' + totalQ + '-Question Workbook Setup (' + getOpName(state.workbookOp) + ')';
        tutorQuestionsTbody.innerHTML = '';

        for (let i = 0; i < totalQ; i++) {
          const q = state.questions[i];
          const tr = document.createElement('tr');
          if (i === state.activeQuestionIdx) {
            tr.classList.add('active-tutor-row');
          }

          tr.innerHTML =
            '<td style="font-weight: 800; color: #0f172a;">Q' + (i + 1) + '</td>' +
            '<td>' +
              '<select class="tutor-select tutor-op-select" data-qidx="' + i + '">' +
                '<option value="add"' + (q.op === 'add' ? ' selected' : '') + '>+ Addition</option>' +
                '<option value="sub"' + (q.op === 'sub' ? ' selected' : '') + '>− Subtraction</option>' +
                '<option value="mul"' + (q.op === 'mul' ? ' selected' : '') + '>× Multiplication</option>' +
                '<option value="div"' + (q.op === 'div' ? ' selected' : '') + '>÷ Division</option>' +
              '</select>' +
            '</td>' +
            '<td><input type="text" class="tutor-input tutor-dvd-input" data-qidx="' + i + '" value="' + q.rawDividend + '" inputmode="decimal" /></td>' +
            '<td><input type="text" class="tutor-input tutor-div-input" data-qidx="' + i + '" value="' + q.rawDivisor + '" inputmode="decimal" /></td>' +
            '<td>' +
              '<select class="tutor-select tutor-ext-select" data-qidx="' + i + '"' + (q.op !== 'div' ? ' disabled' : '') + '>' +
                '<option value="0"' + (q.extraDecimals === 0 ? ' selected' : '') + '>0 (Stop at R)</option>' +
                '<option value="1"' + (q.extraDecimals === 1 ? ' selected' : '') + '>+1 Dec Place</option>' +
                '<option value="2"' + (q.extraDecimals === 2 ? ' selected' : '') + '>+2 Dec Places</option>' +
                '<option value="3"' + (q.extraDecimals === 3 ? ' selected' : '') + '>+3 Dec Places</option>' +
                '<option value="4"' + (q.extraDecimals === 4 ? ' selected' : '') + '>+4 Dec Places</option>' +
                '<option value="5"' + (q.extraDecimals === 5 ? ' selected' : '') + '>+5 Dec Places</option>' +
              '</select>' +
            '</td>' +
            '<td style="font-weight: 700; color: #0369a1;">' + q.plan.formattedAnswer + '</td>';

          tutorQuestionsTbody.appendChild(tr);
        }

        // Enable/disable Extra Decimals dropdown when Operation dropdown changes
        const opSelects = tutorQuestionsTbody.querySelectorAll('.tutor-op-select');
        const extSelects = tutorQuestionsTbody.querySelectorAll('.tutor-ext-select');
        opSelects.forEach(function (sel, idx) {
          sel.addEventListener('change', function () {
            extSelects[idx].disabled = sel.value !== 'div';
          });
        });
      }

      function applyTutorTableChanges() {
        const opSelects = tutorQuestionsTbody.querySelectorAll('.tutor-op-select');
        const dvdInputs = tutorQuestionsTbody.querySelectorAll('.tutor-dvd-input');
        const divInputs = tutorQuestionsTbody.querySelectorAll('.tutor-div-input');
        const extSelects = tutorQuestionsTbody.querySelectorAll('.tutor-ext-select');

        const totalQ = state.questions.length;
        const updatedConfigs = [];

        for (let i = 0; i < totalQ; i++) {
          const opVal = opSelects[i].value;
          const dvdVal = dvdInputs[i].value;
          const divVal = divInputs[i].value;
          const extVal = parseInt(extSelects[i].value, 10) || 0;

          const vDvd = validateNumberFormat(dvdVal, 'Question ' + (i + 1) + ' First Number', false);
          if (!vDvd.valid) {
            tutorError.textContent = vDvd.error;
            tutorError.style.display = 'block';
            return false;
          }
          const vDiv = validateNumberFormat(divVal, 'Question ' + (i + 1) + ' Second Number', opVal === 'div');
          if (!vDiv.valid) {
            tutorError.textContent = vDiv.error;
            tutorError.style.display = 'block';
            return false;
          }
          updatedConfigs.push({ op: opVal, dividend: vDvd.value, divisor: vDiv.value, extraDecimals: extVal });
        }

        tutorError.style.display = 'none';
        tutorError.textContent = '';

        for (let i = 0; i < totalQ; i++) {
          const cfg = updatedConfigs[i];
          const existing = state.questions[i];
          if (
            existing.op !== cfg.op ||
            existing.rawDividend !== cfg.dividend ||
            existing.rawDivisor !== cfg.divisor ||
            existing.extraDecimals !== cfg.extraDecimals
          ) {
            state.questions[i] = createQuestionObject(i, cfg.op, cfg.dividend, cfg.divisor, cfg.extraDecimals);
          }
        }
        renderTutorTable();
        renderAll();
        return true;
      }

      // =========================================================================
      // RENDER MATH HELPER FACTS DRAWER
      // =========================================================================
      function renderHelperDrawer(q) {
        if (!q || !q.plan) return;
        helperFactsGrid.innerHTML = '';
        const op = q.op;

        if (op === 'div' || op === 'mul') {
          const baseNum = op === 'div' ? q.plan.divisorInt : (parseInt(q.rawDivisor.replace('.', ''), 10) || 5);
          const displayBase = baseNum > 99 ? (baseNum % 10 || 5) : baseNum;
          helperDrawerTitle.textContent = '🧮 Multiplication Facts for ' + displayBase;
          for (let m = 1; m <= 9; m++) {
            const chip = document.createElement('span');
            chip.className = 'helper-fact-chip';
            chip.textContent = displayBase + ' × ' + m + ' = ' + (displayBase * m);
            helperFactsGrid.appendChild(chip);
          }
        } else if (op === 'add') {
          helperDrawerTitle.textContent = '🧮 Column Addition Reminder';
          const tips = [
            '1. Always add from rightmost column to leftmost column.',
            '2. If a column adds up to 10 or more, write the ones digit and carry the tens digit to the top of the next column left!'
          ];
          tips.forEach(function (t) {
            const chip = document.createElement('span');
            chip.className = 'helper-fact-chip';
            chip.textContent = t;
            helperFactsGrid.appendChild(chip);
          });
        } else if (op === 'sub') {
          helperDrawerTitle.textContent = '🧮 Column Subtraction & Borrowing Reminder';
          const tips = [
            '1. Subtract from rightmost column to leftmost column.',
            '2. When the top digit is smaller than the bottom digit, borrow 1 ten (+10) from the column to the left!'
          ];
          tips.forEach(function (t) {
            const chip = document.createElement('span');
            chip.className = 'helper-fact-chip';
            chip.textContent = t;
            helperFactsGrid.appendChild(chip);
          });
        }
      }

      // =========================================================================
      // RENDER ACTIVE QUESTION WORKSPACE & GRID (ALL 4 OPERATIONS)
      // =========================================================================
      function renderAll() {
        scheduleProgressSave();
        updateStatsBar();
        renderProgressAndPills();

        const q = getActiveQ();
        if (!q || !q.plan) return;
        const plan = q.plan;
        const totalQ = state.questions.length;
        const qNum = state.activeQuestionIdx + 1;
        const sym = getOpSymbol(q.op);

        currentProblemBadge.textContent = 'Question ' + qNum + ' of ' + totalQ + ':  ' + plan.rawNumA + ' ' + sym + ' ' + plan.rawNumB;
        if (q.op === 'div' && plan.shiftPlaces > 0) {
          const factor = Math.pow(10, plan.shiftPlaces);
          decimalShiftBadge.style.display = 'inline-block';
          decimalShiftBadge.textContent = 'Decimal shifted (×' + factor + ') → ' + plan.digits.join('') + ' ÷ ' + plan.divisorInt;
        } else {
          decimalShiftBadge.style.display = 'none';
        }

        const isExamMode = state.workbookOp === 'random';
        btnToggleHelper.style.display = isExamMode ? 'none' : '';
        btnHintStep.style.display = isExamMode ? 'none' : '';
        btnCheckStep.style.display = isExamMode ? 'none' : '';
        btnPreviewSolution.style.display = isExamMode ? 'none' : '';
        if (isExamMode) {
          helperDrawer.classList.add('hidden');
          decimalShiftBadge.style.display = 'none';
        } else {
          renderHelperDrawer(q);
        }

        const totalSteps = plan.steps.length;
        const isStepsFinished = isExamMode || (q.currentStepIdx >= totalSteps);

        // Step Banner
        if (isExamMode) {
          stepBanner.classList.toggle('completed', q.isCompleted);
          stepInstruction.textContent = q.isCompleted
            ? ('📝 Question ' + qNum + ' answer recorded. Full worked steps and answers will be shown once all 25 questions are done!')
            : '📝 Pure Test Mode (25 Questions): No step descriptions, tips, or guides are shown during the test. Enter your Final Answer on the right!';
          stepCounterPill.textContent = 'Exam Q' + qNum + ' of ' + totalQ;
        } else if (isStepsFinished) {
          stepBanner.classList.add('completed');
          if (q.isCompleted) {
            stepInstruction.textContent =
              '✅ Question ' + qNum + ' complete! Official Answer: ' + plan.formattedAnswer + '. Click Next Question below!';
          } else if (q.op === 'div' && plan.finalRemainder > 0) {
            stepInstruction.textContent =
              '🎉 Reached the no-more-division point (Remainder ' + plan.finalRemainder + ' < ' + plan.divisorInt + ')! Now enter your final answer in the "Answer" box on the right.';
          } else {
            stepInstruction.textContent =
              '🎉 All calculation steps complete! Now enter your final answer in the "Answer" box on the right.';
          }
          stepCounterPill.textContent = 'Steps Done (' + totalSteps + '/' + totalSteps + ')';
        } else {
          stepBanner.classList.remove('completed');
          const curStep = plan.steps[q.currentStepIdx];
          stepInstruction.textContent = 'Step ' + (q.currentStepIdx + 1) + ': ' + curStep.prompt;
          stepCounterPill.textContent = 'Step ' + (q.currentStepIdx + 1) + ' of ' + totalSteps;
        }

        // Prev / Next buttons
        btnPrevQuestion.disabled = state.activeQuestionIdx === 0;
        btnNextQuestion.textContent = state.activeQuestionIdx === totalQ - 1
          ? ('View ' + totalQ + '-Question Printout →')
          : ('Next Question (Q' + (qNum + 1) + ') →');
        questionBottomStatus.textContent = 'Question ' + qNum + ' of ' + totalQ + (q.isCompleted ? ' (Completed ✓)' : '');

        // Answer Card State
        finalAnswerInput.value = q.finalAnswerInput || '';
        if (isStepsFinished) {
          answerCard.classList.add('unlocked');
          answerStatusBadge.className = 'status-lock-badge ready';
          answerStatusBadge.textContent = q.isCompleted ? 'Answered ✓' : (isExamMode ? 'Exam Mode — Open' : 'Ready for Answer!');
          if (isExamMode) {
            answerHelperText.textContent =
              'Pure Test Mode: Type your final answer below (for division with remainder, write e.g. 14 R 2). Full answers & steps unlock after all 25 questions:';
          } else if (q.op === 'div' && plan.finalRemainder > 0 && plan.decColIndex === -1) {
            answerHelperText.textContent =
              'Type the quotient (' + plan.cleanQuotientStr + ') or quotient with remainder (' + plan.cleanQuotientStr + ' R ' + plan.finalRemainder + '):';
          } else {
            answerHelperText.textContent = 'Type your final answer in the Answer box below:';
          }
          finalAnswerInput.disabled = false;
          btnSubmitAnswer.disabled = false;
          btnSubmitAnswer.textContent = isExamMode ? 'Submit Exam Answer' : 'Check Final Answer';
        } else {
          answerCard.classList.remove('unlocked');
          answerStatusBadge.className = 'status-lock-badge';
          answerStatusBadge.textContent = 'Finish Steps First';
          answerHelperText.textContent =
            'Complete the calculation steps on the left to unlock the final Answer box.';
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

        // Notes Box
        problemNotesTextarea.value = q.notes || '';
        notesSaveIndicator.textContent = 'Saved for Question ' + qNum;

        // Render Operation-Specific Grid (or Pure Unassisted Problem View in 25-Q Exam Mode)
        if (isExamMode) {
          renderPureExamProblem(q);
        } else if (q.op === 'div') {
          renderDivisionGrid(q);
        } else if (q.op === 'add') {
          renderAdditionGrid(q);
        } else if (q.op === 'sub') {
          renderSubtractionGrid(q);
        } else if (q.op === 'mul') {
          renderMultiplicationGrid(q);
        }
      }

      function renderPureExamProblem(q) {
        const plan = q.plan;
        const sym = getOpSymbol(q.op);
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.padding = '36px 20px';

        if (q.op === 'div') {
          wrapper.innerHTML =
            '<div style="display:inline-flex; align-items:center; font-size:2.4rem; font-weight:800; color:#0f172a; letter-spacing:0.06em;">' +
              '<span style="padding-right:8px;">' + escapeHtml(plan.rawNumB) + '</span>' +
              '<span style="border-right:4px solid #0f172a; border-radius:0 50% 50% 0; height:54px; width:16px; display:inline-block; margin-right:6px;"></span>' +
              '<span style="border-top:4px solid #0f172a; padding:4px 14px 0 10px;">' + escapeHtml(plan.rawNumA) + '</span>' +
            '</div>' +
            '<p style="margin-top:22px; font-size:0.9rem; font-weight:700; color:#64748b;">Pure Test Mode: Use the Notes or Draw scratchpad on the right for your working, then submit your Final Answer.</p>';
        } else {
          const widthCh = Math.max(plan.rawNumA.length, plan.rawNumB.length) + 2;
          wrapper.innerHTML =
            '<div style="display:inline-block; text-align:right; font-family:monospace; font-size:2.4rem; font-weight:800; color:#0f172a; line-height:1.25;">' +
              '<div>' + escapeHtml(plan.rawNumA.padStart(widthCh, ' ')) + '</div>' +
              '<div style="border-bottom:4px solid #0f172a; padding-bottom:6px;"><span style="color:#2563eb; margin-right:12px;">' + sym + '</span>' + escapeHtml(plan.rawNumB) + '</div>' +
            '</div>' +
            '<p style="margin-top:22px; font-size:0.9rem; font-weight:700; color:#64748b;">Pure Test Mode: Use the Notes or Draw scratchpad on the right for your working, then submit your Final Answer.</p>';
        }

        divisionGridMount.innerHTML = '';
        divisionGridMount.appendChild(wrapper);
      }

      // -----------------------------------------------------------------------
      // GRID RENDERER 1: LONG DIVISION
      // -----------------------------------------------------------------------
      function renderDivisionGrid(q) {
        const plan = q.plan;
        const N = plan.digits.length;
        const hasDec = plan.decColIndex !== -1;

        const table = document.createElement('table');
        table.className = 'long-division-table';

        // Row 0: Quotient
        const trQuotient = document.createElement('tr');
        trQuotient.appendChild(document.createElement('td'));
        const tdBracketTop = document.createElement('td');
        tdBracketTop.className = 'bracket-cell';
        trQuotient.appendChild(tdBracketTop);

        for (let c = 0; c < N; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdDec = document.createElement('td');
            tdDec.className = 'dec-col';
            const qStepForCol = plan.steps.findIndex(function (s) {
              return s.type === 'quotient' && s.col >= plan.decColIndex;
            });
            if (qStepForCol !== -1 && q.currentStepIdx >= qStepForCol) {
              tdDec.innerHTML = '<span class="decimal-dot">.</span>';
            }
            trQuotient.appendChild(tdDec);
          }

          const td = document.createElement('td');
          const qStepIdx = plan.steps.findIndex(function (s) {
            return s.type === 'quotient' && s.col === c;
          });
          if (qStepIdx !== -1 && q.currentStepIdx >= qStepIdx) {
            td.appendChild(createStepCellInput(q, qStepIdx, 0, plan.steps[qStepIdx].expectedDigits[0], 'quotient'));
          }
          trQuotient.appendChild(td);
        }
        table.appendChild(trQuotient);

        // Row 1: Divisor + ')' + Dividend
        const trDividend = document.createElement('tr');
        const tdDivisor = document.createElement('td');
        tdDivisor.style.width = 'auto';
        tdDivisor.style.paddingRight = '4px';
        tdDivisor.style.textAlign = 'right';
        tdDivisor.innerHTML = '<span class="divisor-text">' + plan.divisorInt + '</span>';
        trDividend.appendChild(tdDivisor);

        const tdBracket = document.createElement('td');
        tdBracket.className = 'bracket-cell';
        tdBracket.innerHTML = '<div class="bracket-curve"></div>';
        trDividend.appendChild(tdBracket);

        for (let c = 0; c < N; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdDec = document.createElement('td');
            tdDec.className = 'dec-col dividend-cell';
            tdDec.innerHTML = '<span class="decimal-dot">.</span>';
            trDividend.appendChild(tdDec);
          }
          const td = document.createElement('td');
          td.className = 'dividend-cell';
          td.innerHTML = '<span class="digit-static">' + plan.digits[c] + '</span>';
          trDividend.appendChild(td);
        }
        table.appendChild(trDividend);

        // Work Rows
        for (let r = 0; r < plan.workRows.length; r++) {
          const wRow = plan.workRows[r];
          if (q.currentStepIdx < wRow.appearAtStep) continue;

          const tr = document.createElement('tr');
          tr.appendChild(document.createElement('td'));
          const tdB = document.createElement('td');
          tdB.className = 'bracket-cell';
          tr.appendChild(tdB);

          const showLine = wRow.type === 'product' && q.currentStepIdx >= wRow.lineAppearAtStep;

          for (let c = 0; c < N; c++) {
            if (hasDec && c === plan.decColIndex) {
              const tdDec = document.createElement('td');
              tdDec.className = 'dec-col';
              if (showLine && c > wRow.lineCols[0] && c <= wRow.lineCols[1]) {
                tdDec.classList.add('subtraction-line-cell');
              }
              tr.appendChild(tdDec);
            }

            const td = document.createElement('td');
            if (showLine && c >= wRow.lineCols[0] && c <= wRow.lineCols[1]) {
              td.classList.add('subtraction-line-cell');
            }

            const cellInfo = wRow.cells[c];
            if (cellInfo && q.currentStepIdx >= cellInfo.stepIdx) {
              td.appendChild(createStepCellInput(q, cellInfo.stepIdx, cellInfo.cellIdx, cellInfo.expected, 'work'));
            } else if (wRow.type === 'product') {
              let showArrowHere = false;
              if (wRow.arrowCol === c && wRow.arrowAppearAtStep !== null && q.currentStepIdx >= wRow.arrowAppearAtStep) {
                showArrowHere = true;
              }
              if (wRow.extraArrows) {
                for (let aIdx = 0; aIdx < wRow.extraArrows.length; aIdx++) {
                  const ea = wRow.extraArrows[aIdx];
                  if (ea.col === c && q.currentStepIdx >= ea.appearAtStep) {
                    showArrowHere = true;
                  }
                }
              }
              if (showArrowHere) {
                td.innerHTML =
                  '<div class="arrow-container" title="Bring down digit">' +
                  '<svg class="arrow-svg" viewBox="0 0 24 36" aria-hidden="true">' +
                  '<line x1="12" y1="2" x2="12" y2="30"></line>' +
                  '<polyline points="6,24 12,31 18,24"></polyline>' +
                  '</svg>' +
                  '</div>';
              }
            }
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }

        divisionGridMount.innerHTML = '';
        divisionGridMount.appendChild(table);
      }

      // -----------------------------------------------------------------------
      // GRID RENDERER 2: COLUMNAR ADDITION WITH CARRIES
      // -----------------------------------------------------------------------
      function renderAdditionGrid(q) {
        const plan = q.plan;
        const C = plan.totalCols;
        const hasDec = plan.decColIndex !== -1;

        const table = document.createElement('table');
        table.className = 'long-division-table';

        // Row 0: Carry Row
        const trCarry = document.createElement('tr');
        trCarry.appendChild(document.createElement('td')); // Operator col
        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col';
            trCarry.appendChild(tdD);
          }
          const td = document.createElement('td');
          const cInfo = plan.carryCells[c];
          if (cInfo && q.currentStepIdx >= cInfo.stepIdx) {
            td.appendChild(createStepCellInput(q, cInfo.stepIdx, 0, cInfo.expected, 'carry'));
          }
          trCarry.appendChild(td);
        }
        table.appendChild(trCarry);

        // Row 1: Top Number A
        const trA = document.createElement('tr');
        trA.appendChild(document.createElement('td'));
        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col';
            tdD.innerHTML = '<span class="decimal-dot">.</span>';
            trA.appendChild(tdD);
          }
          const td = document.createElement('td');
          const ch = plan.rowADigits[c];
          if (ch && ch !== ' ') {
            td.innerHTML = '<span class="digit-static">' + ch + '</span>';
          }
          trA.appendChild(td);
        }
        table.appendChild(trA);

        // Row 2: '+' Sign + Bottom Number B (with bottom line)
        const trB = document.createElement('tr');
        const tdOp = document.createElement('td');
        tdOp.className = 'op-symbol-cell subtraction-line-cell';
        tdOp.textContent = '+';
        trB.appendChild(tdOp);

        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col subtraction-line-cell';
            tdD.innerHTML = '<span class="decimal-dot">.</span>';
            trB.appendChild(tdD);
          }
          const td = document.createElement('td');
          td.className = 'subtraction-line-cell';
          const ch = plan.rowBDigits[c];
          if (ch && ch !== ' ') {
            td.innerHTML = '<span class="digit-static">' + ch + '</span>';
          }
          trB.appendChild(td);
        }
        table.appendChild(trB);

        // Row 3: Sum Row
        const trSum = document.createElement('tr');
        trSum.appendChild(document.createElement('td'));
        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col';
            tdD.innerHTML = '<span class="decimal-dot">.</span>';
            trSum.appendChild(tdD);
          }
          const td = document.createElement('td');
          const sInfo = plan.sumCells[c];
          if (sInfo && q.currentStepIdx >= sInfo.stepIdx) {
            td.appendChild(createStepCellInput(q, sInfo.stepIdx, 0, sInfo.expected, 'work'));
          }
          trSum.appendChild(td);
        }
        table.appendChild(trSum);

        divisionGridMount.innerHTML = '';
        divisionGridMount.appendChild(table);
      }

      // -----------------------------------------------------------------------
      // GRID RENDERER 3: COLUMNAR SUBTRACTION WITH BORROWING
      // -----------------------------------------------------------------------
      function renderSubtractionGrid(q) {
        const plan = q.plan;
        const C = plan.totalCols;
        const hasDec = plan.decColIndex !== -1;

        const table = document.createElement('table');
        table.className = 'long-division-table';

        // Row 0: Borrow / Regroup Row above Top Number
        const trBorrow = document.createElement('tr');
        trBorrow.appendChild(document.createElement('td'));
        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col';
            trBorrow.appendChild(tdD);
          }
          const td = document.createElement('td');
          const bBadge = plan.borrowBadges[c];
          if (bBadge && q.currentStepIdx >= bBadge.appearAtStep) {
            td.innerHTML = '<span class="regroup-badge">' + bBadge.text + '</span>';
          }
          trBorrow.appendChild(td);
        }
        table.appendChild(trBorrow);

        // Row 1: Top Number A (with crossed-out styling when borrowed)
        const trA = document.createElement('tr');
        trA.appendChild(document.createElement('td'));
        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col';
            tdD.innerHTML = '<span class="decimal-dot">.</span>';
            trA.appendChild(tdD);
          }
          const td = document.createElement('td');
          const ch = plan.rowADigits[c];
          if (ch && ch !== ' ') {
            const isCrossed = plan.crossedCols[c] !== undefined && q.currentStepIdx >= plan.crossedCols[c];
            td.innerHTML = '<span class="' + (isCrossed ? 'digit-crossed' : 'digit-static') + '">' + ch + '</span>';
          }
          trA.appendChild(td);
        }
        table.appendChild(trA);

        // Row 2: '−' Sign + Bottom Number B
        const trB = document.createElement('tr');
        const tdOp = document.createElement('td');
        tdOp.className = 'op-symbol-cell subtraction-line-cell';
        tdOp.textContent = '−';
        trB.appendChild(tdOp);

        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col subtraction-line-cell';
            tdD.innerHTML = '<span class="decimal-dot">.</span>';
            trB.appendChild(tdD);
          }
          const td = document.createElement('td');
          td.className = 'subtraction-line-cell';
          const ch = plan.rowBDigits[c];
          if (ch && ch !== ' ') {
            td.innerHTML = '<span class="digit-static">' + ch + '</span>';
          }
          trB.appendChild(td);
        }
        table.appendChild(trB);

        // Row 3: Difference Row
        const trDiff = document.createElement('tr');
        trDiff.appendChild(document.createElement('td'));
        for (let c = 0; c < C; c++) {
          if (hasDec && c === plan.decColIndex) {
            const tdD = document.createElement('td');
            tdD.className = 'dec-col';
            tdD.innerHTML = '<span class="decimal-dot">.</span>';
            trDiff.appendChild(tdD);
          }
          const td = document.createElement('td');
          const dInfo = plan.diffCells[c];
          if (dInfo && q.currentStepIdx >= dInfo.stepIdx) {
            td.appendChild(createStepCellInput(q, dInfo.stepIdx, 0, dInfo.expected, 'work'));
          }
          trDiff.appendChild(td);
        }
        table.appendChild(trDiff);

        divisionGridMount.innerHTML = '';
        divisionGridMount.appendChild(table);
      }

      // -----------------------------------------------------------------------
      // GRID RENDERER 4: COLUMNAR MULTIPLICATION
      // -----------------------------------------------------------------------
      function renderMultiplicationGrid(q) {
        const plan = q.plan;
        const C = plan.totalCols;

        const table = document.createElement('table');
        table.className = 'long-division-table';

        // Row 0: Top Number A
        const trA = document.createElement('tr');
        trA.appendChild(document.createElement('td'));
        for (let c = 0; c < C; c++) {
          const td = document.createElement('td');
          const ch = plan.rowADigits[c];
          if (ch && ch !== ' ') {
            td.innerHTML = '<span class="digit-static">' + ch + '</span>';
          }
          trA.appendChild(td);
        }
        table.appendChild(trA);

        // Row 1: '×' Sign + Bottom Number B
        const trB = document.createElement('tr');
        const tdOp = document.createElement('td');
        tdOp.className = 'op-symbol-cell subtraction-line-cell';
        tdOp.textContent = '×';
        trB.appendChild(tdOp);

        for (let c = 0; c < C; c++) {
          const td = document.createElement('td');
          td.className = 'subtraction-line-cell';
          const ch = plan.rowBDigits[c];
          if (ch && ch !== ' ') {
            td.innerHTML = '<span class="digit-static">' + ch + '</span>';
          }
          trB.appendChild(td);
        }
        table.appendChild(trB);

        // Partial Product Rows & Final Sum Row
        for (let r = 0; r < plan.partialRows.length; r++) {
          const pRow = plan.partialRows[r];
          if (q.currentStepIdx < pRow.appearAtStep) continue;

          const tr = document.createElement('tr');
          const tdLeft = document.createElement('td');
          const showBottomLine = pRow.showBottomLine && q.currentStepIdx >= pRow.lineAppearAtStep;

          if (pRow.label === 'partial' && r === plan.partialRows.length - 2) {
            tdLeft.className = 'op-symbol-cell' + (showBottomLine ? ' subtraction-line-cell' : '');
            tdLeft.textContent = '+';
          }
          tr.appendChild(tdLeft);

          for (let c = 0; c < C; c++) {
            const td = document.createElement('td');
            if (showBottomLine) {
              td.classList.add('subtraction-line-cell');
            }
            const cellInfo = pRow.cells[c];
            if (cellInfo && q.currentStepIdx >= cellInfo.stepIdx) {
              td.appendChild(createStepCellInput(q, cellInfo.stepIdx, cellInfo.cellIdx, cellInfo.expected, 'work'));
            }
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }

        divisionGridMount.innerHTML = '';
        divisionGridMount.appendChild(table);
      }

      // =========================================================================
      // SHARED STEP INPUT BOX HANDLER
      // =========================================================================
      function createStepCellInput(q, stepIdx, cellIdx, expectedDigit, role) {
        const key = stepIdx + '-' + cellIdx;
        const isPastStep = stepIdx < q.currentStepIdx;
        const isCurrentStep = stepIdx === q.currentStepIdx;

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.inputMode = 'numeric';
        input.className = 'grid-digit-input';
        if (role === 'carry') input.classList.add('carry-input');
        input.dataset.stepIdx = String(stepIdx);
        input.dataset.cellIdx = String(cellIdx);

        if (isPastStep) {
          input.value = expectedDigit;
          input.readOnly = true;
          input.tabIndex = -1;
          if (role === 'carry') {
            input.classList.add('carry-locked');
          } else {
            input.classList.add(role === 'quotient' ? 'quotient-locked' : 'correct-locked');
          }
        } else if (isCurrentStep) {
          input.value = q.stepInputs[key] || '';
          input.classList.add('active-step-input');
          if (q.wrongCells[key]) {
            input.classList.add('wrong-digit');
          }

          input.addEventListener('input', function (e) {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            const digit = raw.slice(-1);
            e.target.value = digit;
            q.stepInputs[key] = digit;
            delete q.wrongCells[key];
            e.target.classList.remove('wrong-digit');

            if (digit !== '') {
              handleDigitEntered(q, stepIdx, cellIdx, digit, expectedDigit);
            }
          });

          input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              verifyAndAdvanceCurrentStep();
            } else if (e.key === 'Backspace' && !e.target.value && cellIdx > 0) {
              const prevInput = divisionGridMount.querySelector(
                'input[data-step-idx="' + stepIdx + '"][data-cell-idx="' + (cellIdx - 1) + '"]'
              );
              if (prevInput) prevInput.focus();
            }
          });
        }

        return input;
      }

      function handleDigitEntered(q, stepIdx, cellIdx, digit, expectedDigit) {
        const curStep = q.plan.steps[stepIdx];
        if (!curStep) return;

        if (digit !== expectedDigit) {
          const key = stepIdx + '-' + cellIdx;
          q.wrongCells[key] = true;
          state.streak = 0;
          sound.play('wrong');
          renderAll();
          focusSpecificCell(stepIdx, cellIdx);
          return;
        }

        let allCorrect = true;
        let nextEmptyCellIdx = -1;
        for (let i = 0; i < curStep.expectedDigits.length; i++) {
          const k = stepIdx + '-' + i;
          if (q.stepInputs[k] !== curStep.expectedDigits[i]) {
            allCorrect = false;
            if (nextEmptyCellIdx === -1) nextEmptyCellIdx = i;
          }
        }

        if (allCorrect) {
          q.currentStepIdx++;
          state.stars += 1;
          state.streak += 1;
          sound.play('step');
          renderAll();
          if (q.currentStepIdx >= q.plan.steps.length) {
            finalAnswerInput.focus();
          } else {
            focusActiveInput();
          }
        } else if (nextEmptyCellIdx !== -1) {
          focusSpecificCell(stepIdx, nextEmptyCellIdx);
        }
      }

      function verifyAndAdvanceCurrentStep() {
        const q = getActiveQ();
        if (!q || !q.plan || q.currentStepIdx >= q.plan.steps.length) return;

        const curStep = q.plan.steps[q.currentStepIdx];
        let allMatch = true;
        for (let i = 0; i < curStep.expectedDigits.length; i++) {
          const k = q.currentStepIdx + '-' + i;
          if (q.stepInputs[k] !== curStep.expectedDigits[i]) {
            allMatch = false;
            q.wrongCells[k] = true;
          }
        }

        if (allMatch) {
          q.currentStepIdx++;
          state.stars += 1;
          state.streak += 1;
          sound.play('step');
          renderAll();
          if (q.currentStepIdx >= q.plan.steps.length) {
            finalAnswerInput.focus();
          } else {
            focusActiveInput();
          }
        } else {
          state.streak = 0;
          sound.play('wrong');
          renderAll();
          focusActiveInput();
        }
      }

      function giveHintForCurrentStep() {
        const q = getActiveQ();
        if (!q || !q.plan || q.currentStepIdx >= q.plan.steps.length) return;

        const curStep = q.plan.steps[q.currentStepIdx];
        for (let i = 0; i < curStep.expectedDigits.length; i++) {
          const k = q.currentStepIdx + '-' + i;
          if (q.stepInputs[k] !== curStep.expectedDigits[i]) {
            q.stepInputs[k] = curStep.expectedDigits[i];
            delete q.wrongCells[k];
            handleDigitEntered(q, q.currentStepIdx, i, curStep.expectedDigits[i], curStep.expectedDigits[i]);
            return;
          }
        }
      }

      function focusActiveInput() {
        const firstActive = divisionGridMount.querySelector('input.active-step-input');
        if (firstActive) {
          firstActive.focus();
          firstActive.select();
        }
      }

      function focusSpecificCell(stepIdx, cellIdx) {
        const target = divisionGridMount.querySelector(
          'input[data-step-idx="' + stepIdx + '"][data-cell-idx="' + cellIdx + '"]'
        );
        if (target) {
          target.focus();
          target.select();
        }
      }

      // =========================================================================
      // FINAL ANSWER CHECKER & WORKBOOK COMPLETION HANDLER
      // =========================================================================
      function checkFinalAnswer() {
        const q = getActiveQ();
        if (!q || !q.plan) return;
        const plan = q.plan;

        const rawUser = (finalAnswerInput.value || '').trim();
        q.finalAnswerInput = rawUser;

        if (!rawUser) {
          q.answerFeedbackType = 'incorrect';
          q.answerFeedbackMessage = 'Please type your final answer in the Answer box first.';
          renderAll();
          return;
        }

        const normalizedUser = rawUser.toLowerCase().replace(/\s+/g, '');
        const cleanQ = plan.cleanQuotientStr.toLowerCase();
        const rawQ = plan.rawQuotientStr.toLowerCase();
        const rem = plan.finalRemainder || 0;

        const validAnswers = new Set([cleanQ, rawQ]);
        if (q.op === 'div' && rem > 0) {
          validAnswers.add(cleanQ + 'r' + rem);
          validAnswers.add(rawQ + 'r' + rem);
          validAnswers.add(cleanQ + 'rem' + rem);
          validAnswers.add(cleanQ + 'remainder' + rem);
        } else {
          validAnswers.add(cleanQ + 'r0');
        }

        if (state.workbookOp === 'random') {
          const isRight = validAnswers.has(normalizedUser);
          if (!q.isCompleted && isRight) {
            state.stars += 5;
            state.streak += 1;
          }
          q.isCompleted = true;
          q.answerFeedbackType = 'correct';
          q.answerFeedbackMessage = '📝 Answer saved for Question ' + (state.activeQuestionIdx + 1) + '! Full answers and worked steps will be revealed once all 25 questions are done.';
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
                switchToQuestion(cand);
                break;
              }
            }
          }
          return;
        }

        if (validAnswers.has(normalizedUser)) {
          if (!q.isCompleted) {
            state.stars += 5;
            state.streak += 1;
          }
          q.isCompleted = true;
          q.answerFeedbackType = 'correct';
          sound.play('correct');

          const sym = getOpSymbol(q.op);
          q.answerFeedbackMessage =
            '🌟 Awesome job! ' + plan.rawNumA + ' ' + sym + ' ' + plan.rawNumB + ' = ' + plan.formattedAnswer + '!';

          renderAll();

          const totalQ = state.questions.length;
          if (getCompletedCount() === totalQ && !state.pdfAutoTriggered) {
            state.pdfAutoTriggered = true;
            setView('printout');
            generateAndDownloadPdfFile();
          }
        } else {
          state.streak = 0;
          q.answerFeedbackType = 'incorrect';
          sound.play('wrong');
          if (q.op === 'div' && rem > 0) {
            q.answerFeedbackMessage =
              'Not quite! Look at the quotient (' + plan.cleanQuotientStr + ') and remainder (' + rem + '). Try "' + plan.cleanQuotientStr + ' R ' + rem + '".';
          } else {
            q.answerFeedbackMessage =
              'Not quite! Check your completed digits on the left (' + plan.formattedAnswer + ') and try again.';
          }
          renderAll();
        }
      }

      // =========================================================================
      // WORKED ASCII DIAGRAM BUILDER (FOR PRINTOUT CARDS & VECTOR PDF)
      // =========================================================================
      function buildWorkedAsciiLines(plan) {
        if (plan.op === 'div') {
          const N = plan.digits.length;
          const divStr = String(plan.divisorInt);
          const leftPad = divStr.length + 2;

          let qChars = '';
          let dChars = '';
          for (let c = 0; c < N; c++) {
            if (plan.decColIndex !== -1 && c === plan.decColIndex) {
              qChars += '.';
              dChars += '.';
            }
            qChars += String(plan.quotientDigits[c]);
            dChars += String(plan.digits[c]);
          }

          const lines = [];
          lines.push(' '.repeat(leftPad) + qChars);
          lines.push(' '.repeat(leftPad) + '_'.repeat(dChars.length));
          lines.push(divStr + ') ' + dChars);

          for (let r = 0; r < plan.workRows.length; r++) {
            const wRow = plan.workRows[r];
            let rowStr = '';
            let underlineStr = '';
            for (let c = 0; c < N; c++) {
              if (plan.decColIndex !== -1 && c === plan.decColIndex) {
                rowStr += ' ';
                underlineStr += (wRow.type === 'product' && c > wRow.lineCols[0] && c <= wRow.lineCols[1]) ? '-' : ' ';
              }
              const cellInfo = wRow.cells[c];
              if (cellInfo) {
                rowStr += cellInfo.expected;
              } else if (wRow.type === 'product' && wRow.arrowCol === c) {
                rowStr += 'v';
              } else {
                rowStr += ' ';
              }

              if (wRow.type === 'product' && c >= wRow.lineCols[0] && c <= wRow.lineCols[1]) {
                underlineStr += '-';
              } else {
                underlineStr += ' ';
              }
            }
            lines.push(' '.repeat(leftPad) + rowStr);
            if (wRow.type === 'product') {
              lines.push(' '.repeat(leftPad) + underlineStr);
            }
          }
          return lines;
        }

        if (plan.op === 'add') {
          const width = Math.max(plan.rawNumA.length, plan.rawNumB.length, plan.formattedAnswer.length) + 2;
          return [
            '  ' + plan.rawNumA.padStart(width, ' '),
            '+ ' + plan.rawNumB.padStart(width, ' '),
            '  ' + '-'.repeat(width),
            '  ' + plan.formattedAnswer.padStart(width, ' ')
          ];
        }

        if (plan.op === 'sub') {
          const width = Math.max(plan.rawNumA.length, plan.rawNumB.length, plan.formattedAnswer.length) + 2;
          return [
            '  ' + plan.rawNumA.padStart(width, ' '),
            '- ' + plan.rawNumB.padStart(width, ' '),
            '  ' + '-'.repeat(width),
            '  ' + plan.formattedAnswer.padStart(width, ' ')
          ];
        }

        // Multiplication ('mul')
        const width = Math.max(plan.rawNumA.length, plan.rawNumB.length, plan.formattedAnswer.length) + 2;
        const lines = [
          '  ' + plan.rawNumA.padStart(width, ' '),
          'x ' + plan.rawNumB.padStart(width, ' '),
          '  ' + '-'.repeat(width)
        ];
        if (plan.partialRows && plan.partialRows.length > 1) {
          for (let r = 0; r < plan.partialRows.length - 1; r++) {
            const pRow = plan.partialRows[r];
            let s = '';
            for (let c = 0; c < plan.totalCols; c++) {
              s += pRow.cells[c] ? pRow.cells[c].expected : ' ';
            }
            lines.push((r === plan.partialRows.length - 2 ? '+ ' : '  ') + s.trim().padStart(width, ' '));
          }
          lines.push('  ' + '-'.repeat(width));
        }
        lines.push('  ' + plan.formattedAnswer.padStart(width, ' '));
        return lines;
      }

      // =========================================================================
      // ON-SCREEN PRINTOUT SHEET RENDERER
      // =========================================================================
      function renderPrintoutCards() {
        const totalQ = state.questions.length;
        const completedCount = getCompletedCount();
        printoutMainHeading.textContent =
          "📄 Interactive Math Workbook — " + totalQ + "-Question Answer Sheet (" + getOpName(state.workbookOp) + ")";
        printoutSubtitle.textContent =
          'Completed ' + completedCount + ' of ' + totalQ + ' Questions  •  Stars: ' + state.stars + ' ⭐  •  Elapsed Time: ' + formatSeconds(state.elapsedSeconds);

        printoutGrid.innerHTML = '';
        for (let i = 0; i < totalQ; i++) {
          const q = state.questions[i];
          const plan = q.plan;
          const sym = getOpSymbol(q.op);

          const card = document.createElement('div');
          card.className = 'printout-q-card';

          const top = document.createElement('div');
          top.className = 'printout-q-top';
          top.innerHTML =
            '<span class="printout-q-title">Q' + (i + 1) + ' (' + getOpName(q.op) + '): ' + plan.rawNumA + ' ' + sym + ' ' + plan.rawNumB + '</span>' +
            '<span class="printout-ans-pill">Ans: ' + plan.formattedAnswer + '</span>';
          card.appendChild(top);

          const body = document.createElement('div');
          body.className = 'printout-q-body';

          const asciiPre = document.createElement('div');
          asciiPre.className = 'printout-ascii-box';
          asciiPre.textContent = buildWorkedAsciiLines(plan).join('\n');
          body.appendChild(asciiPre);

          const meta = document.createElement('div');
          meta.className = 'printout-meta-box';
          const childAns = q.finalAnswerInput ? q.finalAnswerInput : (q.isCompleted ? plan.formattedAnswer : 'Not entered yet');
          const statusStr = q.isCompleted ? '✅ Completed' : '⏳ In Progress';
          const notesStr = q.notes ? q.notes : 'No notes recorded.';
          meta.innerHTML =
            '<p><strong>Status:</strong> ' + statusStr + '</p>' +
            '<p><strong>Student\'s Answer:</strong> ' + escapeHtml(childAns) + '</p>' +
            '<p><strong>Official Answer:</strong> ' + plan.formattedAnswer + '</p>' +
            '<p style="margin-top:6px;"><strong>Notes:</strong><br/>' + escapeHtml(notesStr).replace(/\n/g, '<br/>') + '</p>';

          body.appendChild(meta);
          card.appendChild(body);
          printoutGrid.appendChild(card);
        }
      }

      function escapeHtml(str) {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      // =========================================================================
      // PURE-JS DYNAMIC MULTI-PAGE VECTOR PDF 1.4 GENERATOR (10 OR 25 QUESTIONS)
      // =========================================================================
      function pdfEscapeText(str) {
        return String(str)
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
      }

      function generateAndDownloadPdfFile() {
        const totalQ = state.questions.length;
        const questionsPerPage = 6; // 2 columns x 3 rows per A4 page
        const numPages = Math.ceil(totalQ / questionsPerPage) || 1;
        const pageStreams = [];

        const completedCount = getCompletedCount();
        const dateStr = new Date().toLocaleDateString();
        const opTitle = getOpName(state.workbookOp);

        for (let p = 0; p < numPages; p++) {
          let s = '';
          const startQ = p * questionsPerPage + 1;
          const endQ = Math.min((p + 1) * questionsPerPage, totalQ);

          // Header banner
          s += '0.92 0.96 0.99 rg 0.23 0.51 0.96 RG 1.2 w 30 772 535 46 re B\n';
          s += '0.06 0.09 0.16 rg\n';
          s += 'BT /F2 14 Tf 44 798 Td (' + pdfEscapeText("Interactive Math Workbook - " + opTitle + " Answer Printout") + ') Tj ET\n';
          s += '0.35 0.42 0.52 rg\n';
          const subLine = 'Date: ' + dateStr + '  |  Completed: ' + completedCount + '/' + totalQ + '  |  Stars: ' + state.stars + '  |  Page ' + (p + 1) + ' of ' + numPages + ' (Q' + startQ + '-Q' + endQ + ')';
          s += 'BT /F1 9 Tf 44 782 Td (' + pdfEscapeText(subLine) + ') Tj ET\n';

          for (let localIdx = 0; localIdx < questionsPerPage; localIdx++) {
            const qIdx = p * questionsPerPage + localIdx;
            if (qIdx >= totalQ) break;

            const q = state.questions[qIdx];
            const plan = q.plan;
            const col = localIdx % 2;
            const row = Math.floor(localIdx / 2);

            const cardX = col === 0 ? 30 : 304;
            const cardW = 261;
            const cardH = 228;
            const cardTopY = 754 - row * 240;
            const cardBottomY = cardTopY - cardH;

            s += '0.99 0.995 1 rg 0.75 0.83 0.91 RG 1 w ' + cardX + ' ' + cardBottomY + ' ' + cardW + ' ' + cardH + ' re B\n';
            s += '0.93 0.97 0.99 rg ' + cardX + ' ' + (cardTopY - 26) + ' ' + cardW + ' 26 re f\n';

            const opAscii = q.op === 'add' ? '+' : (q.op === 'sub' ? '-' : (q.op === 'mul' ? 'x' : '/'));
            const qTitle = 'Q' + (qIdx + 1) + ':  ' + plan.rawNumA + ' ' + opAscii + ' ' + plan.rawNumB;
            s += '0.06 0.09 0.16 rg\n';
            s += 'BT /F2 10 Tf ' + (cardX + 10) + ' ' + (cardTopY - 17) + ' Td (' + pdfEscapeText(qTitle) + ') Tj ET\n';

            s += '0.08 0.50 0.22 rg\n';
            const ansText = 'Ans: ' + plan.formattedAnswer;
            s += 'BT /F2 9.5 Tf ' + (cardX + 145) + ' ' + (cardTopY - 17) + ' Td (' + pdfEscapeText(ansText) + ') Tj ET\n';

            const asciiLines = buildWorkedAsciiLines(plan);
            s += '0.10 0.15 0.24 rg\n';
            let lineY = cardTopY - 42;
            const maxLines = Math.min(asciiLines.length, 15);
            for (let l = 0; l < maxLines; l++) {
              s += 'BT /F3 8.5 Tf ' + (cardX + 12) + ' ' + lineY + ' Td (' + pdfEscapeText(asciiLines[l]) + ') Tj ET\n';
              lineY -= 10.5;
            }

            const infoX = cardX + 125;
            const childAns = q.finalAnswerInput ? q.finalAnswerInput : (q.isCompleted ? plan.formattedAnswer : 'Not entered');
            s += '0.20 0.28 0.38 rg\n';
            s += 'BT /F2 8.5 Tf ' + infoX + ' ' + (cardTopY - 44) + ' Td (' + pdfEscapeText("Student's Answer:") + ') Tj ET\n';
            s += 'BT /F1 8.5 Tf ' + infoX + ' ' + (cardTopY - 56) + ' Td (' + pdfEscapeText(childAns) + ') Tj ET\n';

            s += 'BT /F2 8.5 Tf ' + infoX + ' ' + (cardTopY - 74) + ' Td (' + pdfEscapeText('Official Answer:') + ') Tj ET\n';
            s += 'BT /F1 8.5 Tf ' + infoX + ' ' + (cardTopY - 86) + ' Td (' + pdfEscapeText(plan.formattedAnswer) + ') Tj ET\n';

            s += 'BT /F2 8.5 Tf ' + infoX + ' ' + (cardTopY - 104) + ' Td (' + pdfEscapeText('Notes:') + ') Tj ET\n';
            const cleanNotes = (q.notes || 'None').replace(/\r?\n/g, ' | ').slice(0, 66);
            const n1 = cleanNotes.slice(0, 22);
            const n2 = cleanNotes.slice(22, 44);
            const n3 = cleanNotes.slice(44, 66);
            if (n1) s += 'BT /F1 8 Tf ' + infoX + ' ' + (cardTopY - 116) + ' Td (' + pdfEscapeText(n1) + ') Tj ET\n';
            if (n2) s += 'BT /F1 8 Tf ' + infoX + ' ' + (cardTopY - 127) + ' Td (' + pdfEscapeText(n2) + ') Tj ET\n';
            if (n3) s += 'BT /F1 8 Tf ' + infoX + ' ' + (cardTopY - 138) + ' Td (' + pdfEscapeText(n3) + ') Tj ET\n';
          }

          pageStreams.push(s);
        }

        // Dynamic PDF Object Assembly
        // Obj 1: Catalog, Obj 2: Pages, Obj 3..5: Fonts, Obj 6..(6+numPages-1): Page objects, Obj (6+numPages)..: Content streams
        const objects = [];
        objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

        const firstPageObjId = 6;
        const firstStreamObjId = 6 + numPages;
        const kidsIds = [];
        for (let p = 0; p < numPages; p++) {
          kidsIds.push((firstPageObjId + p) + ' 0 R');
        }
        objects.push('2 0 obj\n<< /Type /Pages /Kids [' + kidsIds.join(' ') + '] /Count ' + numPages + ' >>\nendobj\n');
        objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
        objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
        objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n');

        for (let p = 0; p < numPages; p++) {
          const pageObjId = firstPageObjId + p;
          const streamObjId = firstStreamObjId + p;
          objects.push(
            pageObjId + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
            '/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ' + streamObjId + ' 0 R >>\nendobj\n'
          );
        }

        for (let p = 0; p < numPages; p++) {
          const streamObjId = firstStreamObjId + p;
          objects.push(
            streamObjId + ' 0 obj\n<< /Length ' + pageStreams[p].length + ' >>\nstream\n' + pageStreams[p] + 'endstream\nendobj\n'
          );
        }

        let pdfContent = '%PDF-1.4\n';
        const offsets = [0];
        for (let i = 0; i < objects.length; i++) {
          offsets.push(pdfContent.length);
          pdfContent += objects[i];
        }

        const xrefStart = pdfContent.length;
        pdfContent += 'xref\n0 ' + (objects.length + 1) + '\n';
        pdfContent += '0000000000 65535 f \n';
        for (let i = 1; i <= objects.length; i++) {
          const offStr = String(offsets[i]).padStart(10, '0');
          pdfContent += offStr + ' 00000 n \n';
        }
        pdfContent += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\n';
        pdfContent += 'startxref\n' + xrefStart + '\n%%EOF';

        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Math_Workbook_' + state.workbookOp.toUpperCase() + '_' + totalQ + 'Q_Answers.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 5000);
      }

      // =========================================================================
      // VIEW & NAVIGATION SWITCHING
      // =========================================================================
      function setView(newView) {
        state.view = newView;

        const isHome = newView === 'home';
        frontPageView.classList.toggle('hidden', !isHome);
        workbookActiveShell.classList.toggle('hidden', isHome);

        btnChildMode.classList.toggle('hidden', isHome);
        btnTutorMode.classList.toggle('hidden', isHome);
        btnPrintoutMode.classList.toggle('hidden', isHome);

        btnHomeView.classList.toggle('active', newView === 'home');
        btnChildMode.classList.toggle('active', newView === 'child');
        btnTutorMode.classList.toggle('active', newView === 'tutor');
        btnPrintoutMode.classList.toggle('active', newView === 'printout');

        if (isHome) {
          appMainTitle.textContent = "Interactive Math Workbook";
          appSubtitle.textContent = 'Select Addition, Subtraction, Multiplication, Division (10 Qs) or Random (25 Qs)';
          return;
        }

        const totalQ = state.questions.length;
        appMainTitle.textContent = getOpName(state.workbookOp) + " Workbook";
        appSubtitle.textContent = totalQ + '-Question Step-by-Step Interactive Practice & PDF Answer Generator';

        tutorPanel.classList.toggle('hidden', newView !== 'tutor');
        workspaceLayout.classList.toggle('hidden', newView !== 'child');
        printoutSection.classList.toggle('hidden', newView !== 'printout');

        if (newView === 'tutor') {
          renderTutorTable();
        } else if (newView === 'printout') {
          renderPrintoutCards();
        } else {
          renderAll();
          loadScratchDrawingForActiveQ();
          focusActiveInput();
        }
      }

      // Launch buttons on Front Page
      const launchButtons = document.querySelectorAll('[data-launch-op]');
      launchButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const op = btn.getAttribute('data-launch-op');
          const target = btn.getAttribute('data-launch-target') || 'child';
          initWorkbookQuestions(op, frontDifficultySelect.value, frontQuestionOrder.value, target);
        });
      });

      // Clicking an Operation Card body also starts Child Mode for that operation
      const opCards = document.querySelectorAll('.op-card[data-op]');
      opCards.forEach(function (card) {
        card.addEventListener('click', function () {
          const op = card.getAttribute('data-op');
          initWorkbookQuestions(op, frontDifficultySelect.value, frontQuestionOrder.value, 'child');
        });
      });

      brandHomeBadge.addEventListener('click', function () {
        setView('home');
      });

      btnHomeView.addEventListener('click', function () {
        setView('home');
      });

      btnChildMode.addEventListener('click', function () {
        setView('child');
      });

      btnTutorMode.addEventListener('click', function () {
        setView('tutor');
      });

      btnPrintoutMode.addEventListener('click', function () {
        setView('printout');
      });

      btnSoundToggle.addEventListener('click', function () {
        sound.enabled = !sound.enabled;
        btnSoundToggle.textContent = sound.enabled ? '🔊 Sound On' : '🔇 Muted';
      });

      btnRegenerateRandom.addEventListener('click', function () {
        initWorkbookQuestions(state.workbookOp, state.difficulty, 'random', state.view === 'tutor' ? 'tutor' : 'child');
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
        setView('child');
      });

      // Tutor Preset Buttons
      btnSetStarter.addEventListener('click', function () {
        initWorkbookQuestions(state.workbookOp, 'starter', 'random', 'tutor');
      });

      btnSetStandard.addEventListener('click', function () {
        initWorkbookQuestions(state.workbookOp, 'standard', 'random', 'tutor');
      });

      btnSetChallenge.addEventListener('click', function () {
        initWorkbookQuestions(state.workbookOp, 'challenge', 'random', 'tutor');
      });

      btnSetDecimals.addEventListener('click', function () {
        initWorkbookQuestions(state.workbookOp, 'decimals', 'random', 'tutor');
      });

      btnApplyAllQuestions.addEventListener('click', function () {
        if (applyTutorTableChanges()) {
          setView('child');
        }
      });

      btnTutorFillAll.addEventListener('click', function () {
        if (!applyTutorTableChanges()) return;
        for (let i = 0; i < state.questions.length; i++) {
          const q = state.questions[i];
          q.currentStepIdx = q.plan.steps.length;
          q.finalAnswerInput = q.plan.formattedAnswer;
          q.isCompleted = true;
          q.answerFeedbackType = 'correct';
          q.answerFeedbackMessage = 'Completed!';
        }
        renderAll();
        setView('printout');
        generateAndDownloadPdfFile();
      });

      btnTutorResetAll.addEventListener('click', function () {
        for (let i = 0; i < state.questions.length; i++) {
          const q = state.questions[i];
          state.questions[i] = createQuestionObject(i, q.op, q.rawDividend, q.rawDivisor, q.extraDecimals);
        }
        state.pdfAutoTriggered = false;
        renderTutorTable();
        renderAll();
      });

      // Child Workspace Controls
      btnToggleHelper.addEventListener('click', function () {
        helperDrawer.classList.toggle('hidden');
      });

      btnHintStep.addEventListener('click', function () {
        giveHintForCurrentStep();
      });

      btnCheckStep.addEventListener('click', function () {
        verifyAndAdvanceCurrentStep();
      });

      btnPreviewSolution.addEventListener('click', function () {
        const q = getActiveQ();
        if (!q || !q.plan) return;
        q.currentStepIdx = q.plan.steps.length;
        renderAll();
        finalAnswerInput.focus();
      });

      btnResetProblem.addEventListener('click', function () {
        const q = getActiveQ();
        if (!q) return;
        state.questions[state.activeQuestionIdx] = createQuestionObject(
          state.activeQuestionIdx,
          q.op,
          q.rawDividend,
          q.rawDivisor,
          q.extraDecimals
        );
        renderAll();
        focusActiveInput();
      });

      btnPrevQuestion.addEventListener('click', function () {
        if (state.activeQuestionIdx > 0) {
          switchToQuestion(state.activeQuestionIdx - 1);
        }
      });

      btnNextQuestion.addEventListener('click', function () {
        if (state.activeQuestionIdx < state.questions.length - 1) {
          switchToQuestion(state.activeQuestionIdx + 1);
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

      // Notes & Drawing Scratchpad Tabs
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

      // Restore the last local session or load the default workbook.
      if (restoreProgress()) {
        startTimer();
        setView(state.view);
        if (state.view === 'child') loadScratchDrawingForActiveQ();
      } else {
        initWorkbookQuestions('div', 'standard', 'curated', 'home');
      }
    })();
