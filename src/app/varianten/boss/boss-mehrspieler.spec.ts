import { zufallMitStartwert } from '../../core/zufall';
import { bossZug, dienerNachschub } from './boss-logik';
import { einzelZiel, MEHRSPIELER, STAERKSTE_KREATUR } from './boss-mehrspieler';
import { BossAktion, Lage } from './boss-modell';
import { BOSSE, bossMitId } from './bosse';
import { GORVAK } from './bosse/gorvak';

/** „erhält 9 Leben“ oder „erhält die Königin 9 Leben“. */
const heilt = (n: number) => new RegExp(`erhält[^.\\d]*${n} Leben`);

describe('Bosskampf mit mehr Spielern', () => {
  it('lässt den Boss bei zwei Spielern unverändert', () => {
    for (const b of BOSSE) expect(bossMitId(b.id, 2)).toBe(b);
  });

  for (const n of [3, 4]) {
    const m = MEHRSPIELER[n];

    it(`gibt ihm bei ${n} Spielern mehr Leben, Diener und stärkere Karten`, () => {
      for (const b of BOSSE) {
        const x = bossMitId(b.id, n);
        expect(x.leben).toBe(Math.round(b.leben * m.leben));
        expect(x.startDiener).toBe(b.startDiener + n - 2);
        x.relikte.forEach((r, i) => expect(r.verteidigung).toBeGreaterThan(b.relikte[i].verteidigung));
      }
    });

    it(`schreibt bei ${n} Spielern jede angepasste Zahl auch in den Text`, () => {
      for (const b of BOSSE) {
        const x = bossMitId(b.id, n);
        const paare: [BossAktion, BossAktion][] = [
          ...b.aktionen.map((a, i) => [a, x.aktionen[i]] as [BossAktion, BossAktion]),
          [b.spezial, x.spezial],
        ];
        for (const [alt, neu] of paare) {
          const f = alt.folgen ?? {};
          if (f.heilung) expect(neu.text, alt.id).toMatch(heilt(neu.folgen!.heilung!));
          if (f.schutz) expect(neu.text, alt.id).toContain(`die ersten ${neu.folgen!.schutz} Schaden`);
          if (einzelZiel(alt)) expect(neu.text, alt.id).toContain('Außerdem verlier');
          if (STAERKSTE_KREATUR.test(alt.text)) {
            expect(neu.text, alt.id).toMatch(/Das gilt außerdem für (die stärkste Kreatur|den stärksten Kommandeur)/);
          }
        }
        b.relikte.forEach((r, i) => {
          const neu = x.relikte[i];
          if (r.proZug?.heilung) expect(neu.text, r.id).toMatch(heilt(neu.proZug!.heilung!));
          if (r.proZug?.schutz) expect(neu.text, r.id).toContain(`ersten ${neu.proZug!.schutz} Schaden`);
          if (r.ablauf?.heilung) expect(neu.ablauf!.text, r.id).toContain(`${neu.ablauf!.heilung} Leben`);
        });
      }
    });
  }

  it('erkennt Effekte gegen die stärkste Kreatur', () => {
    const zerrspiegel = bossMitId('spiegelhexe', 3).aktionen.find((a) => a.id === 'zerrspiegel')!;
    expect(zerrspiegel.text).toContain(
      'Das gilt außerdem für die stärkste Kreatur von einem weiteren Spieler.',
    );
  });

  it('verteilt Lebensverlust gegen einen Spieler auf weitere Spieler', () => {
    const boss = bossMitId(GORVAK.id, 4);
    const zermalmen = boss.aktionen.find((a) => a.id === 'zermalmen')!;
    const lage: Lage = {
      runde: 3,
      leben: boss.leben,
      maxLeben: boss.leben,
      lebenVorher: boss.leben,
      diener: 0,
      spieler: [
        { id: 1, name: 'A', leben: 40 },
        { id: 2, name: 'B', leben: 30 },
        { id: 3, name: 'C', leben: 20 },
        { id: 4, name: 'D', leben: 10 },
      ],
      antworten: {},
      letzteAktionen: [],
      verlauf: [],
      letzteFragen: [],
      letzteSprueche: [],
      spezialAngekuendigt: false,
      repertoire: [zermalmen.id],
    };
    const zug = bossZug({ ...boss, rundenEffekt: undefined, merkmal: undefined }, lage, zufallMitStartwert(1));
    const getroffen = zug.lebenAenderungen.filter((l) => l.um === -4).map((l) => l.spielerId);
    expect(getroffen.sort()).toEqual([1, 2, 3]);
    expect(zermalmen.text).toContain('Außerdem verlieren die zwei Spieler mit den meisten Leben');
  });

  it('ruft zu dritt jede zweite Runde einen Diener mehr', () => {
    const mehr = MEHRSPIELER[3];
    const runden = [1, 2, 3, 4].map((r) => dienerNachschub(r, 3, mehr));
    expect(runden.reduce((s, x) => s + x, 0)).toBe(4 + 2);
  });
});
