// Verifies every scenario: its reference solution passes, and its starting state fails.
// Run: node tests/scenarios.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
global.window = global;
for (const f of ['ports.js', 'devices.js', 'scenarios.js', 'engine.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), { filename: f });
}
const SF = global.SF;
let failed = 0;

for (const scn of SF.SCENARIOS) {
  const sol = SF.solutionState(scn);
  const find = (uid) => sol.devices.find((x) => x.uid === uid);
  const used = new Set();
  for (const c of sol.cables) {
    for (const end of [c.a, c.b]) {
      const d = find(end.uid);
      if (!d) throw new Error(`${scn.id}: unknown device ${end.uid}`);
      if (!SF.portOf(d, end.port)) throw new Error(`${scn.id}: unknown port ${end.uid}.${end.port}`);
      const k = end.uid + '.' + end.port;
      if (used.has(k)) throw new Error(`${scn.id}: port used twice ${k}`);
      used.add(k);
    }
    const pa = SF.portOf(find(c.a.uid), c.a.port);
    const pb = SF.portOf(find(c.b.uid), c.b.port);
    if (pa.dir === 'in' || pb.dir === 'out') throw new Error(`${scn.id}: bad orientation ${c.a.uid}.${c.a.port} -> ${c.b.uid}.${c.b.port}`);
  }
  for (const d of sol.devices.filter((d) => !d.owned)) {
    const pe = scn.palette.find((p) => p.type === d.type);
    const n = sol.devices.filter((x) => !x.owned && x.type === d.type).length;
    if (!pe || n > pe.qty) throw new Error(`${scn.id}: solution uses ${n}x ${d.type} not available in palette`);
  }
  const ev = SF.evaluate(scn, sol);
  const init = SF.evaluate(scn, SF.initialState(scn));
  const ok = ev.pass && !init.pass;
  const par = scn.par == null || ev.cost <= scn.par;
  console.log(`${ok && par ? 'PASS' : 'FAIL'}  ${scn.id.padEnd(16)} solution=$${ev.cost} par=${scn.par} start-fails=${!init.pass}`);
  if (!ev.pass) {
    ev.results.filter((r) => !r.pass).forEach((r) => console.log('   x', r.req.label, '-', r.detail));
    ev.an.issues.filter((i) => i.level !== 'info').forEach((i) => console.log('   !', i.level, i.text));
  }
  if (scn.mode === 'troubleshoot') {
    console.log('   start issues:', init.an.issues.filter((i) => i.level !== 'info').map((i) => i.level).join(', ') || '(none)');
  }
  if (!ok || !par) failed++;
}
console.log(failed ? `\n${failed} scenario(s) FAILED` : '\nAll scenarios OK');
process.exit(failed ? 1 : 0);
