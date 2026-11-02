    (function () {
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
      // COMPLETE YEAR 8 NZ CURRICULUM CATALOG (6 STRANDS, 16 SUB-STRAND MODULES)
      // =========================================================================
      const CURRICULUM_MODULES = [
        {
                "id": "num_types",
                "strandId": "number",
                "strandName": "1. Number",
                "title": "1A. Fractional/Negative Exponents & Surds",
                "badge": "Year 11 (NCEA L1) \u2022 Number",
                "topics": [
                        "Fractional exponents (a^(m/n)) & negative powers",
                        "Exponential growth & decay models y = A \u00b7 r^t",
                        "Operating with scientific notation & surds"
                ]
        },
        {
                "id": "num_ops",
                "strandId": "number",
                "strandName": "1. Number",
                "title": "1B. NCEA Financial Maths (GST, Depreciation & Loans)",
                "badge": "Year 11 (NCEA L1) \u2022 Number",
                "topics": [
                        "Extracting GST component from inclusive price (\u00d7 3/23)",
                        "Compound interest & diminishing-value depreciation",
                        "Multi-stage percentage markups & discounts"
                ]
        },
        {
                "id": "num_prop",
                "strandId": "number",
                "strandName": "1. Number",
                "title": "1C. Proportional Optimization & Currency Commissions",
                "badge": "Year 11 (NCEA L1) \u2022 Number",
                "topics": [
                        "Combining multi-part ratios (A:B and B:C)",
                        "Foreign exchange conversions with bank commission fees",
                        "Cost optimization & budget comparisons"
                ]
        },
        {
                "id": "alg_expr",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2A. Non-Monic Quadratics & Algebraic Fractions",
                "badge": "Year 11 (NCEA L1) \u2022 Algebra",
                "topics": [
                        "Factorising quadratics ax\u00b2 + bx + c",
                        "Simplifying rational algebraic fractions",
                        "Index laws with algebraic variables"
                ]
        },
        {
                "id": "alg_linear",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2B. Simultaneous Equations & Quadratic Equations",
                "badge": "Year 11 (NCEA L1) \u2022 Algebra",
                "topics": [
                        "Solving pairs of simultaneous linear equations",
                        "Solving quadratic equations ax\u00b2 + bx + c = 0",
                        "Exponential equations (a^x = a^k) & rearranging"
                ]
        },
        {
                "id": "alg_patterns",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2C. Parabola Vertex/Factored Forms & Exponential Graphs",
                "badge": "Year 11 (NCEA L1) \u2022 Algebra",
                "topics": [
                        "Parabola vertex form y = a(x \u2212 h)\u00b2 + k & turning points",
                        "Factored form y = a(x \u2212 r\u2081)(x \u2212 r\u2082) & roots",
                        "Exponential growth graphs y = a \u00b7 b^x"
                ]
        },
        {
                "id": "meas_units",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3A. Flow Rates, Derived Units & Percentage Error",
                "badge": "Year 11 (NCEA L1) \u2022 Measurement",
                "topics": [
                        "Volumetric flow rates (L/min to fill 3D tanks)",
                        "Percentage error & cumulative bounds",
                        "Scale conversions in 2D area (k\u00b2) and 3D volume (k\u00b3)"
                ]
        },
        {
                "id": "meas_area_vol",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3B. Composite 3D Solids & Back-Solving Dimensions",
                "badge": "Year 11 (NCEA L1) \u2022 Measurement",
                "topics": [
                        "Composite solids (cylinder + hemisphere / cone)",
                        "Working backwards from volume to find radius or height",
                        "Total surface area of composite 3D objects"
                ]
        },
        {
                "id": "meas_time",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3C. Packaging Optimization & Piecewise Rate Schedules",
                "badge": "Year 11 (NCEA L1) \u2022 Measurement",
                "topics": [
                        "Minimising surface area for a fixed volume",
                        "Piecewise linear pricing & time schedules",
                        "Project critical path scheduling"
                ]
        },
        {
                "id": "geom_shapes",
                "strandId": "geometry",
                "strandName": "4. Geometry",
                "title": "4A. 3D Pythagoras, Trigonometry & Bearings Navigation",
                "badge": "Year 11 (NCEA L1) \u2022 Geometry",
                "topics": [
                        "3D space diagonals in cuboids (d = \u221a(l\u00b2 + w\u00b2 + h\u00b2))",
                        "Angles of elevation & depression with SOHCAHTOA",
                        "Multi-leg navigation with 3-figure bearings"
                ]
        },
        {
                "id": "geom_trans",
                "strandId": "geometry",
                "strandName": "4. Geometry",
                "title": "4B. Circle Theorems, Cyclic Quadrilaterals & Proofs",
                "badge": "Year 11 (NCEA L1) \u2022 Geometry",
                "topics": [
                        "Angle at centre = 2 \u00d7 angle at circumference",
                        "Opposite angles of a cyclic quadrilateral sum to 180\u00b0",
                        "Tangent perpendicular to radius (90\u00b0) & deductive proofs"
                ]
        },
        {
                "id": "stat_enquiry",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5A. Informal Confidence Intervals (\u00b11.5 IQR / \u221an)",
                "badge": "Year 11 (NCEA L1) \u2022 Statistics",
                "topics": [
                        "Calculating Informal Confidence Intervals (ICIs) for medians",
                        "Making a formal NCEA 'Call' using ICI overlap",
                        "Evaluating sample size impact on interval width"
                ]
        },
        {
                "id": "stat_analysis",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5B. Bivariate Regression Residuals & Subgroup Analysis",
                "badge": "Year 11 (NCEA L1) \u2022 Statistics",
                "topics": [
                        "Calculating residuals (Observed y \u2212 Predicted y)",
                        "Assessing linear model appropriateness & r-values",
                        "Subgroup clustering in bivariate scatter plots"
                ]
        },
        {
                "id": "stat_trends",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5C. Time Series Decomposition & Additive Forecasting",
                "badge": "Year 11 (NCEA L1) \u2022 Statistics",
                "topics": [
                        "Additive model: Forecast = Trend + Seasonal Effect",
                        "Deseasonalising time-series data",
                        "Evaluating forecast reliability"
                ]
        },
        {
                "id": "prob_exp",
                "strandId": "probability",
                "strandName": "6. Probability",
                "title": "6A. Relative Risk, Contingency Tables & Expected Payoff",
                "badge": "Year 11 (NCEA L1) \u2022 Probability",
                "topics": [
                        "Relative Risk RR = P(Event | Exposed) / P(Event | Baseline)",
                        "Expected net financial payoff in games of chance",
                        "Monte Carlo simulation analysis"
                ]
        },
        {
                "id": "prob_theo",
                "strandId": "probability",
                "strandName": "6. Probability",
                "title": "6B. Three-Stage Trees, Independence & Venn Logic",
                "badge": "Year 11 (NCEA L1) \u2022 Probability",
                "topics": [
                        "Testing independence: P(A \u2229 B) = P(A) \u00d7 P(B)",
                        "Conditional probability trees without replacement",
                        "Three-event Venn diagrams & algebraic probabilities"
                ]
        }
];

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
        const off = seedOffset || 0;
        const questions = [];

        if (moduleId === 'num_types') {
          const bases = [[8, 3, 2, 4], [27, 3, 2, 9], [16, 4, 3, 8], [25, 2, 3, 125], [64, 3, 2, 16]];
          for (let i = 0; i < 10; i++) {
            const item = bases[i % bases.length];
            const base = item[0];
            const rootN = item[1];
            const powM = item[2];
            const ans = item[3];
            const rootVal = Math.round(Math.pow(base, 1 / rootN));
            questions.push({
              topic: 'Fractional Exponents (a^(m/n))',
              prompt: 'Evaluate ' + base + '^(' + powM + '/' + rootN + ') without a calculator by finding the ' + rootN + 'th root first.',
              svgHtml: makeSvgCard('Fractional Power Rule: a^(m/n) = (ⁿ√a)^m', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">' + base + '^(' + powM + '/' + rootN + ') = (ⁿ√' + base + ')^' + powM + '</text>'),
              steps: [
                { label: 'Step 1: Find the ' + rootN + 'th root of ' + base, expected: String(rootVal), unit: '' },
                { label: 'Step 2: Raise ' + rootVal + ' to the power of ' + powM + ' (' + rootVal + '^' + powM + ')', expected: String(ans), unit: '' }
              ],
              finalAnswer: String(ans),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'num_ops') {
          for (let i = 0; i < 10; i++) {
            const mult = randInt(2, 12) * 10;
            const gstInc = mult * 23;
            const gstPart = mult * 3;
            const exclPrice = mult * 20;
            questions.push({
              topic: 'NCEA Financial Maths: Extracting NZ 15% GST (× 3/23)',
              prompt: 'A commercial invoice is $' + gstInc + ' GST-inclusive (15% GST). Find the exact GST component ($' + gstInc + ' × 3 ÷ 23) and the GST-exclusive price.',
              svgHtml: makeSvgCard('NCEA GST Breakdown: Inclusive = 23 parts (20 Excl + 3 GST)', '<text x="230" y="88" text-anchor="middle" font-size="18" font-weight="800">Inclusive = $' + gstInc + '   →   1 part = $' + mult + '</text>'),
              steps: [
                { label: 'Step 1: Find the GST component ($' + gstInc + ' × 3 ÷ 23)', expected: String(gstPart), unit: '$' },
                { label: 'Step 2: Subtract GST from $' + gstInc + ' to get the GST-exclusive price', expected: String(exclPrice), unit: '$' }
              ],
              finalAnswer: String(exclPrice),
              altAnswers: ['$' + exclPrice, String(gstPart)]
            });
          }
          return questions;
        }

        if (moduleId === 'num_prop') {
          for (let i = 0; i < 10; i++) {
            const nzd = randInt(2, 9) * 500;
            const rate = 0.6;
            const usdBefore = nzd * rate;
            const feePct = 2;
            const netUsd = usdBefore * (1 - feePct / 100);
            questions.push({
              topic: 'Currency Exchange with Commission Fees',
              prompt: 'You convert $' + nzd + ' NZD to USD at an exchange rate of 1 NZD = 0.60 USD, and the bank deducts a 2% commission fee. Find the final USD received.',
              svgHtml: makeSvgCard('FX Conversion + 2% Commission Fee', '<text x="230" y="88" text-anchor="middle" font-size="18" font-weight="800">$' + nzd + ' NZD × 0.60 = $' + usdBefore + ' USD  (less 2% fee)</text>'),
              steps: [
                { label: 'Step 1: Convert $' + nzd + ' NZD × 0.60 to USD before fees', expected: String(usdBefore), unit: 'USD' },
                { label: 'Step 2: Subtract 2% commission (' + usdBefore + ' × 0.98)', expected: String(netUsd), unit: 'USD' }
              ],
              finalAnswer: String(netUsd),
              altAnswers: ['$' + netUsd]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_expr') {
          for (let i = 0; i < 10; i++) {
            const a = randInt(2, 7);
            questions.push({
              topic: 'Algebraic Fractions & Difference of Two Squares',
              prompt: 'Simplify the rational algebraic fraction (x² − ' + (a * a) + ') / (x − ' + a + ') for x ≠ ' + a + ', and evaluate the simplified expression when x = 10.',
              svgHtml: makeSvgCard('Difference of Two Squares: x² − a² = (x − a)(x + a)', '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">(x² − ' + (a * a) + ') / (x − ' + a + ') = x + ' + a + '</text>'),
              steps: [
                { label: 'Step 1: Factorise x² − ' + (a * a) + ' as (x − ' + a + ')(x + ?)', expected: String(a), unit: '' },
                { label: 'Step 2: Cancel (x − ' + a + ') and evaluate x + ' + a + ' at x = 10', expected: String(10 + a), unit: '' }
              ],
              finalAnswer: String(10 + a),
              altAnswers: ['x+' + a, 'x + ' + a]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_linear') {
          for (let i = 0; i < 10; i++) {
            const xVal = randInt(3, 9);
            const yVal = randInt(2, 7);
            const sumXY = xVal + yVal;
            const diffXY = xVal - yVal;
            questions.push({
              topic: 'Simultaneous Linear Equations (Elimination)',
              prompt: 'Solve the simultaneous equations: x + y = ' + sumXY + ' and x − y = ' + diffXY + '. Find the value of x.',
              svgHtml: makeSvgCard('Simultaneous Equations by Elimination', '<text x="230" y="75" text-anchor="middle" font-size="18" font-weight="800">(1)  x + y = ' + sumXY + '</text><text x="230" y="105" text-anchor="middle" font-size="18" font-weight="800">(2)  x − y = ' + diffXY + '</text>'),
              steps: [
                { label: 'Step 1: Add equations (1) and (2) to get 2x = ' + sumXY + ' + ' + diffXY, expected: String(sumXY + diffXY), unit: '' },
                { label: 'Step 2: Divide by 2 to find x', expected: String(xVal), unit: '' }
              ],
              finalAnswer: String(xVal),
              altAnswers: ['x=' + xVal]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_patterns') {
          for (let i = 0; i < 10; i++) {
            const h = randInt(2, 6);
            const k = randInt(3, 11);
            const yInt = h * h + k;
            questions.push({
              topic: 'Parabola Vertex Form y = (x − h)² + k',
              prompt: 'A parabola has equation y = (x − ' + h + ')² + ' + k + '. State the x-coordinate of its vertex, and find its y-intercept (when x = 0).',
              svgHtml: makeSvgCard('Vertex Form: y = (x − ' + h + ')² + ' + k + '  →  Vertex (' + h + ', ' + k + ')', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Vertex = (' + h + ', ' + k + ')   |   y-intercept at x = 0</text>'),
              steps: [
                { label: 'Step 1: Identify vertex x-coordinate h', expected: String(h), unit: '' },
                { label: 'Step 2: Substitute x = 0 to find y-intercept ((−' + h + ')² + ' + k + ')', expected: String(yInt), unit: '' }
              ],
              finalAnswer: String(yInt),
              altAnswers: ['(' + h + ',' + k + ')']
            });
          }
          return questions;
        }

        if (moduleId === 'meas_units') {
          for (let i = 0; i < 10; i++) {
            const actual = randInt(2, 8) * 50;
            const err = randInt(1, 5) * (actual / 50);
            const pctErr = (err / actual) * 100;
            questions.push({
              topic: 'Percentage Error & Measurement Bounds',
              prompt: 'A length is measured with an absolute error of ' + err + ' cm on an actual length of ' + actual + ' cm. Calculate the percentage error.',
              svgHtml: makeSvgCard('Percentage Error = (Error / Actual) × 100%', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Error = ' + err + ' cm   |   Actual = ' + actual + ' cm</text>'),
              steps: [
                { label: 'Step 1: Divide ' + err + ' ÷ ' + actual + ' as a decimal', expected: String(err / actual), unit: '' },
                { label: 'Step 2: Multiply by 100 to express as a percentage', expected: String(pctErr), unit: '%' }
              ],
              finalAnswer: String(pctErr),
              altAnswers: [pctErr + '%']
            });
          }
          return questions;
        }

        if (moduleId === 'meas_area_vol') {
          for (let i = 0; i < 10; i++) {
            const r = randInt(2, 5);
            const h = randInt(4, 10);
            const vol = 3 * r * r * h;
            questions.push({
              topic: 'Back-Solving Dimensions from Volume',
              prompt: 'A cylinder has volume V = ' + vol + ' cm³ and height h = ' + h + ' cm. Using π ≈ 3 (so V = 3r²h), work backwards to find the radius r.',
              svgHtml: makeSvgCard('Back-Solving: 3r²(' + h + ') = ' + vol, '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">3 × r² × ' + h + ' = ' + vol + ' cm³</text>'),
              steps: [
                { label: 'Step 1: Divide ' + vol + ' by (3 × ' + h + ') to find r²', expected: String(r * r), unit: '' },
                { label: 'Step 2: Take the square root √' + (r * r) + ' to find radius r', expected: String(r), unit: 'cm' }
              ],
              finalAnswer: String(r),
              altAnswers: [r + 'cm']
            });
          }
          return questions;
        }

        if (moduleId === 'meas_time') {
          for (let i = 0; i < 10; i++) {
            const side = randInt(3, 8);
            const minPerim = 4 * side;
            questions.push({
              topic: 'Optimization of Perimeter & Area',
              prompt: 'A rectangular garden must enclose an area of ' + (side * side) + ' m². The minimum possible perimeter occurs when the rectangle is a square. Find the minimum perimeter.',
              svgHtml: makeSvgCard('Optimization: Square Minimises Perimeter for Fixed Area', '<rect x="180" y="45" width="100" height="75" fill="#ccfbf1" stroke="#0f766e" stroke-width="2.5"/><text x="230" y="88" text-anchor="middle" font-size="14" font-weight="800">Area = ' + (side * side) + ' m²</text>'),
              steps: [
                { label: 'Step 1: Optimal square side length √' + (side * side), expected: String(side), unit: 'm' },
                { label: 'Step 2: Minimum perimeter = 4 × ' + side, expected: String(minPerim), unit: 'm' }
              ],
              finalAnswer: String(minPerim),
              altAnswers: [minPerim + 'm']
            });
          }
          return questions;
        }

        if (moduleId === 'geom_shapes') {
          const boxes = [[3, 4, 12, 13], [6, 8, 24, 26], [2, 3, 6, 7], [4, 3, 0, 5]];
          for (let i = 0; i < 10; i++) {
            const b = boxes[i % 3];
            const l = b[0];
            const w = b[1];
            const h = b[2];
            const diag = b[3];
            questions.push({
              topic: '3D Pythagoras in Cuboids (d = √(l² + w² + h²))',
              prompt: 'Find the 3D space diagonal d of a rectangular box with length ' + l + ' cm, width ' + w + ' cm, and height ' + h + ' cm.',
              svgHtml: makeSvgCard('3D Pythagoras: d² = l² + w² + h²', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">d² = ' + l + '² + ' + w + '² + ' + h + '² = ' + (diag * diag) + '</text>'),
              steps: [
                { label: 'Step 1: Calculate l² + w² + h² (' + (l * l) + ' + ' + (w * w) + ' + ' + (h * h) + ')', expected: String(diag * diag), unit: '' },
                { label: 'Step 2: Square root √' + (diag * diag) + ' to find 3D diagonal d', expected: String(diag), unit: 'cm' }
              ],
              finalAnswer: String(diag),
              altAnswers: [diag + 'cm']
            });
          }
          return questions;
        }

        if (moduleId === 'geom_trans') {
          for (let i = 0; i < 10; i++) {
            const circumAngle = randInt(32, 74);
            const centreAngle = circumAngle * 2;
            questions.push({
              topic: 'Circle Theorems & Deductive Geometric Proofs',
              prompt: 'An arc subtends an angle of ' + circumAngle + '° at the circumference of a circle. Find the angle subtended by the same arc at the centre O.',
              svgHtml: makeSvgCard('Circle Theorem: Angle at Centre = 2 × Angle at Circumference', '<circle cx="230" cy="85" r="46" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5"/><text x="230" y="65" text-anchor="middle" font-size="12" font-weight="800">Circumference = ' + circumAngle + '°</text><text x="230" y="102" text-anchor="middle" font-size="13" font-weight="800" fill="#dc2626">Centre = 2 × ' + circumAngle + '°</text>'),
              steps: [
                { label: 'Step 1: Multiplier relating centre angle to circumference angle', expected: '2', unit: '' },
                { label: 'Step 2: Calculate 2 × ' + circumAngle + '°', expected: String(centreAngle), unit: '°' }
              ],
              finalAnswer: String(centreAngle),
              altAnswers: [centreAngle + '°']
            });
          }
          return questions;
        }

        if (moduleId === 'stat_enquiry') {
          for (let i = 0; i < 10; i++) {
            const n = [25, 36, 64, 100][i % 4];
            const rootN = Math.round(Math.sqrt(n));
            const iqr = rootN * randInt(2, 6) * 2;
            const margin = (1.5 * iqr) / rootN;
            const med = randInt(50, 80);
            questions.push({
              topic: 'Informal Confidence Intervals (Median ± 1.5 × IQR / √n)',
              prompt: 'A sample of n = ' + n + ' has Median = ' + med + ' and IQR = ' + iqr + '. Calculate the ICI half-width (1.5 × IQR ÷ √n) and the Upper ICI limit.',
              svgHtml: makeSvgCard('NCEA Level 1 Informal Confidence Interval (ICI)', '<text x="230" y="88" text-anchor="middle" font-size="18" font-weight="800">ICI = ' + med + ' ± (1.5 × ' + iqr + ') / √' + n + '</text>'),
              steps: [
                { label: 'Step 1: Calculate ICI margin = 1.5 × ' + iqr + ' ÷ ' + rootN, expected: String(margin), unit: '' },
                { label: 'Step 2: Upper ICI limit = Median ' + med + ' + ' + margin, expected: String(med + margin), unit: '' }
              ],
              finalAnswer: String(med + margin),
              altAnswers: [String(margin)]
            });
          }
          return questions;
        }

        if (moduleId === 'stat_analysis') {
          for (let i = 0; i < 10; i++) {
            const pred = randInt(40, 85);
            const obs = pred + randInt(4, 15);
            const resid = obs - pred;
            questions.push({
              topic: 'Bivariate Regression Residuals (Observed − Predicted)',
              prompt: 'For x = 10, a regression line predicts y_pred = ' + pred + ', while the actual observed data point is y_obs = ' + obs + '. Calculate the residual.',
              svgHtml: makeSvgCard('Regression Residual = Observed y − Predicted y', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Observed = ' + obs + '   |   Predicted = ' + pred + '</text>'),
              steps: [
                { label: 'Step 1: Identify predicted value from trend line', expected: String(pred), unit: '' },
                { label: 'Step 2: Subtract Observed − Predicted (' + obs + ' − ' + pred + ')', expected: String(resid), unit: '' }
              ],
              finalAnswer: String(resid),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'stat_trends') {
          for (let i = 0; i < 10; i++) {
            const trendVal = randInt(120, 250);
            const seasonal = randInt(15, 45);
            const forecast = trendVal + seasonal;
            questions.push({
              topic: 'Time Series Additive Forecasting (Trend + Seasonal)',
              prompt: 'In an additive time-series model, the projected Quarter 4 trend value is ' + trendVal + ' and the average Quarter 4 seasonal effect is +' + seasonal + '. Find the Quarter 4 forecast.',
              svgHtml: makeSvgCard('Additive Time Series Model: Y = Trend + Seasonal', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Trend = ' + trendVal + '   |   Seasonal Effect = +' + seasonal + '</text>'),
              steps: [
                { label: 'Step 1: Identify projected trend value', expected: String(trendVal), unit: '' },
                { label: 'Step 2: Add seasonal effect (' + trendVal + ' + ' + seasonal + ')', expected: String(forecast), unit: '' }
              ],
              finalAnswer: String(forecast),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'prob_exp') {
          for (let i = 0; i < 10; i++) {
            const baseRisk = [0.05, 0.1, 0.15, 0.2][i % 4];
            const rr = randInt(2, 5);
            const expRisk = Number((baseRisk * rr).toFixed(2));
            questions.push({
              topic: 'Relative Risk & Contingency Tables',
              prompt: 'Group A has an event risk of ' + expRisk + ' and the baseline Group B has a risk of ' + baseRisk + '. Calculate the Relative Risk (RR = ' + expRisk + ' ÷ ' + baseRisk + ').',
              svgHtml: makeSvgCard('Relative Risk: RR = P(Event | Group A) / P(Event | Baseline)', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">RR = ' + expRisk + ' ÷ ' + baseRisk + '</text>'),
              steps: [
                { label: 'Step 1: Baseline group risk P(Event | Group B)', expected: String(baseRisk), unit: '' },
                { label: 'Step 2: Divide ' + expRisk + ' ÷ ' + baseRisk + ' to find Relative Risk', expected: String(rr), unit: 'times' }
              ],
              finalAnswer: String(rr),
              altAnswers: [rr + 'x']
            });
          }
          return questions;
        }

        // Default: prob_theo (Independence & Three-Stage Trees)
        for (let i = 0; i < 10; i++) {
          const pA = [0.4, 0.5, 0.6, 0.8][i % 4];
          const pB = [0.5, 0.3, 0.5, 0.25][i % 4];
          const pInter = Number((pA * pB).toFixed(2));
          const pUnion = Number((pA + pB - pInter).toFixed(2));
          questions.push({
            topic: 'Statistical Independence & Union Formula',
            prompt: 'Events A and B are independent with P(A) = ' + pA + ' and P(B) = ' + pB + '. Find P(A ∩ B) = P(A)P(B) and then P(A ∪ B) = P(A) + P(B) − P(A ∩ B).',
            svgHtml: makeSvgCard('Independent Events: P(A ∩ B) = P(A) × P(B)', '<text x="230" y="88" text-anchor="middle" font-size="18" font-weight="800">P(A) = ' + pA + ',  P(B) = ' + pB + '  →  P(A ∪ B) = ?</text>'),
            steps: [
              { label: 'Step 1: Calculate intersection P(A ∩ B) = ' + pA + ' × ' + pB, expected: String(pInter), unit: '' },
              { label: 'Step 2: Calculate union ' + pA + ' + ' + pB + ' − ' + pInter, expected: String(pUnion), unit: '' }
            ],
            finalAnswer: String(pUnion),
            altAnswers: [String(pInter)]
          });
        }
        return questions;
      }

      // Generate 25 Mixed Questions across all 16 sub-strands of the Year 11 - NZ Mathematics Workbook
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

      const PROGRESS_STORAGE_KEY = 'mathAcademyProgress:5_year11_nz_mathematics_workbook';
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
          state.activeModuleTitle = '25-Question Full Year 11 - NZ Mathematics Workbook Random Mix';
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
          title: 'Year 11 - NZ Mathematics Workbook Curriculum — All 6 Strands Hub',
          desc: 'Use the Strand Page tabs above to view each curriculum strand on its own separate page, or launch any 10-question sub-strand workbook below.'
        },
        number: {
          title: 'Page 1: Number Strand — Year 11 - NZ Mathematics Workbook',
          desc: 'Covers Types of Numbers (primes, squares/cubes, powers of 10, negative integers, rationals), Operations & Conversions, and Proportional Reasoning.'
        },
        algebra: {
          title: 'Page 2: Algebra Strand — Year 11 - NZ Mathematics Workbook',
          desc: 'Covers Expressions & Factorising, Linear Equations & Inequalities, Formula Substitution, Growing Patterns, Linear Sequences, and the Cartesian Coordinate Plane.'
        },
        measurement: {
          title: 'Page 3: Measurement Strand — Year 11 - NZ Mathematics Workbook',
          desc: 'Covers Metric Conversions (length, area, volume, capacity), Perimeter & Area of Composite Shapes/Trapeziums, Volume of Prisms/Cylinders, and Practical Time & Timetables.'
        },
        geometry: {
          title: 'Page 4: Geometry Strand — Year 11 - NZ Mathematics Workbook',
          desc: 'Covers Circle Parts (radius, diameter, circumference), Polygon/Triangle/Quadrilateral Angles, Transformations, Scale Enlargements, and Map Grids.'
        },
        statistics: {
          title: 'Page 5: Statistics Strand — Year 11 - NZ Mathematics Workbook',
          desc: 'Covers PPDAC Statistical Enquiry, Categorical/Numerical Variables, Data Displays, Mean/Median/Mode/Range, Outliers, and Positive/Negative Skewness.'
        },
        probability: {
          title: 'Page 6: Probability Strand — Year 11 - NZ Mathematics Workbook',
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
            '<span class="q-pill-num">' + (qItem.isCompleted ? '✓ ' : '') + 'Q' + (i + 1) + ' • ' + qItem.topic.split('•').pop().trim() + '</span>' +
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
            '<span class="step-label-text">' + stepObj.label + '</span>';

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
        printoutHeading.textContent = "📄 Year 11 - NZ Mathematics Workbook — " + state.activeModuleTitle + " Answer Key";
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
          s += 'BT /F2 13 Tf 42 798 Td (' + pdfEscapeText("Year 11 - NZ Mathematics Workbook - Answer Printout") + ') Tj ET\n';
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
        link.download = 'Year11_NZ_Mathematics_Workbook_Answers.pdf';
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
