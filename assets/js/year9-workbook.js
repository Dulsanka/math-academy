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
                "title": "1A. Integers, Powers, Roots & Standard Form",
                "badge": "Year 9 \u2022 Number",
                "topics": [
                        "Prime factorisation with exponents",
                        "Index laws (a^m \u00d7 a^n) & square/cube roots",
                        "Standard form (scientific notation a \u00d7 10^n)",
                        "Four operations with negative integers",
                        "Rational numbers & recurring decimals"
                ]
        },
        {
                "id": "num_ops",
                "strandId": "number",
                "strandName": "1. Number",
                "title": "1B. Fractions, Decimals & Percentage Change",
                "badge": "Year 9 \u2022 Number",
                "topics": [
                        "Multiplying & dividing fractions and mixed numbers",
                        "Decimal operations & rounding to significant figures",
                        "Percentage increase, decrease & markups"
                ]
        },
        {
                "id": "num_prop",
                "strandId": "number",
                "strandName": "1. Number",
                "title": "1C. Ratios, Rates & NZ Financial Literacy",
                "badge": "Year 9 \u2022 Number",
                "topics": [
                        "Splitting quantities in a given ratio",
                        "Unit rates & speed conversions",
                        "Simple interest (I = PRT) & NZ 15% GST"
                ]
        },
        {
                "id": "alg_expr",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2A. Expressions, Expanding & Factorising",
                "badge": "Year 9 \u2022 Algebra",
                "topics": [
                        "Writing & simplifying algebraic expressions",
                        "Expanding single brackets a(bx + c)",
                        "Factorising expressions with common variables"
                ]
        },
        {
                "id": "alg_linear",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2B. Multi-Step Linear Equations & Inequalities",
                "badge": "Year 9 \u2022 Algebra",
                "topics": [
                        "Equations with brackets & variables on both sides",
                        "Solving & graphing linear inequalities",
                        "Formula substitution with negative & power terms"
                ]
        },
        {
                "id": "alg_patterns",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2C. Linear Graphs (y = mx + c) & Sequences",
                "badge": "Year 9 \u2022 Algebra",
                "topics": [
                        "Finding the rule T_n = dn + c for linear patterns",
                        "Gradient (m = rise/run) and y-intercept (c)",
                        "Plotting & reading coordinates in all 4 quadrants"
                ]
        },
        {
                "id": "meas_units",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3A. Metric Area/Volume Conversions & Precision",
                "badge": "Year 9 \u2022 Measurement",
                "topics": [
                        "Converting length, area (cm\u00b2 \u2194 m\u00b2) & volume units",
                        "Capacity conversions (cm\u00b3, mL, L, m\u00b3)",
                        "Measurement precision & rounding"
                ]
        },
        {
                "id": "meas_area_vol",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3B. Circles (\u03c0r\u00b2), Composite Areas & Prisms",
                "badge": "Year 9 \u2022 Measurement",
                "topics": [
                        "Circumference & area of circles (A = \u03c0r\u00b2)",
                        "Area of composite shapes, trapeziums & parallelograms",
                        "Volume & surface area of prisms and cylinders"
                ]
        },
        {
                "id": "meas_time",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3C. Speed-Distance-Time & 24-Hour Schedules",
                "badge": "Year 9 \u2022 Measurement",
                "topics": [
                        "Speed, distance, and time calculations (v = d/t)",
                        "12-hour & 24-hour international time conversions",
                        "Multi-stage transit timetables"
                ]
        },
        {
                "id": "geom_shapes",
                "strandId": "geometry",
                "strandName": "4. Geometry",
                "title": "4A. Parallel Line Angles & Regular Polygons",
                "badge": "Year 9 \u2022 Geometry",
                "topics": [
                        "Alternate, corresponding & co-interior angles on parallel lines",
                        "Interior & exterior angle sums of regular polygons",
                        "Angle properties of isosceles triangles & quadrilaterals"
                ]
        },
        {
                "id": "geom_trans",
                "strandId": "geometry",
                "strandName": "4. Geometry",
                "title": "4B. Pythagoras Intro, Bearings & Transformations",
                "badge": "Year 9 \u2022 Geometry",
                "topics": [
                        "Pythagoras' theorem for hypotenuse (a\u00b2 + b\u00b2 = c\u00b2)",
                        "3-digit compass bearings (000\u00b0\u2013360\u00b0) & map scales",
                        "Reflections, rotations, translations & scale enlargements"
                ]
        },
        {
                "id": "stat_enquiry",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5A. PPDAC Enquiry, Sampling & Bias",
                "badge": "Year 9 \u2022 Statistics",
                "topics": [
                        "Comparison & relationship investigative questions",
                        "Random, systematic & stratified sampling methods",
                        "Discrete numerical, continuous numerical & categorical data"
                ]
        },
        {
                "id": "stat_analysis",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5B. Five-Number Summary, Quartiles & Box Plots",
                "badge": "Year 9 \u2022 Statistics",
                "topics": [
                        "Mean, median, mode & range from frequency tables",
                        "Quartiles (Q1, Median, Q3) & Interquartile Range (IQR)",
                        "Histograms, dot plots & box-and-whisker plots"
                ]
        },
        {
                "id": "stat_trends",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5C. Scatter Plots, Outliers & Skewness",
                "badge": "Year 9 \u2022 Statistics",
                "topics": [
                        "Impact of outliers on mean vs median",
                        "Positive & negative skewness in distributions",
                        "Bivariate scatter plots & lines of best fit"
                ]
        },
        {
                "id": "prob_exp",
                "strandId": "probability",
                "strandName": "6. Probability",
                "title": "6A. Relative Frequency, Simulations & Expected Count",
                "badge": "Year 9 \u2022 Probability",
                "topics": [
                        "Relative frequency & expected count E = n \u00d7 p",
                        "Law of Large Numbers in long-run trials",
                        "Two-way frequency tables"
                ]
        },
        {
                "id": "prob_theo",
                "strandId": "probability",
                "strandName": "6. Probability",
                "title": "6B. Two-Stage Probability Trees & Sample Grids",
                "badge": "Year 9 \u2022 Probability",
                "topics": [
                        "Independent combined events P(A and B) = P(A) \u00d7 P(B)",
                        "Two-stage probability tree diagrams",
                        "2D sample space grids & complementary events"
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
          for (let i = 0; i < 10; i++) {
            if (i % 3 === 0) {
              const p1 = randInt(2, 5);
              const p2 = randInt(3, 6);
              questions.push({
                topic: 'Index Laws & Exponents',
                prompt: 'Simplify 2^' + p1 + ' × 2^' + p2 + ' into the form 2^k, then state the exponent k.',
                svgHtml: makeSvgCard('Index Law: a^m × a^n = a^(m+n)', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800" fill="#0284c7">2^' + p1 + ' × 2^' + p2 + ' = 2^?</text>'),
                steps: [
                  { label: 'Step 1: Add the exponents (' + p1 + ' + ' + p2 + ')', expected: String(p1 + p2), unit: '' },
                  { label: 'Step 2: Evaluate 2^' + (p1 + p2) + ' as a whole number', expected: String(Math.pow(2, p1 + p2)), unit: '' }
                ],
                finalAnswer: String(p1 + p2),
                altAnswers: ['2^' + (p1 + p2), String(Math.pow(2, p1 + p2))]
              });
            } else if (i % 3 === 1) {
              const coef = (randInt(12, 95) / 10).toFixed(1);
              const exp = randInt(3, 5);
              const val = Math.round(parseFloat(coef) * Math.pow(10, exp));
              questions.push({
                topic: 'Standard Form (Scientific Notation)',
                prompt: 'Convert ' + coef + ' × 10^' + exp + ' from standard form into an ordinary whole number.',
                svgHtml: makeSvgCard('Standard Form: a × 10^n', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">' + coef + ' × 10^' + exp + '</text>'),
                steps: [
                  { label: 'Step 1: Write 10^' + exp + ' as a number', expected: String(Math.pow(10, exp)), unit: '' },
                  { label: 'Step 2: Multiply ' + coef + ' × ' + Math.pow(10, exp), expected: String(val), unit: '' }
                ],
                finalAnswer: String(val),
                altAnswers: []
              });
            } else {
              const a = -randInt(4, 11);
              const b = randInt(3, 8);
              const c = -randInt(5, 12);
              const prod = a * b;
              const res = prod - c;
              questions.push({
                topic: 'Negative Integer Operations (BEDMAS)',
                prompt: 'Evaluate (' + a + ' × ' + b + ') − (' + c + ').',
                svgHtml: makeSvgCard('Integer BEDMAS & Subtracting a Negative', '<text x="230" y="88" text-anchor="middle" font-size="21" font-weight="800">(' + a + ' × ' + b + ') − (' + c + ')</text>'),
                steps: [
                  { label: 'Step 1: Multiply ' + a + ' × ' + b, expected: String(prod), unit: '' },
                  { label: 'Step 2: Subtract (' + c + '), which is adding ' + Math.abs(c), expected: String(res), unit: '' }
                ],
                finalAnswer: String(res),
                altAnswers: []
              });
            }
          }
          return questions;
        }

        if (moduleId === 'num_ops') {
          for (let i = 0; i < 10; i++) {
            const orig = randInt(3, 12) * 20;
            const pct = [10, 15, 20, 25, 30][i % 5];
            const isIncrease = i % 2 === 0;
            const change = (orig * pct) / 100;
            const finalVal = isIncrease ? (orig + change) : (orig - change);
            questions.push({
              topic: isIncrease ? 'Percentage Increase' : 'Percentage Decrease & Discount',
              prompt: (isIncrease ? 'Increase ' : 'Decrease ') + '$' + orig + ' by ' + pct + '%.',
              svgHtml: makeSvgCard('Percentage Multiplier Method', '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">$' + orig + (isIncrease ? ' + ' : ' − ') + pct + '% of $' + orig + '</text>'),
              steps: [
                { label: 'Step 1: Find ' + pct + '% of ' + orig + ' (' + orig + ' × ' + (pct / 100) + ')', expected: String(change), unit: '$' },
                { label: 'Step 2: ' + (isIncrease ? 'Add to ' : 'Subtract from ') + orig, expected: String(finalVal), unit: '$' }
              ],
              finalAnswer: String(finalVal),
              altAnswers: ['$' + finalVal]
            });
          }
          return questions;
        }

        if (moduleId === 'num_prop') {
          for (let i = 0; i < 10; i++) {
            const P = randInt(2, 9) * 100;
            const R = randInt(4, 8);
            const T = randInt(2, 5);
            const interest = (P * R * T) / 100;
            questions.push({
              topic: 'Simple Interest & Financial Literacy (I = PRT)',
              prompt: 'Calculate the simple interest earned on $' + P + ' invested at ' + R + '% p.a. for ' + T + ' years, and find the total amount.',
              svgHtml: makeSvgCard('Simple Interest Formula: I = P × R × T', '<text x="230" y="88" text-anchor="middle" font-size="18" font-weight="800">P = $' + P + '  |  R = ' + R + '%  |  T = ' + T + ' yrs</text>'),
              steps: [
                { label: 'Step 1: Calculate simple interest I = ' + P + ' × ' + (R / 100) + ' × ' + T, expected: String(interest), unit: '$' },
                { label: 'Step 2: Total amount = Principal $' + P + ' + Interest $' + interest, expected: String(P + interest), unit: '$' }
              ],
              finalAnswer: String(P + interest),
              altAnswers: ['$' + (P + interest), String(interest)]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_expr') {
          for (let i = 0; i < 10; i++) {
            const k = randInt(2, 6);
            const a = randInt(2, 5);
            const b = randInt(3, 8);
            questions.push({
              topic: 'Expanding & Simplifying Single Brackets',
              prompt: 'Expand and simplify ' + k + '(' + a + 'x + ' + b + ') + 4x.',
              svgHtml: makeSvgCard('Distributive Law: k(ax + b)', '<text x="230" y="88" text-anchor="middle" font-size="21" font-weight="800">' + k + '(' + a + 'x + ' + b + ') + 4x</text>'),
              steps: [
                { label: 'Step 1: Multiply ' + k + ' × ' + a + 'x and add 4x → total x coefficient', expected: String(k * a + 4), unit: 'x' },
                { label: 'Step 2: Multiply ' + k + ' × ' + b + ' for the constant term', expected: String(k * b), unit: '' }
              ],
              finalAnswer: (k * a + 4) + 'x+' + (k * b),
              altAnswers: [(k * a + 4) + 'x + ' + (k * b)]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_linear') {
          for (let i = 0; i < 10; i++) {
            const xVal = randInt(2, 9);
            const m1 = randInt(5, 9);
            const m2 = randInt(2, 4);
            const c1 = randInt(3, 12);
            const c2 = (m1 - m2) * xVal + c1;
            questions.push({
              topic: 'Equations with Variables on Both Sides',
              prompt: 'Solve ' + m1 + 'x + ' + c1 + ' = ' + m2 + 'x + ' + c2 + ' for x.',
              svgHtml: makeSvgCard('Balancing Variables on Both Sides', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">' + m1 + 'x + ' + c1 + ' = ' + m2 + 'x + ' + c2 + '</text>'),
              steps: [
                { label: 'Step 1: Subtract ' + m2 + 'x from both sides → coefficient of x is (' + m1 + ' − ' + m2 + ')', expected: String(m1 - m2), unit: 'x' },
                { label: 'Step 2: Subtract ' + c1 + ' from ' + c2 + ' and divide by ' + (m1 - m2) + ' to find x', expected: String(xVal), unit: '' }
              ],
              finalAnswer: String(xVal),
              altAnswers: ['x=' + xVal]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_patterns') {
          for (let i = 0; i < 10; i++) {
            const m = randInt(2, 6);
            const c = randInt(1, 8);
            const x1 = 1;
            const y1 = m * x1 + c;
            const x2 = 4;
            const y2 = m * x2 + c;
            questions.push({
              topic: 'Linear Graphs (y = mx + c) & Gradient',
              prompt: 'A straight line passes through (' + x1 + ', ' + y1 + ') and (' + x2 + ', ' + y2 + '). Find its gradient m and y-intercept c, then state m.',
              svgHtml: makeSvgCard('Gradient Formula: m = (y₂ − y₁) / (x₂ − x₁)', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Points: (' + x1 + ', ' + y1 + ') and (' + x2 + ', ' + y2 + ')  →  y = ' + m + 'x + ' + c + '</text>'),
              steps: [
                { label: 'Step 1: Calculate rise = ' + y2 + ' − ' + y1, expected: String(y2 - y1), unit: '' },
                { label: 'Step 2: Divide rise by run (' + (y2 - y1) + ' ÷ ' + (x2 - x1) + ') to find gradient m', expected: String(m), unit: '' }
              ],
              finalAnswer: String(m),
              altAnswers: ['y=' + m + 'x+' + c, 'm=' + m]
            });
          }
          return questions;
        }

        if (moduleId === 'meas_units') {
          for (let i = 0; i < 10; i++) {
            const m2 = randInt(2, 9);
            const cm2 = m2 * 10000;
            questions.push({
              topic: 'Area & Volume Metric Unit Conversions',
              prompt: 'Convert ' + m2 + ' m² into square centimetres (cm²). Remember 1 m = 100 cm, so 1 m² = 100² cm².',
              svgHtml: makeSvgCard('Area Conversion: 1 m² = 10,000 cm²', '<text x="230" y="88" text-anchor="middle" font-size="22" font-weight="800">' + m2 + ' m² × 10,000 = ? cm²</text>'),
              steps: [
                { label: 'Step 1: Conversion factor 100 × 100', expected: '10000', unit: 'cm²/m²' },
                { label: 'Step 2: Multiply ' + m2 + ' × 10000', expected: String(cm2), unit: 'cm²' }
              ],
              finalAnswer: String(cm2),
              altAnswers: [String(cm2) + 'cm2']
            });
          }
          return questions;
        }

        if (moduleId === 'meas_area_vol') {
          for (let i = 0; i < 10; i++) {
            const r = randInt(2, 6);
            const h = randInt(5, 10);
            const baseArea = 3 * r * r;
            const vol = baseArea * h;
            questions.push({
              topic: 'Circle Area & Cylinder Volume (π ≈ 3)',
              prompt: 'A cylinder has radius r = ' + r + ' cm and height h = ' + h + ' cm. Using π ≈ 3, find its circular base area and total volume.',
              svgHtml: makeSvgCard('Cylinder Volume: V = πr²h (using π ≈ 3)', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">r = ' + r + ' cm  |  h = ' + h + ' cm  |  V = 3 × ' + r + '² × ' + h + '</text>'),
              steps: [
                { label: 'Step 1: Circular base area A ≈ 3 × ' + r + '²', expected: String(baseArea), unit: 'cm²' },
                { label: 'Step 2: Cylinder volume V = ' + baseArea + ' × ' + h, expected: String(vol), unit: 'cm³' }
              ],
              finalAnswer: String(vol),
              altAnswers: [String(vol) + 'cm3']
            });
          }
          return questions;
        }

        if (moduleId === 'meas_time') {
          for (let i = 0; i < 10; i++) {
            const speed = randInt(4, 9) * 15;
            const timeHrs = randInt(2, 5);
            const dist = speed * timeHrs;
            questions.push({
              topic: 'Speed, Distance & Time (v = d / t)',
              prompt: 'A train travels ' + dist + ' km in ' + timeHrs + ' hours. Find its average speed in km/h, then how far it travels in ' + (timeHrs + 1) + ' hours.',
              svgHtml: makeSvgCard('Speed-Distance-Time Formula', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Distance = ' + dist + ' km  |  Time = ' + timeHrs + ' hours</text>'),
              steps: [
                { label: 'Step 1: Average speed v = ' + dist + ' ÷ ' + timeHrs, expected: String(speed), unit: 'km/h' },
                { label: 'Step 2: Distance in ' + (timeHrs + 1) + ' hours (' + speed + ' × ' + (timeHrs + 1) + ')', expected: String(speed * (timeHrs + 1)), unit: 'km' }
              ],
              finalAnswer: String(speed * (timeHrs + 1)),
              altAnswers: [String(speed), String(speed * (timeHrs + 1)) + 'km']
            });
          }
          return questions;
        }

        if (moduleId === 'geom_shapes') {
          const sidesList = [5, 6, 8, 9, 10, 12];
          for (let i = 0; i < 10; i++) {
            const n = sidesList[i % sidesList.length];
            const sumAngles = (n - 2) * 180;
            const eachInt = sumAngles / n;
            questions.push({
              topic: 'Regular Polygon Interior & Exterior Angles',
              prompt: 'A regular polygon has n = ' + n + ' sides. Find the sum of its interior angles and the size of one interior angle.',
              svgHtml: makeSvgCard('Regular ' + n + '-gon Angle Sum = (n − 2) × 180°', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">n = ' + n + ' sides  →  Sum = (' + n + ' − 2) × 180°</text>'),
              steps: [
                { label: 'Step 1: Interior angle sum = (' + n + ' − 2) × 180°', expected: String(sumAngles), unit: '°' },
                { label: 'Step 2: One interior angle = ' + sumAngles + '° ÷ ' + n, expected: String(eachInt), unit: '°' }
              ],
              finalAnswer: String(eachInt),
              altAnswers: [String(eachInt) + '°', String(sumAngles)]
            });
          }
          return questions;
        }

        if (moduleId === 'geom_trans') {
          const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
          for (let i = 0; i < 10; i++) {
            const tr = triples[i % triples.length];
            const a = tr[0];
            const b = tr[1];
            const c = tr[2];
            questions.push({
              topic: 'Pythagoras Intro & Compass Bearings',
              prompt: 'A hiker walks ' + a + ' km North (000°) and then ' + b + ' km East (090°). Use Pythagoras\' theorem (a² + b² = c²) to find the direct distance c from the start.',
              svgHtml: makeSvgCard('Right-Angled Triangle: ' + a + '² + ' + b + '² = c²', '<polygon points="150,120 150,45 310,120" fill="#dbeafe" stroke="#0284c7" stroke-width="2.5"/><text x="125" y="86" font-size="13" font-weight="800">' + a + ' km</text><text x="230" y="138" text-anchor="middle" font-size="13" font-weight="800">' + b + ' km</text><text x="245" y="75" font-size="13" font-weight="800" fill="#dc2626">c = ?</text>'),
              steps: [
                { label: 'Step 1: Calculate a² + b² (' + (a * a) + ' + ' + (b * b) + ')', expected: String(a * a + b * b), unit: '' },
                { label: 'Step 2: Take the square root √' + (a * a + b * b) + ' to find hypotenuse c', expected: String(c), unit: 'km' }
              ],
              finalAnswer: String(c),
              altAnswers: [String(c) + 'km']
            });
          }
          return questions;
        }

        if (moduleId === 'stat_enquiry') {
          for (let i = 0; i < 10; i++) {
            const pop = randInt(4, 9) * 100;
            const k = [10, 20, 25][i % 3];
            const sampleN = pop / k;
            questions.push({
              topic: 'Systematic & Stratified Sampling (PPDAC)',
              prompt: 'To survey a school of ' + pop + ' students using systematic sampling, you select every ' + k + 'th student on the roll. How many students will be in the sample?',
              svgHtml: makeSvgCard('Systematic Sampling: Every ' + k + 'th Student', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Population N = ' + pop + '   |   Interval k = ' + k + '</text>'),
              steps: [
                { label: 'Step 1: Identify sampling interval k', expected: String(k), unit: '' },
                { label: 'Step 2: Divide population ' + pop + ' ÷ ' + k, expected: String(sampleN), unit: 'students' }
              ],
              finalAnswer: String(sampleN),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'stat_analysis') {
          for (let i = 0; i < 10; i++) {
            const q1 = randInt(8, 16);
            const med = q1 + randInt(4, 8);
            const q3 = med + randInt(5, 10);
            const iqr = q3 - q1;
            questions.push({
              topic: 'Quartiles, Box Plots & Interquartile Range (IQR)',
              prompt: 'A dataset has Lower Quartile Q₁ = ' + q1 + ', Median = ' + med + ', and Upper Quartile Q₃ = ' + q3 + '. Calculate the Interquartile Range (IQR = Q₃ − Q₁).',
              svgHtml: makeSvgCard('Box-and-Whisker Summary', '<rect x="140" y="55" width="180" height="40" fill="#dbeafe" stroke="#0284c7" stroke-width="2.5"/><line x1="220" y1="55" x2="220" y2="95" stroke="#dc2626" stroke-width="2.5"/><text x="140" y="115" text-anchor="middle" font-size="12" font-weight="800">Q₁=' + q1 + '</text><text x="220" y="115" text-anchor="middle" font-size="12" font-weight="800" fill="#dc2626">Med=' + med + '</text><text x="320" y="115" text-anchor="middle" font-size="12" font-weight="800">Q₃=' + q3 + '</text>'),
              steps: [
                { label: 'Step 1: Identify Upper Quartile Q₃', expected: String(q3), unit: '' },
                { label: 'Step 2: Subtract Q₃ − Q₁ (' + q3 + ' − ' + q1 + ') to find the IQR', expected: String(iqr), unit: '' }
              ],
              finalAnswer: String(iqr),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'stat_trends') {
          for (let i = 0; i < 10; i++) {
            const m = randInt(3, 7);
            const c = randInt(10, 25);
            const xVal = randInt(5, 12);
            const predY = m * xVal + c;
            questions.push({
              topic: 'Bivariate Scatter Plots & Trend Line Prediction',
              prompt: 'A scatter plot trend line has equation y = ' + m + 'x + ' + c + '. Use this trend line to predict y when x = ' + xVal + '.',
              svgHtml: makeSvgCard('Line of Best Fit: y = ' + m + 'x + ' + c, '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">Substitute x = ' + xVal + ' into y = ' + m + 'x + ' + c + '</text>'),
              steps: [
                { label: 'Step 1: Multiply ' + m + ' × ' + xVal, expected: String(m * xVal), unit: '' },
                { label: 'Step 2: Add ' + c + ' to find predicted y', expected: String(predY), unit: '' }
              ],
              finalAnswer: String(predY),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'prob_exp') {
          for (let i = 0; i < 10; i++) {
            const pDec = [0.2, 0.25, 0.3, 0.4, 0.5][i % 5];
            const nTrials = randInt(2, 8) * 100;
            const expCount = Math.round(pDec * nTrials);
            questions.push({
              topic: 'Expected Number of Outcomes (E = n × p)',
              prompt: 'The probability of winning a prize on a game wheel is p = ' + pDec + '. In n = ' + nTrials + ' plays, how many wins are expected?',
              svgHtml: makeSvgCard('Expected Count: E = n × p', '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">E = ' + nTrials + ' × ' + pDec + '</text>'),
              steps: [
                { label: 'Step 1: Convert probability ' + pDec + ' to a percentage', expected: String(pDec * 100), unit: '%' },
                { label: 'Step 2: Multiply ' + nTrials + ' × ' + pDec, expected: String(expCount), unit: 'wins' }
              ],
              finalAnswer: String(expCount),
              altAnswers: []
            });
          }
          return questions;
        }

        // Default: prob_theo (Two-Stage Probability Trees & Independent Events)
        for (let i = 0; i < 10; i++) {
          const pA = [0.2, 0.3, 0.4, 0.5, 0.6][i % 5];
          const pB = [0.5, 0.4, 0.5, 0.3, 0.5][i % 5];
          const both = Number((pA * pB).toFixed(2));
          questions.push({
            topic: 'Two-Stage Probability Trees & Combined Events',
            prompt: 'Two independent events have probabilities P(A) = ' + pA + ' and P(B) = ' + pB + '. Find the probability P(A and B) that both occur.',
            svgHtml: makeSvgCard('Probability Tree: P(A and B) = P(A) × P(B)', '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">P(A) = ' + pA + '   ×   P(B) = ' + pB + '</text>'),
            steps: [
              { label: 'Step 1: Find P(not A) = 1 − ' + pA, expected: String(Number((1 - pA).toFixed(2))), unit: '' },
              { label: 'Step 2: Multiply branch probabilities ' + pA + ' × ' + pB, expected: String(both), unit: '' }
            ],
            finalAnswer: String(both),
            altAnswers: [(both * 100) + '%']
          });
        }
        return questions;
      }

      // Generate 25 Mixed Questions across all 16 sub-strands of the Year 9 - NZ Mathematics Workbook
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

      const PROGRESS_STORAGE_KEY = 'mathAcademyProgress:3_year9_nz_mathematics_workbook';
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
          state.activeModuleTitle = '25-Question Full Year 9 - NZ Mathematics Workbook Random Mix';
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
          title: 'Year 9 - NZ Mathematics Workbook Curriculum — All 6 Strands Hub',
          desc: 'Use the Strand Page tabs above to view each curriculum strand on its own separate page, or launch any 10-question sub-strand workbook below.'
        },
        number: {
          title: 'Page 1: Number Strand — Year 9 - NZ Mathematics Workbook',
          desc: 'Covers Types of Numbers (primes, squares/cubes, powers of 10, negative integers, rationals), Operations & Conversions, and Proportional Reasoning.'
        },
        algebra: {
          title: 'Page 2: Algebra Strand — Year 9 - NZ Mathematics Workbook',
          desc: 'Covers Expressions & Factorising, Linear Equations & Inequalities, Formula Substitution, Growing Patterns, Linear Sequences, and the Cartesian Coordinate Plane.'
        },
        measurement: {
          title: 'Page 3: Measurement Strand — Year 9 - NZ Mathematics Workbook',
          desc: 'Covers Metric Conversions (length, area, volume, capacity), Perimeter & Area of Composite Shapes/Trapeziums, Volume of Prisms/Cylinders, and Practical Time & Timetables.'
        },
        geometry: {
          title: 'Page 4: Geometry Strand — Year 9 - NZ Mathematics Workbook',
          desc: 'Covers Circle Parts (radius, diameter, circumference), Polygon/Triangle/Quadrilateral Angles, Transformations, Scale Enlargements, and Map Grids.'
        },
        statistics: {
          title: 'Page 5: Statistics Strand — Year 9 - NZ Mathematics Workbook',
          desc: 'Covers PPDAC Statistical Enquiry, Categorical/Numerical Variables, Data Displays, Mean/Median/Mode/Range, Outliers, and Positive/Negative Skewness.'
        },
        probability: {
          title: 'Page 6: Probability Strand — Year 9 - NZ Mathematics Workbook',
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
        printoutHeading.textContent = "📄 Year 9 - NZ Mathematics Workbook — " + state.activeModuleTitle + " Answer Key";
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
          s += 'BT /F2 13 Tf 42 798 Td (' + pdfEscapeText("Year 9 - NZ Mathematics Workbook - Answer Printout") + ') Tj ET\n';
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
        link.download = 'Year9_NZ_Mathematics_Workbook_Answers.pdf';
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
