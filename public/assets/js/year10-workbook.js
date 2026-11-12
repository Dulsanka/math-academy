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
                "title": "1A. Index Laws, Negative Powers & Standard Form",
                "badge": "Year 10 \u2022 Number",
                "topics": [
                        "Negative & zero exponents (a\u207b\u207f = 1/a\u207f, a\u2070 = 1)",
                        "Multiplying & dividing numbers in standard form",
                        "Fractional powers & exact roots"
                ]
        },
        {
                "id": "num_ops",
                "strandId": "number",
                "strandName": "1. Number",
                "title": "1B. Reverse Percentages, GST & Compound Growth",
                "badge": "Year 10 \u2022 Number",
                "topics": [
                        "Reverse percentages (finding original price before discount)",
                        "Removing NZ 15% GST (dividing by 1.15)",
                        "Compound interest & appreciation A = P(1 + r)^t"
                ]
        },
        {
                "id": "num_prop",
                "strandId": "number",
                "strandName": "1. Number",
                "title": "1C. Direct/Inverse Proportion & Exchange Rates",
                "badge": "Year 10 \u2022 Number",
                "topics": [
                        "Inverse proportion (workers \u00d7 time = constant)",
                        "NZD foreign currency exchange conversions",
                        "Proportional scaling & density-mass-volume"
                ]
        },
        {
                "id": "alg_expr",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2A. Expanding Quadratics & Factorising Trinomials",
                "badge": "Year 10 \u2022 Algebra",
                "topics": [
                        "Expanding double brackets (x + a)(x + b)",
                        "Factorising monic quadratics x\u00b2 + bx + c",
                        "Difference of two squares (x\u00b2 \u2212 a\u00b2)"
                ]
        },
        {
                "id": "alg_linear",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2B. Quadratic Equations (ab=0) & Rearranging Formulas",
                "badge": "Year 10 \u2022 Algebra",
                "topics": [
                        "Solving factored quadratic equations (x \u2212 a)(x \u2212 b) = 0",
                        "Rearranging formulas to change the subject",
                        "Algebraic fractions & multi-step linear equations"
                ]
        },
        {
                "id": "alg_patterns",
                "strandId": "algebra",
                "strandName": "2. Algebra",
                "title": "2C. Parabolas (y = x\u00b2 + c) & Quadratic Sequences",
                "badge": "Year 10 \u2022 Algebra",
                "topics": [
                        "Quadratic sequences (second differences & T_n = an\u00b2 + c)",
                        "Features of parabolas (vertex, symmetry, intercepts)",
                        "Finding linear & quadratic equations from graphs"
                ]
        },
        {
                "id": "meas_units",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3A. Limits of Accuracy, Bounds & Density",
                "badge": "Year 10 \u2022 Measurement",
                "topics": [
                        "Upper & lower bounds of rounded measurements (\u00b10.5 unit)",
                        "Density, mass & volume calculations (D = M/V)",
                        "Compound rate conversions (m/s \u2194 km/h)"
                ]
        },
        {
                "id": "meas_area_vol",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3B. Cones, Pyramids, Spheres & Circle Sectors",
                "badge": "Year 10 \u2022 Measurement",
                "topics": [
                        "Volume of pyramids & cones (V = \u2153Ah)",
                        "Surface area & volume of spheres",
                        "Arc length & area of circle sectors (\u03b8/360 \u00d7 \u03c0r\u00b2)"
                ]
        },
        {
                "id": "meas_time",
                "strandId": "measurement",
                "strandName": "3. Measurement",
                "title": "3C. Kinematics Graphs (Speed-Time & Distance-Time)",
                "badge": "Year 10 \u2022 Measurement",
                "topics": [
                        "Acceleration as gradient of a speed-time graph",
                        "Distance travelled as area under a speed-time graph",
                        "Multi-stage journey analysis"
                ]
        },
        {
                "id": "geom_shapes",
                "strandId": "geometry",
                "strandName": "4. Geometry",
                "title": "4A. Pythagoras & Right-Angled Trigonometry (SOHCAHTOA)",
                "badge": "Year 10 \u2022 Geometry",
                "topics": [
                        "Finding hypotenuse & shorter sides using Pythagoras",
                        "Calculating unknown sides using sin, cos, and tan",
                        "Inverse trigonometry to find unknown angles"
                ]
        },
        {
                "id": "geom_trans",
                "strandId": "geometry",
                "strandName": "4. Geometry",
                "title": "4B. Similar Triangles, Circle Angles & Vectors",
                "badge": "Year 10 \u2022 Geometry",
                "topics": [
                        "Side ratios in similar triangles",
                        "Thales' theorem (angle in a semicircle = 90\u00b0)",
                        "Column vectors & area scale factor k\u00b2"
                ]
        },
        {
                "id": "stat_enquiry",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5A. Comparative Box Plots & Sample Variability",
                "badge": "Year 10 \u2022 Statistics",
                "topics": [
                        "Comparing sample distributions using medians & IQRs",
                        "Shift and overlap of the middle 50% boxes",
                        "Making sample-to-population inferences"
                ]
        },
        {
                "id": "stat_analysis",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5B. Bivariate Linear Regression & Predictions",
                "badge": "Year 10 \u2022 Statistics",
                "topics": [
                        "Using regression equations y = mx + c for interpolation",
                        "Strength and direction of linear correlation",
                        "Interpreting gradient in context"
                ]
        },
        {
                "id": "stat_trends",
                "strandId": "statistics",
                "strandName": "5. Statistics",
                "title": "5C. Time Series Trends, Moving Averages & Seasonality",
                "badge": "Year 10 \u2022 Statistics",
                "topics": [
                        "Long-term trend lines in time-series data",
                        "Calculating seasonal peaks & troughs",
                        "Smoothing data with moving averages"
                ]
        },
        {
                "id": "prob_exp",
                "strandId": "probability",
                "strandName": "6. Probability",
                "title": "6A. Conditional Probability, Two-Way Tables & Risk",
                "badge": "Year 10 \u2022 Probability",
                "topics": [
                        "Conditional probability P(A | B) from two-way tables",
                        "Relative risk & baseline comparisons",
                        "Expected values in repeated experiments"
                ]
        },
        {
                "id": "prob_theo",
                "strandId": "probability",
                "strandName": "6. Probability",
                "title": "6B. Probability Trees Without Replacement & Venn Diagrams",
                "badge": "Year 10 \u2022 Probability",
                "topics": [
                        "Probability trees for sampling without replacement",
                        "Venn diagrams: union P(A \u222a B) & intersection P(A \u2229 B)",
                        "Mutually exclusive & complementary events"
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
            const a = randInt(2, 5);
            const b = randInt(2, 4);
            const exp1 = randInt(3, 6);
            const exp2 = randInt(2, 5);
            questions.push({
              topic: 'Standard Form Multiplication & Index Laws',
              prompt: 'Calculate (' + a + ' × 10^' + exp1 + ') × (' + b + ' × 10^' + exp2 + '). Find the product of the leading numbers and the sum of the powers of 10, then state the full value.',
              svgHtml: makeSvgCard('Standard Form Multiplication', '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">(' + a + ' × 10^' + exp1 + ') × (' + b + ' × 10^' + exp2 + ')</text>'),
              steps: [
                { label: 'Step 1: Multiply ' + a + ' × ' + b, expected: String(a * b), unit: '' },
                { label: 'Step 2: Add the powers of 10 (' + exp1 + ' + ' + exp2 + ')', expected: String(exp1 + exp2), unit: '' }
              ],
              finalAnswer: String(exp1 + exp2),
              altAnswers: [(a * b) + 'x10^' + (exp1 + exp2), String((a * b) * Math.pow(10, exp1 + exp2))]
            });
          }
          return questions;
        }

        if (moduleId === 'num_ops') {
          for (let i = 0; i < 10; i++) {
            const orig = randInt(2, 12) * 100;
            const gstInc = Math.round(orig * 1.15);
            questions.push({
              topic: 'Reverse Percentages & Removing NZ 15% GST',
              prompt: 'A laptop costs $' + gstInc + ' including 15% NZ GST. Divide by 1.15 to find the pre-GST original price.',
              svgHtml: makeSvgCard('Reverse Percentage: Original × 1.15 = $' + gstInc, '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">Pre-GST Price = $' + gstInc + ' ÷ 1.15</text>'),
              steps: [
                { label: 'Step 1: Write the GST multiplier (1 + 0.15)', expected: '1.15', unit: '' },
                { label: 'Step 2: Divide ' + gstInc + ' ÷ 1.15 to find the pre-GST price', expected: String(orig), unit: '$' }
              ],
              finalAnswer: String(orig),
              altAnswers: ['$' + orig]
            });
          }
          return questions;
        }

        if (moduleId === 'num_prop') {
          for (let i = 0; i < 10; i++) {
            const w1 = randInt(3, 6);
            const d1 = randInt(4, 8) * 2;
            const totalWork = w1 * d1;
            const w2 = randInt(2, 4);
            // Make sure totalWork is divisible by w2
            const adjWork = w1 * w2 * randInt(2, 5);
            const adjD1 = adjWork / w1;
            const adjD2 = adjWork / w2;
            questions.push({
              topic: 'Inverse Proportion (Worker-Days)',
              prompt: 'It takes ' + w1 + ' builders ' + adjD1 + ' days to build a deck. At the same rate, how many days will it take ' + w2 + ' builders?',
              svgHtml: makeSvgCard('Inverse Proportion: w₁ × d₁ = w₂ × d₂', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">' + w1 + ' builders × ' + adjD1 + ' days = ' + adjWork + ' builder-days</text>'),
              steps: [
                { label: 'Step 1: Total builder-days required (' + w1 + ' × ' + adjD1 + ')', expected: String(adjWork), unit: 'builder-days' },
                { label: 'Step 2: Divide ' + adjWork + ' ÷ ' + w2 + ' builders', expected: String(adjD2), unit: 'days' }
              ],
              finalAnswer: String(adjD2),
              altAnswers: [String(adjD2) + 'days']
            });
          }
          return questions;
        }

        if (moduleId === 'alg_expr') {
          for (let i = 0; i < 10; i++) {
            const r1 = randInt(2, 7);
            const r2 = randInt(2, 7);
            const b = r1 + r2;
            const c = r1 * r2;
            questions.push({
              topic: 'Expanding & Factorising Quadratics (x + a)(x + b)',
              prompt: 'Expand (x + ' + r1 + ')(x + ' + r2 + ') into the form x² + bx + c. State the constant term c as your final answer.',
              svgHtml: makeSvgCard('Quadratic Expansion: (x + ' + r1 + ')(x + ' + r2 + ') = x² + ' + b + 'x + ' + c, '<text x="230" y="88" text-anchor="middle" font-size="21" font-weight="800">(x + ' + r1 + ')(x + ' + r2 + ') = x² + ?x + ?</text>'),
              steps: [
                { label: 'Step 1: Add ' + r1 + ' + ' + r2 + ' to find the middle coefficient b', expected: String(b), unit: 'x' },
                { label: 'Step 2: Multiply ' + r1 + ' × ' + r2 + ' to find the constant term c', expected: String(c), unit: '' }
              ],
              finalAnswer: String(c),
              altAnswers: ['x^2+' + b + 'x+' + c]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_linear') {
          for (let i = 0; i < 10; i++) {
            const r1 = randInt(1, 5);
            const r2 = randInt(6, 12);
            questions.push({
              topic: 'Solving Factored Quadratic Equations (ab = 0)',
              prompt: 'Solve the quadratic equation (x − ' + r1 + ')(x − ' + r2 + ') = 0. State the larger solution for x.',
              svgHtml: makeSvgCard('Null Factor Law: (x − ' + r1 + ')(x − ' + r2 + ') = 0', '<text x="230" y="88" text-anchor="middle" font-size="21" font-weight="800">(x − ' + r1 + ')(x − ' + r2 + ') = 0</text>'),
              steps: [
                { label: 'Step 1: Smaller solution from x − ' + r1 + ' = 0', expected: String(r1), unit: '' },
                { label: 'Step 2: Larger solution from x − ' + r2 + ' = 0', expected: String(r2), unit: '' }
              ],
              finalAnswer: String(r2),
              altAnswers: [r1 + ',' + r2, r2 + ',' + r1]
            });
          }
          return questions;
        }

        if (moduleId === 'alg_patterns') {
          for (let i = 0; i < 10; i++) {
            const a = randInt(1, 4);
            const c = randInt(2, 9);
            const n = randInt(4, 8);
            const val = a * n * n + c;
            questions.push({
              topic: 'Parabolas & Quadratic Sequences (T_n = an² + c)',
              prompt: 'Given the quadratic rule y = ' + a + 'x² + ' + c + ', find the y-value when x = ' + n + '.',
              svgHtml: makeSvgCard('Parabola Rule: y = ' + a + 'x² + ' + c, '<text x="230" y="88" text-anchor="middle" font-size="21" font-weight="800">y = ' + a + '(' + n + ')² + ' + c + '</text>'),
              steps: [
                { label: 'Step 1: Evaluate ' + n + '² (' + n + ' × ' + n + ')', expected: String(n * n), unit: '' },
                { label: 'Step 2: Calculate ' + a + ' × ' + (n * n) + ' + ' + c, expected: String(val), unit: '' }
              ],
              finalAnswer: String(val),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'meas_units') {
          for (let i = 0; i < 10; i++) {
            const density = randInt(2, 9);
            const vol = randInt(15, 60);
            const mass = density * vol;
            questions.push({
              topic: 'Density, Mass & Volume (D = M / V)',
              prompt: 'A metal block has volume V = ' + vol + ' cm³ and density D = ' + density + ' g/cm³. Find its mass M in grams.',
              svgHtml: makeSvgCard('Density Formula: Mass = Density × Volume', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">D = ' + density + ' g/cm³   |   V = ' + vol + ' cm³</text>'),
              steps: [
                { label: 'Step 1: Identify density in g/cm³', expected: String(density), unit: 'g/cm³' },
                { label: 'Step 2: Multiply ' + density + ' × ' + vol + ' to find Mass', expected: String(mass), unit: 'g' }
              ],
              finalAnswer: String(mass),
              altAnswers: [String(mass) + 'g']
            });
          }
          return questions;
        }

        if (moduleId === 'meas_area_vol') {
          for (let i = 0; i < 10; i++) {
            const r = randInt(2, 6);
            const h = randInt(3, 9);
            const cylVol = 3 * r * r * h;
            const coneVol = cylVol / 3;
            questions.push({
              topic: 'Volume of Cones & Pyramids (V = ⅓πr²h)',
              prompt: 'Find the volume of a cone with radius r = ' + r + ' cm and height h = ' + h + ' cm (using π ≈ 3).',
              svgHtml: makeSvgCard('Cone Volume = ⅓ × πr²h (with π ≈ 3)', '<polygon points="230,38 165,120 295,120" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2.5"/><text x="230" y="108" text-anchor="middle" font-size="13" font-weight="800">r = ' + r + ', h = ' + h + '</text>'),
              steps: [
                { label: 'Step 1: Base area A ≈ 3 × ' + r + '²', expected: String(3 * r * r), unit: 'cm²' },
                { label: 'Step 2: Cone volume V = (' + (3 * r * r) + ' × ' + h + ') ÷ 3', expected: String(coneVol), unit: 'cm³' }
              ],
              finalAnswer: String(coneVol),
              altAnswers: [String(coneVol) + 'cm3']
            });
          }
          return questions;
        }

        if (moduleId === 'meas_time') {
          for (let i = 0; i < 10; i++) {
            const vMax = randInt(12, 28);
            const tSec = randInt(4, 10) * 2;
            const dist = 0.5 * vMax * tSec;
            questions.push({
              topic: 'Kinematics: Speed-Time Graphs & Distance',
              prompt: 'A sprinter accelerates uniformly from 0 m/s to ' + vMax + ' m/s over ' + tSec + ' seconds. Find the distance covered (area of triangle under the speed-time graph).',
              svgHtml: makeSvgCard('Speed-Time Graph: Distance = ½ × base × height', '<polygon points="100,120 340,120 340,45" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/><text x="220" y="136" text-anchor="middle" font-size="12" font-weight="800">Time = ' + tSec + ' s</text><text x="375" y="85" font-size="12" font-weight="800">' + vMax + ' m/s</text>'),
              steps: [
                { label: 'Step 1: Multiply base × height (' + tSec + ' × ' + vMax + ')', expected: String(tSec * vMax), unit: '' },
                { label: 'Step 2: Halve to find the triangle area (distance)', expected: String(dist), unit: 'm' }
              ],
              finalAnswer: String(dist),
              altAnswers: [String(dist) + 'm']
            });
          }
          return questions;
        }

        if (moduleId === 'geom_shapes') {
          for (let i = 0; i < 10; i++) {
            const hyp = randInt(4, 15) * 2;
            const opp = hyp / 2;
            questions.push({
              topic: 'Right-Angled Trigonometry (SOHCAHTOA)',
              prompt: 'In a right-angled triangle, angle θ = 30° (where sin 30° = 0.5) and the hypotenuse is ' + hyp + ' cm. Find the opposite side x.',
              svgHtml: makeSvgCard('SOHCAHTOA: Opposite = Hypotenuse × sin(30°)', '<polygon points="120,120 330,120 330,45" fill="#ede9fe" stroke="#4f46e5" stroke-width="2.5"/><text x="165" y="112" font-size="12" font-weight="800">30°</text><text x="215" y="72" font-size="13" font-weight="800">Hyp = ' + hyp + ' cm</text><text x="355" y="88" font-size="13" font-weight="800" fill="#dc2626">x = ?</text>'),
              steps: [
                { label: 'Step 1: Value of sin(30°) as a decimal', expected: '0.5', unit: '' },
                { label: 'Step 2: Multiply ' + hyp + ' × 0.5 to find opposite side x', expected: String(opp), unit: 'cm' }
              ],
              finalAnswer: String(opp),
              altAnswers: [String(opp) + 'cm']
            });
          }
          return questions;
        }

        if (moduleId === 'geom_trans') {
          for (let i = 0; i < 10; i++) {
            const k = randInt(2, 5);
            const smallBase = randInt(4, 10);
            const largeBase = smallBase * k;
            const smallSide = randInt(3, 9);
            const largeSide = smallSide * k;
            questions.push({
              topic: 'Similar Triangles & Scale Factors',
              prompt: 'Two triangles are similar. The base increases from ' + smallBase + ' cm to ' + largeBase + ' cm. If the corresponding side on the small triangle is ' + smallSide + ' cm, find x on the large triangle.',
              svgHtml: makeSvgCard('Similar Triangles Scale Factor k = ' + largeBase + ' ÷ ' + smallBase, '<text x="230" y="88" text-anchor="middle" font-size="18" font-weight="800">Small: ' + smallBase + ' cm, ' + smallSide + ' cm   →   Large: ' + largeBase + ' cm, x cm</text>'),
              steps: [
                { label: 'Step 1: Find scale factor k = ' + largeBase + ' ÷ ' + smallBase, expected: String(k), unit: '' },
                { label: 'Step 2: Multiply ' + smallSide + ' cm × ' + k, expected: String(largeSide), unit: 'cm' }
              ],
              finalAnswer: String(largeSide),
              altAnswers: [String(largeSide) + 'cm']
            });
          }
          return questions;
        }

        if (moduleId === 'stat_enquiry') {
          for (let i = 0; i < 10; i++) {
            const medA = randInt(45, 65);
            const medB = medA + randInt(8, 18);
            const diffMed = medB - medA;
            questions.push({
              topic: 'Comparative Box-and-Whisker Distributions',
              prompt: 'Group A has a median score of ' + medA + ' and Group B has a median score of ' + medB + '. Find the difference between the two sample medians.',
              svgHtml: makeSvgCard('Comparing Two Sample Medians', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Group A Median = ' + medA + '   |   Group B Median = ' + medB + '</text>'),
              steps: [
                { label: 'Step 1: Identify higher median (Group B)', expected: String(medB), unit: '' },
                { label: 'Step 2: Subtract ' + medB + ' − ' + medA, expected: String(diffMed), unit: '' }
              ],
              finalAnswer: String(diffMed),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'stat_analysis') {
          for (let i = 0; i < 10; i++) {
            const m = randInt(2, 6);
            const c = randInt(15, 40);
            const x = randInt(10, 20);
            const y = m * x + c;
            questions.push({
              topic: 'Bivariate Linear Regression & Interpolation',
              prompt: 'A linear regression model for plant height y (cm) after x weeks is y = ' + m + 'x + ' + c + '. Predict the height after x = ' + x + ' weeks.',
              svgHtml: makeSvgCard('Regression Equation: y = ' + m + 'x + ' + c, '<text x="230" y="88" text-anchor="middle" font-size="20" font-weight="800">y = ' + m + '(' + x + ') + ' + c + '</text>'),
              steps: [
                { label: 'Step 1: Calculate growth ' + m + ' × ' + x, expected: String(m * x), unit: 'cm' },
                { label: 'Step 2: Add initial height ' + c + ' cm', expected: String(y), unit: 'cm' }
              ],
              finalAnswer: String(y),
              altAnswers: [String(y) + 'cm']
            });
          }
          return questions;
        }

        if (moduleId === 'stat_trends') {
          for (let i = 0; i < 10; i++) {
            const v1 = randInt(20, 40);
            const v2 = v1 + randInt(3, 9);
            const v3 = v2 + randInt(3, 9);
            const sum3 = v1 + v2 + v3;
            // Ensure divisible by 3
            const rem = sum3 % 3;
            const adjV3 = v3 + (rem === 0 ? 0 : (3 - rem));
            const cleanSum = v1 + v2 + adjV3;
            const ma = cleanSum / 3;
            questions.push({
              topic: 'Time Series & 3-Point Moving Averages',
              prompt: 'Calculate the 3-point moving average for consecutive quarterly sales of ' + v1 + ', ' + v2 + ', and ' + adjV3 + ' units.',
              svgHtml: makeSvgCard('3-Point Moving Average Smoothing', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">Quarters: ' + v1 + ',  ' + v2 + ',  ' + adjV3 + '</text>'),
              steps: [
                { label: 'Step 1: Sum the 3 consecutive values (' + v1 + ' + ' + v2 + ' + ' + adjV3 + ')', expected: String(cleanSum), unit: '' },
                { label: 'Step 2: Divide ' + cleanSum + ' ÷ 3', expected: String(ma), unit: '' }
              ],
              finalAnswer: String(ma),
              altAnswers: []
            });
          }
          return questions;
        }

        if (moduleId === 'prob_exp') {
          for (let i = 0; i < 10; i++) {
            const both = randInt(12, 36);
            const totalB = both * [2, 4, 5][i % 3];
            const condP = both / totalB;
            questions.push({
              topic: 'Conditional Probability from Two-Way Tables',
              prompt: 'In a two-way table, ' + totalB + ' students play Sport, and ' + both + ' of those also play Music. Find the conditional probability P(Music | Sport) as a decimal.',
              svgHtml: makeSvgCard('Conditional Probability: P(A | B) = n(A and B) / n(B)', '<text x="230" y="88" text-anchor="middle" font-size="19" font-weight="800">P(Music | Sport) = ' + both + ' / ' + totalB + '</text>'),
              steps: [
                { label: 'Step 1: Denominator (total in given condition Sport)', expected: String(totalB), unit: '' },
                { label: 'Step 2: Divide ' + both + ' ÷ ' + totalB + ' as a decimal', expected: String(condP), unit: '' }
              ],
              finalAnswer: String(condP),
              altAnswers: [both + '/' + totalB]
            });
          }
          return questions;
        }

        // Default: prob_theo (Venn Diagrams & Addition Rule)
        for (let i = 0; i < 10; i++) {
          const onlyA = randInt(8, 18);
          const both = randInt(5, 12);
          const onlyB = randInt(7, 16);
          const union = onlyA + both + onlyB;
          questions.push({
            topic: 'Venn Diagrams & Probability Without Replacement',
            prompt: 'In a Venn diagram, ' + onlyA + ' elements are in A only, ' + both + ' are in the intersection A ∩ B, and ' + onlyB + ' are in B only. Find the total number of elements in the union A ∪ B.',
            svgHtml: makeSvgCard('Venn Diagram Union: A ∪ B', '<circle cx="195" cy="85" r="42" fill="rgba(59,130,246,0.18)" stroke="#2563eb" stroke-width="2"/><circle cx="265" cy="85" r="42" fill="rgba(16,185,129,0.18)" stroke="#10b981" stroke-width="2"/><text x="170" y="90" text-anchor="middle" font-size="13" font-weight="800">' + onlyA + '</text><text x="230" y="90" text-anchor="middle" font-size="13" font-weight="800">' + both + '</text><text x="290" y="90" text-anchor="middle" font-size="13" font-weight="800">' + onlyB + '</text>'),
            steps: [
              { label: 'Step 1: Total in circle A (' + onlyA + ' + ' + both + ')', expected: String(onlyA + both), unit: '' },
              { label: 'Step 2: Add B-only (' + onlyB + ') to get n(A ∪ B)', expected: String(union), unit: '' }
            ],
            finalAnswer: String(union),
            altAnswers: []
          });
        }
        return questions;
      }

      // Generate 25 Mixed Questions across all 16 sub-strands of the Year 10 - NZ Mathematics Workbook
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

      const PROGRESS_STORAGE_KEY = window.mathAcademyProgressKey('year10');
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
          state.activeModuleTitle = '25-Question Full Year 10 - NZ Mathematics Workbook Random Mix';
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
          title: 'Year 10 - NZ Mathematics Workbook Curriculum — All 6 Strands Hub',
          desc: 'Use the Strand Page tabs above to view each curriculum strand on its own separate page, or launch any 10-question sub-strand workbook below.'
        },
        number: {
          title: 'Page 1: Number Strand — Year 10 - NZ Mathematics Workbook',
          desc: 'Covers Types of Numbers (primes, squares/cubes, powers of 10, negative integers, rationals), Operations & Conversions, and Proportional Reasoning.'
        },
        algebra: {
          title: 'Page 2: Algebra Strand — Year 10 - NZ Mathematics Workbook',
          desc: 'Covers Expressions & Factorising, Linear Equations & Inequalities, Formula Substitution, Growing Patterns, Linear Sequences, and the Cartesian Coordinate Plane.'
        },
        measurement: {
          title: 'Page 3: Measurement Strand — Year 10 - NZ Mathematics Workbook',
          desc: 'Covers Metric Conversions (length, area, volume, capacity), Perimeter & Area of Composite Shapes/Trapeziums, Volume of Prisms/Cylinders, and Practical Time & Timetables.'
        },
        geometry: {
          title: 'Page 4: Geometry Strand — Year 10 - NZ Mathematics Workbook',
          desc: 'Covers Circle Parts (radius, diameter, circumference), Polygon/Triangle/Quadrilateral Angles, Transformations, Scale Enlargements, and Map Grids.'
        },
        statistics: {
          title: 'Page 5: Statistics Strand — Year 10 - NZ Mathematics Workbook',
          desc: 'Covers PPDAC Statistical Enquiry, Categorical/Numerical Variables, Data Displays, Mean/Median/Mode/Range, Outliers, and Positive/Negative Skewness.'
        },
        probability: {
          title: 'Page 6: Probability Strand — Year 10 - NZ Mathematics Workbook',
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
        printoutHeading.textContent = "📄 Year 10 - NZ Mathematics Workbook — " + state.activeModuleTitle + " Answer Key";
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
          s += 'BT /F2 13 Tf 42 798 Td (' + pdfEscapeText("Year 10 - NZ Mathematics Workbook - Answer Printout") + ') Tj ET\n';
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
        link.download = 'Year10_NZ_Mathematics_Workbook_Answers.pdf';
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
