window.MATH_CURRICULUM_META = {
  year: 12,
  progressKey: 'mathAcademyProgress:year12-nz-mathematics',
  strands: {
    all: {
      title: 'Year 12 New Zealand Mathematics — All 6 Strands',
      desc: 'Current senior pathway practice for NCEA Level 2, with algebra, calculus, modelling, statistics and probability.'
    },
    number: {
      title: 'Page 1: Number Strand — Year 12 NCEA Level 2',
      desc: 'Exponential and logarithmic equations, growth and decay, financial models, rates and proportional reasoning.'
    },
    algebra: {
      title: 'Page 2: Algebra Strand — Year 12 NCEA Level 2',
      desc: 'Polynomial and rational algebra, algebraic methods, equations, functions and graph models.'
    },
    measurement: {
      title: 'Page 3: Measurement Strand — Year 12 NCEA Level 2',
      desc: 'Rates of change, introductory calculus methods, area and optimisation in applied contexts.'
    },
    geometry: {
      title: 'Page 4: Geometry Strand — Year 12 NCEA Level 2',
      desc: 'Trigonometry, geometric modelling, coordinates and vector methods.'
    },
    statistics: {
      title: 'Page 5: Statistics Strand — Year 12 NCEA Level 2',
      desc: 'Plan investigations, interpret data, analyse regression models and reason about statistical inference.'
    },
    probability: {
      title: 'Page 6: Probability Strand — Year 12 NCEA Level 2',
      desc: 'Probability models, distributions, conditional events and clear interpretation of results.'
    }
  }
};

window.MATH_CURRICULUM_MODULES = [
  { id: 'num_types', strandId: 'number', strandName: '1. Number', title: 'Exponential Equations & Logarithms', badge: 'Year 12 • Number', topics: ['Solve exponential equations', 'Use logarithms to find unknown powers', 'Interpret exponential models'] },
  { id: 'num_ops', strandId: 'number', strandName: '1. Number', title: 'Compound Growth & Decay', badge: 'Year 12 • Number', topics: ['Compound interest', 'Depreciation models', 'Compare repeated percentage change'] },
  { id: 'num_prop', strandId: 'number', strandName: '1. Number', title: 'Rates, Ratios & Proportional Models', badge: 'Year 12 • Number', topics: ['Direct and inverse variation', 'Rates in context', 'Scale and proportional models'] },
  { id: 'alg_expr', strandId: 'algebra', strandName: '2. Algebra', title: 'Polynomial & Rational Expressions', badge: 'Year 12 • Algebra', topics: ['Factor and simplify polynomials', 'Work with rational expressions', 'Evaluate algebraic models'] },
  { id: 'alg_linear', strandId: 'algebra', strandName: '2. Algebra', title: 'Algebraic Methods & Equations', badge: 'Year 12 • Algebra', topics: ['Solve simultaneous equations', 'Solve quadratic equations', 'Form equations from contexts'] },
  { id: 'alg_patterns', strandId: 'algebra', strandName: '2. Algebra', title: 'Functions, Graphs & Polynomial Models', badge: 'Year 12 • Algebra', topics: ['Interpret polynomial functions', 'Find turning points from factorised forms', 'Connect equations and graphs'] },
  { id: 'meas_units', strandId: 'measurement', strandName: '3. Measurement', title: 'Rates of Change & Differentiation', badge: 'Year 12 • Measurement', topics: ['Differentiate simple polynomials', 'Evaluate gradients at a point', 'Interpret rates of change'] },
  { id: 'meas_area_vol', strandId: 'measurement', strandName: '3. Measurement', title: 'Integration & Area', badge: 'Year 12 • Measurement', topics: ['Find antiderivatives', 'Evaluate definite integrals', 'Calculate area under simple curves'] },
  { id: 'meas_time', strandId: 'measurement', strandName: '3. Measurement', title: 'Calculus Optimisation', badge: 'Year 12 • Measurement', topics: ['Form a model from a context', 'Find stationary points', 'Interpret an optimum'] },
  { id: 'geom_shapes', strandId: 'geometry', strandName: '4. Geometry', title: 'Trigonometry & Geometric Models', badge: 'Year 12 • Geometry', topics: ['Use sine and cosine rules', 'Solve triangle problems', 'Apply trigonometry in context'] },
  { id: 'geom_trans', strandId: 'geometry', strandName: '4. Geometry', title: 'Coordinate Geometry & Vectors', badge: 'Year 12 • Geometry', topics: ['Find vector components', 'Calculate vector magnitude', 'Use coordinates to model movement'] },
  { id: 'stat_enquiry', strandId: 'statistics', strandName: '5. Statistics', title: 'Statistical Investigations', badge: 'Year 12 • Statistics', topics: ['Plan a statistical investigation', 'Identify variables and sampling issues', 'Interpret evidence in context'] },
  { id: 'stat_analysis', strandId: 'statistics', strandName: '5. Statistics', title: 'Regression & Residuals', badge: 'Year 12 • Statistics', topics: ['Interpret a regression model', 'Calculate residuals', 'Assess predictions in context'] },
  { id: 'stat_trends', strandId: 'statistics', strandName: '5. Statistics', title: 'Statistical Inference', badge: 'Year 12 • Statistics', topics: ['Compare sample estimates', 'Interpret uncertainty', 'Communicate an inference'] },
  { id: 'prob_exp', strandId: 'probability', strandName: '6. Probability', title: 'Probability Distributions', badge: 'Year 12 • Probability', topics: ['Use discrete probability models', 'Calculate expected values', 'Interpret distribution results'] },
  { id: 'prob_theo', strandId: 'probability', strandName: '6. Probability', title: 'Conditional Probability', badge: 'Year 12 • Probability', topics: ['Use conditional probability', 'Interpret independence', 'Combine events in context'] }
];
