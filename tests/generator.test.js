// Generates many random scenarios per difficulty/mode and checks they are valid.
// Run: node tests/generator.test.js [countPerCombo]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
global.window = global;
for (const f of ['ports.js', 'devices.js', 'scenarios.js', 'engine.js', 'generator.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), { filename: f });
}
const SF = global.SF;
const N = +process.argv[2] || 150;
let bad = 0;
for (const diff of SF.DIFF_ORDER) {
  for (const mode of ['build', 'troubleshoot', 'mix']) {
    let ok = 0, fails = 0;
    const rooms = {};
    for (let s = 1; s <= N; s++) {
      const id = SF.randomId(diff, mode, s);
      const scn = SF.generateScenario(id);
      if (!scn) { fails++; continue; }
      // independent re-check
      const ev = SF.evaluate(scn, SF.solutionState(scn));
      const init = SF.evaluate(scn, SF.initialState(scn));
      if (!ev.pass || init.pass || scn.hints.length !== 3 || !scn.reqs.length) { fails++; continue; }
      // determinism
      if (JSON.stringify(SF.generateScenario(id)) !== JSON.stringify(scn)) { fails++; continue; }
      rooms[scn.title] = (rooms[scn.title] || 0) + 1;
      ok++;
    }
    console.log(`${fails ? 'FAIL' : 'PASS'}  ${diff.padEnd(12)} ${mode.padEnd(12)} ok=${ok} failed=${fails} variety=${Object.keys(rooms).length}`);
    bad += fails;
  }
}
console.log('attempts', SF.genStats.attempts, 'retries by cause', JSON.stringify(SF.genStats.errors));
console.log(bad ? `\n${bad} generation failure(s)` : '\nAll generated scenarios OK');
process.exit(bad ? 1 : 0);
