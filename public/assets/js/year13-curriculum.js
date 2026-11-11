window.MATH_CURRICULUM_META = {
  year: 13,
  progressKey: 'mathAcademyProgress:year13-nz-mathematics',
  strands: {
    all: {
      title: 'Year 13 New Zealand Mathematics — All 6 Strands',
      desc: 'Current senior pathway practice for NCEA Level 3, with advanced functions, calculus, statistics and probability.'
    },
    number: {
      title: 'Page 1: Number Strand — Year 13 NCEA Level 3',
      desc: 'Complex numbers, logarithmic models, series and number structures used in senior mathematics.'
    },
    algebra: {
      title: 'Page 2: Algebra Strand — Year 13 NCEA Level 3',
      desc: 'Functions, polynomial methods, differentiation, integration and mathematical modelling.'
    },
    measurement: {
      title: 'Page 3: Measurement Strand — Year 13 NCEA Level 3',
      desc: 'Advanced rates of change, kinematics, optimisation and area models using calculus.'
    },
    geometry: {
      title: 'Page 4: Geometry Strand — Year 13 NCEA Level 3',
      desc: 'Trigonometric functions, coordinate geometry and vectors in multi-step problems.'
    },
    statistics: {
      title: 'Page 5: Statistics Strand — Year 13 NCEA Level 3',
      desc: 'Evaluate reports, analyse regression, interpret inference and communicate data-based conclusions.'
    },
    probability: {
      title: 'Page 6: Probability Strand — Year 13 NCEA Level 3',
      desc: 'Probability distributions, conditional events and expected values in contextual problems.'
    }
  }
};

window.MATH_CURRICULUM_MODULES = [
  { id: 'num_types', strandId: 'number', strandName: '1. Number', title: 'Complex Numbers & the Argand Plane', badge: 'Year 13 • Number', topics: ['Represent complex numbers', 'Find complex-number moduli', 'Interpret points on the Argand plane'] },
  { id: 'num_ops', strandId: 'number', strandName: '1. Number', title: 'Logarithms & Exponential Models', badge: 'Year 13 • Number', topics: ['Use logarithm laws', 'Solve exponential models', 'Interpret continuous and discrete growth'] },
  { id: 'num_prop', strandId: 'number', strandName: '1. Number', title: 'Sequences, Series & Recurrence', badge: 'Year 13 • Number', topics: ['Use arithmetic and geometric sequences', 'Calculate finite series', 'Model repeated change'] },
  { id: 'alg_expr', strandId: 'algebra', strandName: '2. Algebra', title: 'Polynomial & Rational Functions', badge: 'Year 13 • Algebra', topics: ['Factor polynomials', 'Simplify rational functions', 'Interpret roots and asymptotes'] },
  { id: 'alg_linear', strandId: 'algebra', strandName: '2. Algebra', title: 'Differentiation Methods', badge: 'Year 13 • Algebra', topics: ['Differentiate polynomial functions', 'Find gradients and tangents', 'Interpret stationary points'] },
  { id: 'alg_patterns', strandId: 'algebra', strandName: '2. Algebra', title: 'Integration & Differential Models', badge: 'Year 13 • Algebra', topics: ['Integrate polynomial functions', 'Apply initial conditions', 'Solve simple growth models'] },
  { id: 'meas_units', strandId: 'measurement', strandName: '3. Measurement', title: 'Rates, Kinematics & Acceleration', badge: 'Year 13 • Measurement', topics: ['Connect position, velocity and acceleration', 'Differentiate motion models', 'Interpret units and signs'] },
  { id: 'meas_area_vol', strandId: 'measurement', strandName: '3. Measurement', title: 'Calculus Optimisation', badge: 'Year 13 • Measurement', topics: ['Form an objective function', 'Find and classify stationary points', 'Interpret an optimal value'] },
  { id: 'meas_time', strandId: 'measurement', strandName: '3. Measurement', title: 'Area Under Curves & Accumulation', badge: 'Year 13 • Measurement', topics: ['Evaluate definite integrals', 'Find area between a curve and axis', 'Interpret accumulated change'] },
  { id: 'geom_shapes', strandId: 'geometry', strandName: '4. Geometry', title: 'Trigonometric Functions & Equations', badge: 'Year 13 • Geometry', topics: ['Use exact trigonometric values', 'Solve equations over an interval', 'Model periodic behaviour'] },
  { id: 'geom_trans', strandId: 'geometry', strandName: '4. Geometry', title: 'Vectors & Coordinate Methods', badge: 'Year 13 • Geometry', topics: ['Calculate dot products', 'Find vector magnitudes', 'Apply vectors to geometry'] },
  { id: 'stat_enquiry', strandId: 'statistics', strandName: '5. Statistics', title: 'Evaluate Statistical Reports', badge: 'Year 13 • Statistics', topics: ['Evaluate claims and conclusions', 'Identify sources of error', 'Interpret margins of error'] },
  { id: 'stat_analysis', strandId: 'statistics', strandName: '5. Statistics', title: 'Regression & Data Modelling', badge: 'Year 13 • Statistics', topics: ['Interpret regression models', 'Calculate and interpret residuals', 'Assess predictions in context'] },
  { id: 'stat_trends', strandId: 'statistics', strandName: '5. Statistics', title: 'Inference & Statistical Communication', badge: 'Year 13 • Statistics', topics: ['Compare groups with interval estimates', 'Interpret statistical evidence', 'Communicate conclusions with context'] },
  { id: 'prob_exp', strandId: 'probability', strandName: '6. Probability', title: 'Binomial & Normal Distributions', badge: 'Year 13 • Probability', topics: ['Use binomial models', 'Interpret normal distributions', 'Calculate probabilities and expectations'] },
  { id: 'prob_theo', strandId: 'probability', strandName: '6. Probability', title: 'Conditional Probability & Expected Value', badge: 'Year 13 • Probability', topics: ['Use conditional probabilities', 'Calculate expected values', 'State assumptions in context'] }
];
