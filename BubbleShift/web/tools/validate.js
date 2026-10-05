// Structural validation of all levels: anchored, non-empty, not pre-solved,
// sensible targets and move budgets. Exit code 1 on any problem.
const { DATA, Core, Levels } = require('./load')();
let problems = 0; const objCount = {}; const mechFirst = {};
for (let id = 1; id <= DATA.MAX_LEVEL; id++) {
  const L = Levels.get(id);
  const b = new Core.Board(L);
  const anc = b.anchored();
  let floating = 0; for (let k = 0; k < b.cells.length; k++) if (b.cells[k] && !anc[k]) floating++;
  const p = b.progress();
  objCount[L.objective.type] = (objCount[L.objective.type] || 0) + 1;
  for (const m of L.mechanics) if (!mechFirst[m]) mechFirst[m] = id;
  const issues = [];
  if (floating) issues.push('floating=' + floating);
  if (!L.cells.length) issues.push('empty');
  if (p.done) issues.push('already done');
  if (!(p.target > 0)) issues.push('target=' + p.target);
  if (L.moves < 8) issues.push('moves=' + L.moves);
  if (issues.length) { problems++; console.log('L' + id, L.objective.type, issues.join(', ')); }
}
console.log('objectives:', JSON.stringify(objCount));
console.log('first mechanic use:', JSON.stringify(mechFirst));
console.log(problems ? problems + ' PROBLEM LEVELS' : 'ALL ' + DATA.MAX_LEVEL + ' LEVELS VALID');
process.exit(problems ? 1 : 0);
