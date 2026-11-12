    (function () {
      const CURRENT_YEAR = Number((document.body.dataset.theme || 'year6').replace(/\D/g, '')) || 6;
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

      // Curriculum data is loaded from a year-specific, entitlement-protected script.
      const CURRICULUM_MODULES = window.MATH_CURRICULUM_MODULES;
      if (!Array.isArray(CURRICULUM_MODULES)) throw new Error('Curriculum data is unavailable.');

      // =========================================================================
            // DYNAMIC SVG VISUAL DIAGRAM GENERATOR FOR ALL 6 STRANDS
      // =========================================================================
      function makeSvgCard(title, innerSvg) {
        return (
          '<svg viewBox="0 0 460 150" width="100%" height="150" style="max-width:480px; font-family:Inter,sans-serif;">' +
          '<rect x="2" y="2" width="456" height="146" rx="12" fill="#f8fafc" stroke="#bae6fd" stroke-width="2"/>' +
          '<text x="16" y="24" font-size="12" font-weight="800" fill="#0369a1">' + title + '</text>' +
          innerSvg +
          '</svg>'
        );
      }

      // =========================================================================
      // QUESTION GENERATORS FOR EACH OF THE 16 SUB-STRAND MODULES (10 Qs EACH)
      // Each question has: topic, prompt, svgHtml, steps: [{label, expected, unit}], finalAnswer, altAnswers
      // =========================================================================
      function generateQuestionsForModule(moduleId, seedOffset) {
        const off = seedOffset || 0;
        const questions = [];

        if (moduleId === 'num_types') {
          const primes = [11, 13, 17, 19, 23, 29, 31];
          const p = primes[(0 + off) % primes.length];
          const comp = (randInt(4, 9) * 3);
          questions.push({
            topic: 'Prime & Composite Numbers',
            prompt: 'Determine the prime factors of ' + (p * 2) + ' by dividing by 2 first.',
            svgHtml: makeSvgCard('Factor Tree: ' + (p * 2), '<circle cx="230" cy="48" r="20" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><text x="230" y="53" text-anchor="middle" font-size="13" font-weight="800">' + (p * 2) + '</text><line x1="215" y1="64" x2="170" y2="100" stroke="#475569" stroke-width="2"/><line x1="245" y1="64" x2="290" y2="100" stroke="#475569" stroke-width="2"/><circle cx="165" cy="115" r="18" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/><text x="165" y="120" text-anchor="middle" font-size="13" font-weight="800">2</text><circle cx="295" cy="115" r="18" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><text x="295" y="120" text-anchor="middle" font-size="13" font-weight="800">?</text>'),
            steps: [
              { label: 'Step 1: Divide ' + (p * 2) + ' ÷ 2 to find the missing prime factor', expected: String(p), unit: '' },
              { label: 'Step 2: How many total prime factors are multiplied (2 × ' + p + ')?', expected: '2', unit: 'factors' }
            ],
            finalAnswer: String(p),
            altAnswers: ['2x' + p, '2*' + p]
          });

          const sqBase = randInt(6, 12);
          const cubeBase = randInt(2, 5);
          questions.push({
            topic: 'Square & Cube Numbers',
            prompt: 'Evaluate ' + sqBase + '² + ' + cubeBase + '³.',
            svgHtml: makeSvgCard('Squares & Cubes', '<rect x="60" y="42" width="75" height="75" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/><text x="97" y="84" text-anchor="middle" font-size="14" font-weight="800">' + sqBase + '²</text><text x="185" y="86" font-size="22" font-weight="900" fill="#0f172a">+</text><rect x="230" y="42" width="75" height="75" rx="8" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/><text x="267" y="84" text-anchor="middle" font-size="14" font-weight="800">' + cubeBase + '³</text>'),
            steps: [
              { label: 'Step 1: Calculate the square number ' + sqBase + '² (' + sqBase + ' × ' + sqBase + ')', expected: String(sqBase * sqBase), unit: '' },
              { label: 'Step 2: Calculate the cube number ' + cubeBase + '³ (' + cubeBase + ' × ' + cubeBase + ' × ' + cubeBase + ')', expected: String(cubeBase * cubeBase * cubeBase), unit: '' },
              { label: 'Step 3: Add the two results together', expected: String(sqBase * sqBase + cubeBase * cubeBase * cubeBase), unit: '' }
            ],
            finalAnswer: String(sqBase * sqBase + cubeBase * cubeBase * cubeBase),
            altAnswers: []
          });

          const exp = randInt(3, 5);
          const mult = randInt(12, 48);
          const powVal = Math.pow(10, exp);
          questions.push({
            topic: 'Powers of 10',
            prompt: 'Calculate ' + mult + ' × 10^' + exp + ' in standard form.',
            svgHtml: makeSvgCard('Powers of 10 Place Value Shift', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#0f172a">' + mult + ' × 10^' + exp + '</text>'),
            steps: [
              { label: 'Step 1: Write 10^' + exp + ' as a whole number', expected: String(powVal), unit: '' },
              { label: 'Step 2: Multiply ' + mult + ' by ' + powVal, expected: String(mult * powVal), unit: '' }
            ],
            finalAnswer: String(mult * powVal),
            altAnswers: []
          });

          const negStart = -randInt(8, 18);
          const rise = randInt(12, 25);
          questions.push({
            topic: 'Negative Integers',
            prompt: 'Overnight in Queenstown the temperature was ' + negStart + '°C. By midday it rose by ' + rise + '°C. What is the midday temperature?',
            svgHtml: makeSvgCard('Integer Number Line', '<line x1="40" y1="85" x2="420" y2="85" stroke="#0f172a" stroke-width="2.5"/><circle cx="120" cy="85" r="7" fill="#2563eb"/><text x="120" y="112" text-anchor="middle" font-size="12" font-weight="800" fill="#1d4ed8">' + negStart + '°C</text><circle cx="230" cy="85" r="5" fill="#64748b"/><text x="230" y="112" text-anchor="middle" font-size="12" font-weight="700">0°C</text><path d="M 120 75 Q 230 35 340 75" fill="none" stroke="#16a34a" stroke-width="2.5"/><text x="230" y="50" text-anchor="middle" font-size="12" font-weight="800" fill="#15803d">+' + rise + '°C</text>'),
            steps: [
              { label: 'Step 1: Degrees needed to warm from ' + negStart + '°C up to 0°C', expected: String(Math.abs(negStart)), unit: '°C' },
              { label: 'Step 2: Calculate ' + negStart + ' + ' + rise, expected: String(negStart + rise), unit: '°C' }
            ],
            finalAnswer: String(negStart + rise),
            altAnswers: [String(negStart + rise) + '°c', String(negStart + rise) + 'c']
          });

          const nA = -randInt(3, 9);
          const nB = -randInt(4, 8);
          questions.push({
            topic: 'Negative Integer Multiplication',
            prompt: 'Evaluate (' + nA + ') × (' + nB + ') − 10.',
            svgHtml: makeSvgCard('Sign Rules: (−) × (−) = (+)', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#1e293b">(' + nA + ') × (' + nB + ') − 10</text>'),
            steps: [
              { label: 'Step 1: Multiply (' + nA + ') × (' + nB + ') (two negatives make a positive)', expected: String(nA * nB), unit: '' },
              { label: 'Step 2: Subtract 10 from ' + (nA * nB), expected: String(nA * nB - 10), unit: '' }
            ],
            finalAnswer: String(nA * nB - 10),
            altAnswers: []
          });

          const numQ = randInt(3, 7);
          questions.push({
            topic: 'Rational Numbers',
            prompt: 'Express the rational fraction ' + numQ + '/8 as a decimal.',
            svgHtml: makeSvgCard('Rational Number Conversion', '<text x="230" y="88" text-anchor="middle" font-size="24" font-weight="800" fill="#0369a1">' + numQ + ' / 8 = ?</text>'),
            steps: [
              { label: 'Step 1: Recall or calculate 1/8 as a decimal (1 ÷ 8)', expected: '0.125', unit: '' },
              { label: 'Step 2: Multiply 0.125 × ' + numQ, expected: String(numQ * 0.125), unit: '' }
            ],
            finalAnswer: String(numQ * 0.125),
            altAnswers: []
          });

          const cNum = randInt(4, 9) * 5;
          questions.push({
            topic: 'Prime & Composite Classification',
            prompt: 'Find the smallest prime factor of ' + cNum + ' and divide ' + cNum + ' by 5.',
            svgHtml: makeSvgCard('Composite Number Analysis: ' + cNum, '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">' + cNum + ' = 5 × ?</text>'),
            steps: [
              { label: 'Step 1: Divide ' + cNum + ' ÷ 5', expected: String(cNum / 5), unit: '' },
              { label: 'Step 2: Sum of 5 + ' + (cNum / 5), expected: String(5 + cNum / 5), unit: '' }
            ],
            finalAnswer: String(5 + cNum / 5),
            altAnswers: [String(cNum / 5)]
          });

          const sqRootTarget = [64, 81, 100, 121, 144][(2 + off) % 5];
          const rootAns = Math.round(Math.sqrt(sqRootTarget));
          questions.push({
            topic: 'Square Roots & Squares',
            prompt: 'Find √' + sqRootTarget + ' + 4².',
            svgHtml: makeSvgCard('Roots and Exponents', '<text x="230" y="88" text-anchor="middle" font-size="24" font-weight="800">√' + sqRootTarget + ' + 4²</text>'),
            steps: [
              { label: 'Step 1: Evaluate √' + sqRootTarget, expected: String(rootAns), unit: '' },
              { label: 'Step 2: Evaluate 4² (4 × 4)', expected: '16', unit: '' },
              { label: 'Step 3: Add ' + rootAns + ' + 16', expected: String(rootAns + 16), unit: '' }
            ],
            finalAnswer: String(rootAns + 16),
            altAnswers: []
          });

          const sciDec = randInt(2, 9);
          questions.push({
            topic: 'Powers of 10 & Standard Form',
            prompt: 'Evaluate (' + sciDec + ' × 10⁴) ÷ 10².',
            svgHtml: makeSvgCard('Dividing Powers of 10', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">(' + sciDec + ' × 10⁴) ÷ 10²</text>'),
            steps: [
              { label: 'Step 1: Subtract exponents for 10⁴ ÷ 10² → 10 to the power of?', expected: '2', unit: '' },
              { label: 'Step 2: Calculate ' + sciDec + ' × 10²', expected: String(sciDec * 100), unit: '' }
            ],
            finalAnswer: String(sciDec * 100),
            altAnswers: []
          });

          const tempDrop = randInt(6, 15);
          questions.push({
            topic: 'Negative Integers in Context',
            prompt: 'A submarine is at −25 metres. It dives another ' + tempDrop + ' metres deeper. What is its new depth as a negative integer?',
            svgHtml: makeSvgCard('Depth Below Sea Level (0 m)', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">−25 m − ' + tempDrop + ' m = ? m</text>'),
            steps: [
              { label: 'Step 1: Add the distances below zero (25 + ' + tempDrop + ')', expected: String(25 + tempDrop), unit: 'm' },
              { label: 'Step 2: Write the new depth with a negative sign', expected: '-' + String(25 + tempDrop), unit: 'm' }
            ],
            finalAnswer: '-' + String(25 + tempDrop),
            altAnswers: ['-' + String(25 + tempDrop) + 'm']
          });

          return questions;
        }

        if (moduleId === 'num_ops') {
          for (let i = 0; i < 10; i++) {
            if (i % 3 === 0) {
              const whole = randInt(2, 5);
              const num = randInt(1, 3);
              const den = 4;
              const impNum = whole * den + num;
              questions.push({
                topic: 'Fractions & Mixed Numbers',
                prompt: 'Convert the mixed number ' + whole + ' ' + num + '/' + den + ' into an improper fraction, then state the numerator.',
                svgHtml: makeSvgCard('Mixed Number → Improper Fraction', '<text x="230" y="88" text-anchor="middle" font-size="24" font-weight="800">' + whole + '  ' + num + '/' + den + ' = ? / ' + den + '</text>'),
                steps: [
                  { label: 'Step 1: Multiply whole number by denominator (' + whole + ' × ' + den + ')', expected: String(whole * den), unit: '' },
                  { label: 'Step 2: Add numerator (' + (whole * den) + ' + ' + num + ')', expected: String(impNum), unit: '/' + den }
                ],
                finalAnswer: impNum + '/' + den,
                altAnswers: [String(impNum), String(impNum / den)]
              });
            } else if (i % 3 === 1) {
              const d1 = (randInt(12, 65) / 10).toFixed(1);
              const d2 = (randInt(15, 45) / 10).toFixed(1);
              const sumStr = (parseFloat(d1) + parseFloat(d2)).toFixed(1).replace(/\.0$/, '');
              const prodTen = (parseFloat(sumStr) * 2).toFixed(1).replace(/\.0$/, '');
              questions.push({
                topic: 'Decimals Fluency',
                prompt: 'Calculate (' + d1 + ' + ' + d2 + ') × 2.',
                svgHtml: makeSvgCard('Decimal Operations', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">(' + d1 + ' + ' + d2 + ') × 2</text>'),
                steps: [
                  { label: 'Step 1: Add the decimals ' + d1 + ' + ' + d2, expected: sumStr, unit: '' },
                  { label: 'Step 2: Multiply ' + sumStr + ' × 2', expected: prodTen, unit: '' }
                ],
                finalAnswer: prodTen,
                altAnswers: [prodTen + '.0']
              });
            } else {
              const pctChoices = [15, 20, 25, 35, 40, 60, 75, 80];
              const pct = pctChoices[(i + off) % pctChoices.length];
              const total = randInt(2, 8) * 20;
              const ans = (pct / 100) * total;
              questions.push({
                topic: 'Percentage Conversions',
                prompt: 'Convert ' + pct + '% to a decimal and find ' + pct + '% of ' + total + '.',
                svgHtml: makeSvgCard('Percentage ↔ Decimal Fluency', '<rect x="50" y="55" width="360" height="28" rx="6" fill="#e2e8f0"/><rect x="50" y="55" width="' + (3.6 * pct) + '" height="28" rx="6" fill="#0284c7"/><text x="230" y="115" text-anchor="middle" font-size="14" font-weight="800">' + pct + '% of ' + total + '</text>'),
                steps: [
                  { label: 'Step 1: Write ' + pct + '% as a decimal (' + pct + ' ÷ 100)', expected: String(pct / 100), unit: '' },
                  { label: 'Step 2: Multiply ' + (pct / 100) + ' × ' + total, expected: String(ans), unit: '' }
                ],
                finalAnswer: String(ans),
                altAnswers: []
              });
            }
          }
          return questions;
        }

        if (moduleId === 'num_prop') {
          for (let i = 0; i < 10; i++) {
            if (i % 3 === 0) {
              const rA = randInt(2, 5);
              const rB = randInt(3, 7);
              const mult = randInt(4, 9);
              const total = (rA + rB) * mult;
              questions.push({
                topic: 'Ratios & Sharing',
                prompt: 'Share $' + total + ' in the ratio ' + rA + ' : ' + rB + '. Find the larger share.',
                svgHtml: makeSvgCard('Ratio Bar Model (' + rA + ' : ' + rB + ')', '<text x="230" y="82" text-anchor="middle" font-size="20" font-weight="800">Total = $' + total + '   |   Ratio = ' + rA + ' : ' + rB + '</text>'),
                steps: [
                  { label: 'Step 1: Add the ratio parts (' + rA + ' + ' + rB + ')', expected: String(rA + rB), unit: 'parts' },
                  { label: 'Step 2: Value of 1 part ($' + total + ' ÷ ' + (rA + rB) + ')', expected: String(mult), unit: '$' },
                  { label: 'Step 3: Multiply 1 part by the larger share (' + Math.max(rA, rB) + ' × ' + mult + ')', expected: String(Math.max(rA, rB) * mult), unit: '$' }
                ],
                finalAnswer: String(Math.max(rA, rB) * mult),
                altAnswers: ['$' + String(Math.max(rA, rB) * mult)]
              });
            } else if (i % 3 === 1) {
              const speed = randInt(6, 11) * 10;
              const hrs = randInt(3, 6);
              questions.push({
                topic: 'Rates & Proportional Relationships',
                prompt: 'A car travels ' + (speed * 2) + ' km in 2 hours at a constant speed. How far will it travel in ' + hrs + ' hours?',
                svgHtml: makeSvgCard('Unit Rate Calculation', '<text x="230" y="85" text-anchor="middle" font-size="18" font-weight="800">' + (speed * 2) + ' km in 2 hrs  →  ? km in ' + hrs + ' hrs</text>'),
                steps: [
                  { label: 'Step 1: Find the unit rate in km/h (' + (speed * 2) + ' ÷ 2)', expected: String(speed), unit: 'km/h' },
                  { label: 'Step 2: Multiply speed by ' + hrs + ' hours', expected: String(speed * hrs), unit: 'km' }
                ],
                finalAnswer: String(speed * hrs),
                altAnswers: [String(speed * hrs) + 'km']
              });
            } else {
              const price = randInt(2, 9) * 20;
              const gst = (price * 0.15);
              questions.push({
                topic: 'Financial Applications (NZ 15% GST)',
                prompt: 'An item costs $' + price + ' before tax. Add New Zealand 15% GST to find the final price.',
                svgHtml: makeSvgCard('Financial Maths: +15% NZ GST', '<text x="230" y="85" text-anchor="middle" font-size="19" font-weight="800">Base Price: $' + price + '  +  15% GST</text>'),
                steps: [
                  { label: 'Step 1: Calculate 15% GST ($' + price + ' × 0.15)', expected: String(gst), unit: '$' },
                  { label: 'Step 2: Add GST to base price ($' + price + ' + $' + gst + ')', expected: String(price + gst), unit: '$' }
                ],
                finalAnswer: String(price + gst),
                altAnswers: ['$' + String(price + gst)]
              });
            }
          }
          return questions;
        }

        if (moduleId === 'alg_expr') {
          for (let i = 0; i < 10; i++) {
            const a = randInt(3, 8);
            const b = randInt(2, 6);
            const c = randInt(4, 9);
            if (i % 3 === 0) {
              questions.push({
                topic: 'Writing Algebraic Expressions',
                prompt: 'Write an algebraic expression for: "' + a + ' times a number x, plus ' + c + '", and evaluate it when x = 2.',
                svgHtml: makeSvgCard('Writing Expressions from Words', '<text x="230" y="85" text-anchor="middle" font-size="19" font-weight="800" fill="#0284c7">"' + a + ' times x, increased by ' + c + '"  →  ' + a + 'x + ' + c + '</text>'),
                steps: [
                  { label: 'Step 1: Coefficient of x ("' + a + ' times x")', expected: String(a), unit: 'x' },
                  { label: 'Step 2: Evaluate ' + a + '(2) + ' + c + ' when x = 2', expected: String(a * 2 + c), unit: '' }
                ],
                finalAnswer: a + 'x+' + c,
                altAnswers: [a + 'x + ' + c, String(a * 2 + c)]
              });
            } else if (i % 3 === 1) {
              questions.push({
                topic: 'Simplifying Expressions',
                prompt: 'Simplify the expression ' + a + 'x + ' + c + ' + ' + b + 'x + 5 by combining like terms.',
                svgHtml: makeSvgCard('Collecting Like Terms', '<text x="230" y="85" text-anchor="middle" font-size="21" font-weight="800" fill="#4f46e5">' + a + 'x + ' + c + ' + ' + b + 'x + 5</text>'),
                steps: [
                  { label: 'Step 1: Combine the x coefficients (' + a + ' + ' + b + ')', expected: String(a + b), unit: 'x' },
                  { label: 'Step 2: Combine the constant numbers (' + c + ' + 5)', expected: String(c + 5), unit: '' }
                ],
                finalAnswer: (a + b) + 'x+' + (c + 5),
                altAnswers: [(a + b) + 'x + ' + (c + 5)]
              });
            } else {
              const factor = randInt(3, 7);
              const insideC = randInt(2, 6);
              questions.push({
                topic: 'Factorising Expressions',
                prompt: 'Factorise ' + factor + 'x + ' + (factor * insideC) + ' into the form k(x + c).',
                svgHtml: makeSvgCard('Highest Common Factor (HCF)', '<text x="230" y="85" text-anchor="middle" font-size="22" font-weight="800" fill="#0369a1">' + factor + 'x + ' + (factor * insideC) + ' = ?(x + ?)</text>'),
                steps: [
                  { label: 'Step 1: Find the highest common factor (HCF) of ' + factor + ' and ' + (factor * insideC), expected: String(factor), unit: '' },
                  { label: 'Step 2: Divide ' + (factor * insideC) + ' ÷ ' + factor + ' for the constant inside the brackets', expected: String(insideC), unit: '' }
                ],
                finalAnswer: factor + '(x+' + insideC + ')',
                altAnswers: [factor + '(x + ' + insideC + ')']
              });
            }
          }
          return questions;
        }

        if (moduleId === 'alg_linear') {
          for (let i = 0; i < 10; i++) {
            const m = randInt(2, 6);
            const xVal = randInt(3, 11);
            const c = randInt(4, 15);
            const rhs = m * xVal + c;
            if (i % 3 !== 2) {
              questions.push({
                topic: i % 3 === 0 ? 'Two-Step Linear Equations' : 'Linear Inequalities',
                prompt: i % 3 === 0
                  ? ('Solve the linear equation ' + m + 'x + ' + c + ' = ' + rhs + ' for x.')
                  : ('Solve the inequality ' + m + 'x + ' + c + ' > ' + rhs + '. Find the boundary value of x.'),
                svgHtml: makeSvgCard('Algebraic Balance Model', '<text x="230" y="85" text-anchor="middle" font-size="22" font-weight="800">' + m + 'x + ' + c + (i % 3 === 0 ? ' = ' : ' > ') + rhs + '</text>'),
                steps: [
                  { label: 'Step 1: Subtract ' + c + ' from both sides (' + rhs + ' − ' + c + ')', expected: String(rhs - c), unit: '' },
                  { label: 'Step 2: Divide both sides by ' + m + ' (' + (rhs - c) + ' ÷ ' + m + ')', expected: String(xVal), unit: '' }
                ],
                finalAnswer: String(xVal),
                altAnswers: ['x=' + xVal]
              });
            } else {
              questions.push({
                topic: 'Formula Substitution',
                prompt: 'Given the formula y = ' + m + 'x + ' + c + ', substitute x = ' + xVal + ' to find y.',
                svgHtml: makeSvgCard('Formula Substitution: x = ' + xVal, '<text x="230" y="85" text-anchor="middle" font-size="22" font-weight="800">y = ' + m + '(' + xVal + ') + ' + c + '</text>'),
                steps: [
                  { label: 'Step 1: Multiply ' + m + ' × ' + xVal, expected: String(m * xVal), unit: '' },
                  { label: 'Step 2: Add ' + (m * xVal) + ' + ' + c, expected: String(rhs), unit: '' }
                ],
                finalAnswer: String(rhs),
                altAnswers: ['y=' + rhs]
              });
            }
          }
          return questions;
        }

        if (moduleId === 'alg_patterns') {
          for (let i = 0; i < 10; i++) {
            if (i % 3 === 2) {
              const x1 = randInt(1, 5);
              const y1 = randInt(2, 6);
              const dx = randInt(3, 7);
              const x2 = x1 + dx;
              questions.push({
                topic: 'Cartesian Coordinate Plane',
                prompt: 'Point A is plotted at (' + x1 + ', ' + y1 + ') and Point B is at (' + x2 + ', ' + y1 + ') on the Cartesian plane. Find the horizontal distance between A and B.',
                svgHtml: makeSvgCard('Cartesian Coordinate Grid (x, y)', '<line x1="80" y1="125" x2="380" y2="125" stroke="#0f172a" stroke-width="2"/><line x1="80" y1="35" x2="80" y2="125" stroke="#0f172a" stroke-width="2"/><circle cx="150" cy="75" r="6" fill="#2563eb"/><text x="150" y="62" text-anchor="middle" font-size="12" font-weight="800">A(' + x1 + ',' + y1 + ')</text><circle cx="310" cy="75" r="6" fill="#16a34a"/><text x="310" y="62" text-anchor="middle" font-size="12" font-weight="800">B(' + x2 + ',' + y1 + ')</text><line x1="150" y1="75" x2="310" y2="75" stroke="#dc2626" stroke-dasharray="4" stroke-width="2"/>'),
                steps: [
                  { label: 'Step 1: Identify the x-coordinate of Point B', expected: String(x2), unit: '' },
                  { label: 'Step 2: Subtract the x-coordinates (' + x2 + ' − ' + x1 + ')', expected: String(dx), unit: 'units' }
                ],
                finalAnswer: String(dx),
                altAnswers: [String(dx) + 'units']
              });
              continue;
            }
            const diff = randInt(3, 7);
            const first = randInt(2, 9);
            const c = first - diff;
            const targetN = randInt(10, 20);
            const termN = diff * targetN + c;
            questions.push({
              topic: i % 3 === 0 ? 'Growing Patterns' : 'Linear Sequences',
              prompt: 'A linear sequence begins: ' + first + ', ' + (first + diff) + ', ' + (first + 2 * diff) + ', ' + (first + 3 * diff) + '... Find the ' + targetN + 'th term (T_' + targetN + ').',
              svgHtml: makeSvgCard('Sequence & Coordinate Rule: T_n = ' + diff + 'n + ' + c, '<text x="230" y="85" text-anchor="middle" font-size="20" font-weight="800">n = 1 → ' + first + '   |   n = 2 → ' + (first + diff) + '   |   n = 3 → ' + (first + 2 * diff) + '</text>'),
              steps: [
                { label: 'Step 1: Find the constant step difference between consecutive terms', expected: String(diff), unit: '' },
                { label: 'Step 2: Calculate ' + diff + ' × ' + targetN + ' + (' + c + ') for the ' + targetN + 'th term', expected: String(termN), unit: '' }
              ],
              finalAnswer: String(termN),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'meas_units') {
          for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
              const km = (randInt(12, 85) / 10).toFixed(1);
              const mVal = Math.round(parseFloat(km) * 1000);
              questions.push({
                topic: 'Metric Length Conversions',
                prompt: 'Convert ' + km + ' km to metres (m), then to centimetres (cm). State the value in metres.',
                svgHtml: makeSvgCard('Metric Ladder: km × 1000 → m × 100 → cm', '<text x="230" y="85" text-anchor="middle" font-size="22" font-weight="800">' + km + ' km = ? m</text>'),
                steps: [
                  { label: 'Step 1: Multiply ' + km + ' × 1000 to convert km to m', expected: String(mVal), unit: 'm' },
                  { label: 'Step 2: Multiply ' + mVal + ' × 100 to convert m to cm', expected: String(mVal * 100), unit: 'cm' }
                ],
                finalAnswer: String(mVal),
                altAnswers: [String(mVal) + 'm', String(mVal * 100)]
              });
            } else {
              const litres = (randInt(15, 75) / 10).toFixed(1);
              const mlVal = Math.round(parseFloat(litres) * 1000);
              questions.push({
                topic: 'Capacity & Volume (L, mL, cm³)',
                prompt: 'A container holds ' + litres + ' Litres of water. Convert this capacity to millilitres (mL) and cm³.',
                svgHtml: makeSvgCard('Capacity Conversion: 1 L = 1000 mL = 1000 cm³', '<text x="230" y="85" text-anchor="middle" font-size="22" font-weight="800">' + litres + ' L = ? mL = ? cm³</text>'),
                steps: [
                  { label: 'Step 1: Multiply ' + litres + ' L × 1000 to get mL', expected: String(mlVal), unit: 'mL' },
                  { label: 'Step 2: Since 1 mL = 1 cm³, write the volume in cm³', expected: String(mlVal), unit: 'cm³' }
                ],
                finalAnswer: String(mlVal),
                altAnswers: [String(mlVal) + 'ml', String(mlVal) + 'cm3']
              });
            }
          }
          return questions;
        }

        if (moduleId === 'meas_area_vol') {
          for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
              const a = randInt(6, 12);
              const b = a + randInt(4, 8);
              const h = randInt(4, 9) * 2;
              const area = ((a + b) / 2) * h;
              questions.push({
                topic: 'Area of a Trapezium',
                prompt: 'Find the area of a trapezium with parallel sides a = ' + a + ' cm, b = ' + b + ' cm, and height h = ' + h + ' cm.',
                svgHtml: makeSvgCard('Trapezium: Area = ½(a + b) × h', '<polygon points="150,45 310,45 350,120 110,120" fill="#dbeafe" stroke="#0284c7" stroke-width="2.5"/><text x="230" y="40" text-anchor="middle" font-size="12" font-weight="800">a = ' + a + ' cm</text><text x="230" y="136" text-anchor="middle" font-size="12" font-weight="800">b = ' + b + ' cm</text><line x1="150" y1="45" x2="150" y2="120" stroke="#dc2626" stroke-dasharray="4"/><text x="182" y="86" font-size="12" font-weight="800" fill="#dc2626">h = ' + h + ' cm</text>'),
                steps: [
                  { label: 'Step 1: Add the parallel sides (' + a + ' + ' + b + ')', expected: String(a + b), unit: 'cm' },
                  { label: 'Step 2: Multiply (' + (a + b) + ' × ' + h + ') ÷ 2', expected: String(area), unit: 'cm²' }
                ],
                finalAnswer: String(area),
                altAnswers: [String(area) + 'cm2']
              });
            } else {
              const l = randInt(5, 10);
              const w = randInt(4, 8);
              const h = randInt(6, 12);
              const baseArea = l * w;
              const vol = baseArea * h;
              questions.push({
                topic: 'Volume of Prisms & Cylinders',
                prompt: 'Find the volume of a rectangular prism with length ' + l + ' cm, width ' + w + ' cm, and height ' + h + ' cm.',
                svgHtml: makeSvgCard('Prism Volume = Base Area × Height', '<rect x="150" y="50" width="140" height="70" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/><text x="220" y="90" text-anchor="middle" font-size="13" font-weight="800">' + l + ' cm × ' + w + ' cm × ' + h + ' cm</text>'),
                steps: [
                  { label: 'Step 1: Calculate the base area (' + l + ' × ' + w + ')', expected: String(baseArea), unit: 'cm²' },
                  { label: 'Step 2: Multiply base area by height (' + baseArea + ' × ' + h + ')', expected: String(vol), unit: 'cm³' }
                ],
                finalAnswer: String(vol),
                altAnswers: [String(vol) + 'cm3']
              });
            }
          }
          return questions;
        }

        if (moduleId === 'meas_time') {
          for (let i = 0; i < 10; i++) {
            const depHr = randInt(8, 14);
            const durHrs = randInt(1, 3);
            const durMins = [15, 25, 35, 45][i % 4];
            const totalMins = durHrs * 60 + durMins;
            questions.push({
              topic: 'Practical Time, Schedules & Timetables',
              prompt: 'A train departs at ' + String(depHr).padStart(2, '0') + ':10 and travels for ' + durHrs + ' hours and ' + durMins + ' minutes. How many total minutes is the journey?',
              svgHtml: makeSvgCard('Timetable & Elapsed Time', '<text x="230" y="85" text-anchor="middle" font-size="18" font-weight="800">Departs ' + String(depHr).padStart(2, '0') + ':10  |  Duration: ' + durHrs + ' hr ' + durMins + ' min</text>'),
              steps: [
                { label: 'Step 1: Convert ' + durHrs + ' hours into minutes (' + durHrs + ' × 60)', expected: String(durHrs * 60), unit: 'mins' },
                { label: 'Step 2: Add the remaining ' + durMins + ' minutes', expected: String(totalMins), unit: 'mins' }
              ],
              finalAnswer: String(totalMins),
              altAnswers: [String(totalMins) + 'mins', String(totalMins) + 'min']
            });
          }
          return questions;
        }

        if (moduleId === 'geom_shapes') {
          for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
              const r = randInt(3, 12);
              const d = r * 2;
              const circ = d * 3;
              questions.push({
                topic: 'Circle Parts (Radius, Diameter, Circumference)',
                prompt: 'A circle has radius r = ' + r + ' cm. Find its diameter d and approximate circumference C (using π ≈ 3).',
                svgHtml: makeSvgCard('Circle Geometry (π ≈ 3)', '<circle cx="230" cy="82" r="45" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/><line x1="230" y1="82" x2="275" y2="82" stroke="#dc2626" stroke-width="2.5"/><text x="252" y="74" text-anchor="middle" font-size="12" font-weight="800" fill="#dc2626">r=' + r + '</text>'),
                steps: [
                  { label: 'Step 1: Find the diameter d = 2 × ' + r, expected: String(d), unit: 'cm' },
                  { label: 'Step 2: Calculate C ≈ 3 × ' + d, expected: String(circ), unit: 'cm' }
                ],
                finalAnswer: String(circ),
                altAnswers: [String(circ) + 'cm']
              });
            } else {
              const a1 = randInt(45, 75);
              const a2 = randInt(40, 65);
              const a3 = 180 - a1 - a2;
              questions.push({
                topic: 'Polygon & Triangle Angles',
                prompt: 'A triangle has interior angles of ' + a1 + '° and ' + a2 + '°. Find the missing third angle x°.',
                svgHtml: makeSvgCard('Interior Angles of a Triangle = 180°', '<polygon points="140,120 320,120 210,42" fill="#ede9fe" stroke="#6d28d9" stroke-width="2.5"/><text x="230" y="105" text-anchor="middle" font-size="13" font-weight="800">' + a1 + '° + ' + a2 + '° + x° = 180°</text>'),
                steps: [
                  { label: 'Step 1: Add the two known angles (' + a1 + '° + ' + a2 + '°)', expected: String(a1 + a2), unit: '°' },
                  { label: 'Step 2: Subtract from 180° (180 − ' + (a1 + a2) + ')', expected: String(a3), unit: '°' }
                ],
                finalAnswer: String(a3),
                altAnswers: [String(a3) + '°']
              });
            }
          }
          return questions;
        }

        if (moduleId === 'geom_trans') {
          for (let i = 0; i < 10; i++) {
            if (i % 3 === 1) {
              const px = randInt(2, 8);
              const py = randInt(3, 9);
              const shiftX = randInt(3, 6);
              const shiftY = randInt(2, 5);
              questions.push({
                topic: 'Reflections, Rotations & Translations',
                prompt: 'Point P(' + px + ', ' + py + ') is translated ' + shiftX + ' units right and ' + shiftY + ' units up. Find the sum of its new coordinates (x_new + y_new).',
                svgHtml: makeSvgCard('Translation Vector: (+' + shiftX + ', +' + shiftY + ')', '<text x="230" y="88" text-anchor="middle" font-size="18" font-weight="800">P(' + px + ', ' + py + ')  →  P_new(' + px + '+' + shiftX + ', ' + py + '+' + shiftY + ')</text>'),
                steps: [
                  { label: 'Step 1: Find the new x-coordinate (' + px + ' + ' + shiftX + ')', expected: String(px + shiftX), unit: '' },
                  { label: 'Step 2: Find the new y-coordinate (' + py + ' + ' + shiftY + ')', expected: String(py + shiftY), unit: '' },
                  { label: 'Step 3: Add the new coordinates together', expected: String(px + shiftX + py + shiftY), unit: '' }
                ],
                finalAnswer: String(px + shiftX + py + shiftY),
                altAnswers: ['(' + (px + shiftX) + ',' + (py + shiftY) + ')']
              });
              continue;
            }
            if (i % 3 === 2) {
              const mapCm = randInt(3, 9);
              const scaleKmPerCm = randInt(2, 6);
              questions.push({
                topic: 'Map Scales & Grid References',
                prompt: 'A hiking map has a scale where 1 cm represents ' + scaleKmPerCm + ' km (1 : ' + (scaleKmPerCm * 100000) + '). Two huts are ' + mapCm + ' cm apart on the map. Find the actual distance in km.',
                svgHtml: makeSvgCard('Map Scale: 1 cm : ' + scaleKmPerCm + ' km', '<line x1="90" y1="85" x2="370" y2="85" stroke="#0284c7" stroke-width="3"/><circle cx="90" cy="85" r="6" fill="#dc2626"/><circle cx="370" cy="85" r="6" fill="#dc2626"/><text x="230" y="72" text-anchor="middle" font-size="14" font-weight="800">Map Distance = ' + mapCm + ' cm</text>'),
                steps: [
                  { label: 'Step 1: Real distance for 1 cm on the map', expected: String(scaleKmPerCm), unit: 'km' },
                  { label: 'Step 2: Multiply ' + mapCm + ' cm × ' + scaleKmPerCm + ' km/cm', expected: String(mapCm * scaleKmPerCm), unit: 'km' }
                ],
                finalAnswer: String(mapCm * scaleKmPerCm),
                altAnswers: [String(mapCm * scaleKmPerCm) + 'km']
              });
              continue;
            }
            const origLen = randInt(4, 11);
            const sf = randInt(2, 5);
            const newLen = origLen * sf;
            const areaFactor = sf * sf;
            questions.push({
              topic: 'Transformations & Scale Factor Enlargements',
              prompt: 'A shape with side length ' + origLen + ' cm is enlarged by a scale factor of k = ' + sf + '. Find the enlarged side length.',
              svgHtml: makeSvgCard('Enlargement by Scale Factor k = ' + sf, '<rect x="110" y="65" width="40" height="40" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><text x="130" y="122" text-anchor="middle" font-size="11" font-weight="800">' + origLen + ' cm</text><text x="205" y="90" font-size="18" font-weight="900">→ ×' + sf + ' →</text><rect x="265" y="45" width="70" height="70" fill="#dcfce7" stroke="#16a34a" stroke-width="2.5"/><text x="300" y="85" text-anchor="middle" font-size="13" font-weight="800">? cm</text>'),
              steps: [
                { label: 'Step 1: Multiply original side ' + origLen + ' cm by scale factor ' + sf, expected: String(newLen), unit: 'cm' },
                { label: 'Step 2: By what factor does the AREA increase (k² = ' + sf + '²)?', expected: String(areaFactor), unit: 'times' }
              ],
              finalAnswer: String(newLen),
              altAnswers: [String(newLen) + 'cm']
            });
          }
          return questions;
        }

        if (moduleId === 'stat_enquiry') {
          for (let i = 0; i < 10; i++) {
            const samplePct = [10, 20, 25][i % 3];
            const popSize = randInt(3, 8) * 100;
            const sampleSize = (samplePct / 100) * popSize;
            questions.push({
              topic: 'Statistical Enquiry & Sampling',
              prompt: 'A school has ' + popSize + ' students. For a PPDAC statistical investigation, you survey a ' + samplePct + '% random sample. How many students are surveyed?',
              svgHtml: makeSvgCard('PPDAC Statistical Enquiry Cycle', '<text x="230" y="82" text-anchor="middle" font-size="16" font-weight="800">Problem → Plan → Data → Analysis → Conclusion</text><text x="230" y="110" text-anchor="middle" font-size="14" font-weight="700" fill="#0284c7">Population = ' + popSize + '  |  Sample = ' + samplePct + '%</text>'),
              steps: [
                { label: 'Step 1: Write ' + samplePct + '% as a decimal (' + samplePct + ' ÷ 100)', expected: String(samplePct / 100), unit: '' },
                { label: 'Step 2: Multiply ' + (samplePct / 100) + ' × ' + popSize + ' students', expected: String(sampleSize), unit: 'students' }
              ],
              finalAnswer: String(sampleSize),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'stat_analysis') {
          for (let i = 0; i < 10; i++) {
            const base = randInt(4, 12);
            const arr = [base, base + 2, base + 2, base + 4, base + 7];
            const sum = arr.reduce(function (a, b) { return a + b; }, 0);
            const mean = sum / 5;
            const range = arr[4] - arr[0];
            questions.push({
              topic: 'Mean, Median, Mode & Range',
              prompt: 'Find the mean and range of the ordered dataset: ' + arr.join(', ') + '. State the mean as your final answer.',
              svgHtml: makeSvgCard('Dataset: [' + arr.join(', ') + ']', '<text x="230" y="80" text-anchor="middle" font-size="18" font-weight="800">Values: ' + arr.join('  ,  ') + '</text><text x="230" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="#0369a1">Median = ' + arr[2] + '  |  Mode = ' + arr[1] + '</text>'),
              steps: [
                { label: 'Step 1: Add all 5 data values together', expected: String(sum), unit: '' },
                { label: 'Step 2: Divide the sum by 5 to find the Mean (' + sum + ' ÷ 5)', expected: String(mean), unit: '' },
                { label: 'Step 3: Calculate the Range (Max ' + arr[4] + ' − Min ' + arr[0] + ')', expected: String(range), unit: '' }
              ],
              finalAnswer: String(mean),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'stat_trends') {
          for (let i = 0; i < 10; i++) {
            const b = randInt(10, 18);
            const outlier = b + 40;
            const arr = [b, b + 1, b + 2, b + 3, outlier];
            const sumWith = arr.reduce(function (x, y) { return x + y; }, 0);
            const meanWith = sumWith / 5;
            questions.push({
              topic: 'Outliers & Data Skewness',
              prompt: 'Consider the positively skewed dataset: ' + arr.join(', ') + '. Identify the outlier and calculate the mean of all 5 values.',
              svgHtml: makeSvgCard('Outlier & Positive (Right) Skewness', '<text x="230" y="82" text-anchor="middle" font-size="18" font-weight="800">Data: ' + arr.slice(0, 4).join(', ') + ',  [' + outlier + ']</text><text x="230" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="#dc2626">High outlier pulls the mean to the right (Positive Skew)</text>'),
              steps: [
                { label: 'Step 1: Identify the extreme high outlier value in the dataset', expected: String(outlier), unit: '' },
                { label: 'Step 2: Find the sum of all 5 numbers', expected: String(sumWith), unit: '' },
                { label: 'Step 3: Divide by 5 to find the Mean (' + sumWith + ' ÷ 5)', expected: String(meanWith), unit: '' }
              ],
              finalAnswer: String(meanWith),
              altAnswers: [String(outlier)]
            });
          }
          return questions;
        }

        if (moduleId === 'prob_exp') {
          for (let i = 0; i < 10; i++) {
            const trials = 50;
            const hits = randInt(12, 38);
            const relFreqDec = (hits / trials).toFixed(2).replace(/0$/, '');
            const expected200 = hits * 4;
            questions.push({
              topic: 'Experimental Probability & Law of Large Numbers',
              prompt: 'In ' + trials + ' spins of a spinner, Blue landed ' + hits + ' times. Find the experimental probability as a decimal, and predict how many times Blue will land in 200 spins.',
              svgHtml: makeSvgCard('Relative Frequency & Law of Large Numbers', '<text x="230" y="85" text-anchor="middle" font-size="18" font-weight="800">Observed: ' + hits + ' / ' + trials + ' spins   →   Scale to 200 spins</text>'),
              steps: [
                { label: 'Step 1: Experimental probability as a decimal (' + hits + ' ÷ ' + trials + ')', expected: String(hits / trials), unit: '' },
                { label: 'Step 2: Expected count in 200 spins (' + (hits / trials) + ' × 200)', expected: String(expected200), unit: 'times' }
              ],
              finalAnswer: String(expected200),
              altAnswers: [String(hits / trials), relFreqDec]
            });
          }
          return questions;
        }

        // Default / 'prob_theo': Theoretical Probability, Tree Diagrams, Sample Space, Complementary Events
        for (let i = 0; i < 10; i++) {
          const pPct = [20, 25, 30, 35, 40, 45, 60, 70, 75, 80][i % 10];
          const compPct = 100 - pPct;
          questions.push({
            topic: 'Theoretical Probability, Trees & Complementary Events',
            prompt: 'The probability of rain tomorrow is ' + (pPct / 100) + ' (' + pPct + '%). Find the complementary probability that it does NOT rain as a decimal.',
            svgHtml: makeSvgCard('Complementary Events: P(not A) = 1 − P(A)', '<line x1="120" y1="85" x2="240" y2="50" stroke="#0284c7" stroke-width="2.5"/><line x1="120" y1="85" x2="240" y2="120" stroke="#16a34a" stroke-width="2.5"/><text x="255" y="55" font-size="14" font-weight="800" fill="#0284c7">Rain = ' + (pPct / 100) + '</text><text x="255" y="124" font-size="14" font-weight="800" fill="#16a34a">No Rain = ?</text>'),
            steps: [
              { label: 'Step 1: Subtract ' + pPct + '% from 100% (100 − ' + pPct + ')', expected: String(compPct), unit: '%' },
              { label: 'Step 2: Write ' + compPct + '% as a decimal (' + compPct + ' ÷ 100)', expected: String(compPct / 100), unit: '' }
            ],
            finalAnswer: String(compPct / 100),
            altAnswers: [compPct + '%']
          });
        }
        return questions;
      }

      // Generate a mixed practice set across all curriculum modules.
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
        activeModuleTitle: '1A. Types of Numbers',
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
          state.activeModuleTitle = '25-Question Full Year ' + CURRENT_YEAR + ' NZ Curriculum Random Mix';
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
      const STRAND_META = {
        all: {
          title: 'Year ' + CURRENT_YEAR + ' New Zealand Mathematics Curriculum — All 6 Strands Hub',
          desc: 'Use the Strand Page tabs above to view each curriculum strand on its own separate page, or launch any 10-question sub-strand workbook below.'
        },
        number: {
          title: 'Page 1: Number Strand — Year ' + CURRENT_YEAR + ' NZ Curriculum',
          desc: 'Covers Types of Numbers (primes, squares/cubes, powers of 10, negative integers, rationals), Operations & Conversions, and Proportional Reasoning.'
        },
        algebra: {
          title: 'Page 2: Algebra Strand — Year ' + CURRENT_YEAR + ' NZ Curriculum',
          desc: 'Covers Expressions & Factorising, Linear Equations & Inequalities, Formula Substitution, Growing Patterns, Linear Sequences, and the Cartesian Coordinate Plane.'
        },
        measurement: {
          title: 'Page 3: Measurement Strand — Year ' + CURRENT_YEAR + ' NZ Curriculum',
          desc: 'Covers Metric Conversions (length, area, volume, capacity), Perimeter & Area of Composite Shapes/Trapeziums, Volume of Prisms/Cylinders, and Practical Time & Timetables.'
        },
        geometry: {
          title: 'Page 4: Geometry Strand — Year ' + CURRENT_YEAR + ' NZ Curriculum',
          desc: 'Covers Circle Parts (radius, diameter, circumference), Polygon/Triangle/Quadrilateral Angles, Transformations, Scale Enlargements, and Map Grids.'
        },
        statistics: {
          title: 'Page 5: Statistics Strand — Year ' + CURRENT_YEAR + ' NZ Curriculum',
          desc: 'Covers PPDAC Statistical Enquiry, Categorical/Numerical Variables, Data Displays, Mean/Median/Mode/Range, Outliers, and Positive/Negative Skewness.'
        },
        probability: {
          title: 'Page 6: Probability Strand — Year ' + CURRENT_YEAR + ' NZ Curriculum',
          desc: 'Covers Experimental Probability, Law of Large Numbers, Theoretical Probability, Tree Diagrams, Sample Space Diagrams, and Complementary Events.'
        }
      };

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
        printoutHeading.textContent = "📄 Year " + CURRENT_YEAR + " NZ Mathematics — " + state.activeModuleTitle + " Answer Key";
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
          s += 'BT /F2 13 Tf 42 798 Td (' + pdfEscapeText("Year " + CURRENT_YEAR + " NZ Mathematics Workbook - Answer Printout") + ') Tj ET\n';
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
        link.download = 'Year8_NZ_Math_Workbook_Answers.pdf';
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

