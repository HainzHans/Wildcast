import { BOSSE } from '../../src/app/varianten/boss/bosse';
import { MESSUNG, spiele } from './bosskampf';
import { JACE, STRIXHAVEN } from './decks';
// Wie oft legt jeder Boss Karten, und wie viele davon zerstören die Spieler?
for (const b of BOSSE) {
  Object.assign(MESSUNG, { relikteGelegt: 0, relikteZerstoert: 0 });
  for (let i = 0; i < 200; i++) spiele(b, [STRIXHAVEN[i % 5], JACE], i * 31 + 7);
  const start = b.startRelikt ? 200 : 0;
  console.log(
    `L${b.level} ${b.name.padEnd(24)} gelegt ${((MESSUNG.relikteGelegt + start) / 200).toFixed(1)} · zerstört ${(MESSUNG.relikteZerstoert / 200).toFixed(1)} pro Partie`,
  );
}
