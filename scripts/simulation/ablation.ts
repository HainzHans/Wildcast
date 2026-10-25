import { BOSSE } from '../../src/app/varianten/boss/bosse';
import { BossDefinition } from '../../src/app/varianten/boss/boss-modell';
import { spiele } from './bosskampf';
import { JACE, STRIXHAVEN } from './decks';
// Lässt jede Aktion eines Bosses einmal weg und zeigt, wie sich die Siegquote ändert.
const boss = BOSSE[Number(process.argv[2] ?? 7) - 1];
const quote = (def: BossDefinition) => {
  let s = 0;
  for (let i = 0; i < 400; i++) if (spiele(def, [STRIXHAVEN[i % 5], JACE], i * 31 + 7).sieg) s++;
  return (s / 400) * 100;
};
const basis = quote(boss);
console.log(`${boss.name}: ${basis.toFixed(0)} %`);
const zeilen = boss.aktionen.map((a) => {
  const ohne = quote({ ...boss, aktionen: boss.aktionen.filter((x) => x !== a) });
  return [a.id, ohne - basis] as const;
});
zeilen.push(['(ohne Start-Diener)', quote({ ...boss, startDiener: 0 }) - basis]);
zeilen.push([
  '(ohne Spezial)',
  quote({ ...boss, spezial: { ...boss.spezial, folgen: {}, text: '' } }) - basis,
]);
for (const [id, d] of zeilen.sort((a, b) => b[1] - a[1]))
  console.log(`  ${id.padEnd(22)} ${d >= 0 ? '+' : ''}${d.toFixed(0)}`);
