import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import WORKBOOKS from '../src/workbooks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('all workbook routes map to existing files and protected scripts', () => {
  assert.equal(Object.keys(WORKBOOKS).length, 9);
  const pages = new Set();
  for (const [key, workbook] of Object.entries(WORKBOOKS)) {
    assert.ok(workbook.page.startsWith('/'), `${key} page must be root relative`);
    assert.ok(!pages.has(workbook.page), `${key} page route must be unique`);
    pages.add(workbook.page);
    assert.ok(fs.existsSync(path.join(ROOT, 'public', workbook.file)), `${key} HTML file exists`);
    assert.ok(fs.existsSync(path.join(ROOT, 'public', workbook.loader.slice(1))), `${key} loader exists`);
    if (workbook.script) assert.ok(fs.existsSync(path.join(ROOT, 'public', workbook.script.slice(1))), `${key} script exists`);
    if (workbook.engine) assert.ok(fs.existsSync(path.join(ROOT, 'public', workbook.engine.slice(1))), `${key} engine exists`);
  }
});

function assertQuestions(year, moduleId, questions) {
  assert.equal(questions.length, 10, `Year ${year} ${moduleId} has 10 questions`);
  for (const [index, question] of questions.entries()) {
    assert.ok(question.topic.trim(), `Year ${year} ${moduleId} Q${index + 1} topic`);
    assert.ok(question.prompt.trim(), `Year ${year} ${moduleId} Q${index + 1} prompt`);
    assert.ok(String(question.finalAnswer).trim(), `Year ${year} ${moduleId} Q${index + 1} answer`);
    assert.ok(question.steps.length > 0, `Year ${year} ${moduleId} Q${index + 1} steps`);
    for (const step of question.steps) {
      assert.ok(String(step.label).trim(), `Year ${year} ${moduleId} step label`);
      assert.ok(String(step.expected).trim(), `Year ${year} ${moduleId} step answer`);
    }
  }
}

function getFunction(source, functionName, nextMarker) {
  const start = source.indexOf(`      function ${functionName}(`);
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0 && end > start, `${functionName} source is present`);
  return source.slice(start, end);
}

test('Years 6 through 13 generate complete questions for every module', () => {
  const ids = ['num_types', 'num_ops', 'num_prop', 'alg_expr', 'alg_linear', 'alg_patterns', 'meas_units', 'meas_area_vol', 'meas_time', 'geom_shapes', 'geom_trans', 'stat_enquiry', 'stat_analysis', 'stat_trends', 'prob_exp', 'prob_theo'];
  const common = "const randInt=(a,b)=>a; const makeSvgCard=()=>'';";

  for (const year of [6, 7]) {
    const data = fs.readFileSync(path.join(ROOT, `public/assets/js/year${year}-curriculum.js`), 'utf8');
    const engine = fs.readFileSync(path.join(ROOT, 'public/assets/js/curriculum-workbook.js'), 'utf8');
    const generator = getFunction(engine, 'generateQuestionsForModule', '      function generateFullCurriculumRandom25(');
    const context = { window: {} };
    vm.runInNewContext(data, context);
    vm.runInNewContext(`${common} const CURRICULUM_MODULES=window.MATH_CURRICULUM_MODULES; ${generator}; globalThis.generate=generateQuestionsForModule;`, context);
    for (const module of context.window.MATH_CURRICULUM_MODULES) assertQuestions(year, module.id, context.generate(module.id, 0));
  }

  for (const year of [8, 9, 10, 11]) {
    const engine = fs.readFileSync(path.join(ROOT, `public/assets/js/year${year}-workbook.js`), 'utf8');
    const moduleStart = engine.indexOf('const CURRICULUM_MODULES = [');
    const moduleEnd = engine.indexOf('];', moduleStart) + 2;
    assert.ok(moduleStart >= 0 && moduleEnd > moduleStart, `Year ${year} module data is present`);
    const moduleDeclaration = engine.slice(moduleStart, moduleEnd);
    const generator = getFunction(engine, 'generateQuestionsForModule', '      function generateFullCurriculumRandom25(');
    const context = {};
    vm.runInNewContext(`const CURRENT_YEAR=${year}; ${common} ${moduleDeclaration}; ${generator}; globalThis.generate=generateQuestionsForModule; globalThis.modules=CURRICULUM_MODULES;`, context);
    for (const module of context.modules) assertQuestions(year, module.id, context.generate(module.id, 0));
  }

  for (const year of [12, 13]) {
    const data = fs.readFileSync(path.join(ROOT, `public/assets/js/year${year}-curriculum.js`), 'utf8');
    const engine = fs.readFileSync(path.join(ROOT, 'public/assets/js/senior-workbook.js'), 'utf8');
    const generator = getFunction(engine, 'generateQuestionsForModule', '      // Generate mixed questions across this year');
    const context = { window: {} };
    vm.runInNewContext(data, context);
    vm.runInNewContext(`const CURRENT_YEAR=${year}; ${common} const CURRICULUM_MODULES=window.MATH_CURRICULUM_MODULES; ${generator}; globalThis.generate=generateQuestionsForModule;`, context);
    for (const module of context.window.MATH_CURRICULUM_MODULES) assertQuestions(year, module.id, context.generate(module.id, 0));
  }
});

test('calculator arithmetic parser follows precedence and rejects malformed input', () => {
  const source = fs.readFileSync(path.join(ROOT, 'public/assets/js/site.js'), 'utf8');
  const parser = getFunction(source, 'evaluateArithmetic', "      btnOpenCalculator.addEventListener(");
  const context = {};
  vm.runInNewContext(`${parser}; globalThis.evaluate=evaluateArithmetic;`, context);
  assert.equal(context.evaluate('2 + 3 * 4'), 14);
  assert.equal(context.evaluate('(2 + 3) * 4'), 20);
  assert.equal(context.evaluate('-6 / 2 + .5'), -2.5);
  assert.throws(() => context.evaluate('1 / 0'));
  assert.throws(() => context.evaluate('2 ** 3'));
  assert.throws(() => context.evaluate('1 + alert(1)'));
});

test('arithmetic workbook compiles addition, subtraction, multiplication and division plans', () => {
  const source = fs.readFileSync(path.join(ROOT, 'public/assets/js/interactive-workbook.js'), 'utf8');
  const start = source.indexOf('      function validateNumberFormat(');
  const end = source.indexOf('      function initWorkbookQuestions(', start);
  assert.ok(start >= 0 && end > start, 'arithmetic plan builders are present');
  const context = {};
  vm.runInNewContext(`function randInt(min,max){return min;} ${source.slice(start, end)}; globalThis.build=buildPlanForQuestion; globalThis.validate=validateNumberFormat;`, context);

  assert.equal(context.build('add', '12.5', '3.25', 0).formattedAnswer, '15.75');
  assert.equal(context.build('sub', '3', '8', 0).formattedAnswer, '5');
  assert.equal(context.build('mul', '12.5', '2', 0).formattedAnswer, '25');
  assert.equal(context.build('div', '10', '4', 2).formattedAnswer, '2.50');
  assert.equal(context.validateNumberFormat('12345.67895', 'Number', false).valid, true);
  assert.equal(context.validateNumberFormat('1e9', 'Number', false).valid, false);
  assert.equal(context.validateNumberFormat('0', 'Divisor', true).valid, false);
});

