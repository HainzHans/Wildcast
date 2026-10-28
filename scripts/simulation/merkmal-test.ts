import { BOSSE } from '../../src/app/varianten/boss/bosse';
import { BossDefinition } from '../../src/app/varianten/boss/boss-modell';
import { spiele } from './bosskampf';
import { PRECONS } from './decks';
// Vergleicht einen Boss mit Abwandlungen seines Merkmals (zum Ausbalancieren).
const boss = BOSSE[Number(process.argv[2] ?? 10) - 1];
const paare = PRECONS.flatMap((x, i) => PRECONS.slice(i + 1).map((y) => [x, y] as const));
const quote = (def: BossDefinition) => {
  let s = 0;
  let n = 0;
  for (const p of paare)
    for (let i = 0; i < 20; i++, n++) if (spiele(def, [p[0], p[1]], i * 31 + 7).sieg) s++;
  return Math.round((s / n) * 100);
};
console.log('mit Merkmal  ', quote(boss));
console.log('ohne Merkmal ', quote({ ...boss, merkmal: undefined }));
if (boss.merkmal?.art === 'koerper') {
  const leer = {
    ...boss.merkmal,
    teile: [{ id: 'x', name: 'x', anteil: 1, haupt: true, wirkung: '' }],
    weltende: undefined,
  };
  console.log('ein Körper   ', quote({ ...boss, merkmal: leer }));
  console.log(
    'ohne Effekte ',
    quote({
      ...boss,
      merkmal: {
        ...boss.merkmal,
        teile: boss.merkmal.teile.map((t) => ({
          ...t,
          heilung: 0,
          schaden: 0,
          extraAktion: false,
        })),
        weltende: undefined,
      },
    }),
  );
}
