import { textWirkung } from './bosskampf';
import { BOSSE } from '../../src/app/varianten/boss/bosse';
import { JACE } from './decks';
// Listet Boss-Aktionen ohne direkte Lebensfolge, deren Text die Simulation nicht umsetzt.
for (const b of BOSSE) {
  for (const a of [...b.aktionen, b.spezial]) {
    if (
      a.folgen?.leben ||
      a.folgen?.heilung ||
      a.folgen?.schutz ||
      a.folgen?.diener ||
      a.folgen?.dienerBonus
    )
      continue;
    let erkannt = false;
    const k = () => ({
      staerke: 3,
      widerstand: 3,
      flieger: true,
      getappt: false,
      neu: false,
      gebannt: false,
    });
    const sp = [1, 2].map((id) => ({
      id,
      name: '',
      deck: JACE,
      leben: 40,
      laender: 5,
      steine: 1,
      kreaturen: [k(), k()],
      bleibende: 2,
      friedhof: 3,
      kommandeur: true,
      hand: 4,
      malusStaerke: 0,
      malusMana: 0,
    }));
    textWirkung(a.text, sp as never, () => (erkannt = true));
    if (!erkannt) console.log(`L${b.level} ${a.id}: ${a.text}`);
  }
}
