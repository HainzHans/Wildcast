import { zufallMitStartwert } from '../../core/zufall';
import { waehleAktion } from './boss-logik';
import { BossAktion, Lage, Planerstufe } from './boss-modell';
import { aktionBewerten, planerFaktoren } from './boss-planer';
import { bossLage, bossStarten } from './boss-stand';
import { STURMDRACHE } from './bosse/sturmdrache';

function lage(aenderung: Partial<Lage> = {}): Lage {
  return {
    runde: 5,
    leben: 120,
    maxLeben: 160,
    lebenVorher: 120,
    diener: 3,
    dienerMacht: 6,
    spieler: [
      { id: 1, name: 'Jo', leben: 30 },
      { id: 2, name: 'Flo', leben: 30 },
    ],
    antworten: { kreaturen: '3-5' },
    letzteAktionen: [],
    verlauf: [],
    letzteFragen: [],
    letzteSprueche: [],
    spezialAngekuendigt: false,
    relikte: [],
    ...aenderung,
  };
}

const aktion = (id: string): BossAktion => STURMDRACHE.aktionen.find((a) => a.id === id)!;

function angriffsAnteil(stufe: Planerstufe, l: Lage): number {
  const zufall = zufallMitStartwert(3);
  let angriffe = 0;
  for (let i = 0; i < 1500; i++) {
    const a = waehleAktion(STURMDRACHE, { ...l, planer: stufe }, 'lauernd', zufall);
    if (a.folgen?.leben) angriffe++;
  }
  return angriffe / 1500;
}

describe('Boss-Planer', () => {
  it('lässt mit Instinkt alles beim Alten', () => {
    const faktoren = planerFaktoren(STURMDRACHE, lage(), STURMDRACHE.aktionen, 'instinkt');
    expect(faktoren.every((f) => f === 1)).toBe(true);
  });

  it('greift gezielter an, wenn die Spieler kaum noch Leben haben', () => {
    const knapp = lage({
      spieler: [
        { id: 1, name: 'Jo', leben: 6 },
        { id: 2, name: 'Flo', leben: 5 },
      ],
    });
    expect(angriffsAnteil('gerissen', knapp)).toBeGreaterThan(angriffsAnteil('instinkt', knapp));
    expect(angriffsAnteil('taktiker', knapp)).toBeGreaterThan(angriffsAnteil('instinkt', knapp));
  });

  it('schätzt Schutz höher, wenn die Spieler gerade viel Schaden machen', () => {
    const vorteil = (l: Lage) =>
      aktionBewerten(STURMDRACHE, l, aktion('sturmpanzer')) -
      aktionBewerten(STURMDRACHE, l, aktion('blitzschlag'));
    // Mitten in Phase 2, damit der Phasen-Schild den Schaden nicht ohnehin abfängt.
    const ruhig = lage({ leben: 90, lebenVorher: 90, antworten: { kreaturen: '0-2' }, runde: 2 });
    const unterDruck = lage({ leben: 90, lebenVorher: 115, antworten: { kreaturen: '6-9' } });
    expect(vorteil(unterDruck)).toBeGreaterThan(vorteil(ruhig));
  });

  it('bleibt abwechslungsreich, auch wenn er gerissen ist', () => {
    const zufall = zufallMitStartwert(8);
    const gewaehlt = new Set<string>();
    for (let i = 0; i < 300; i++) {
      gewaehlt.add(waehleAktion(STURMDRACHE, lage({ planer: 'gerissen' }), 'lauernd', zufall).id);
    }
    expect(gewaehlt.size).toBeGreaterThanOrEqual(5);
  });

  it('merkt sich die Stufe im Spielstand und gibt sie an die Lage weiter', () => {
    const stand = bossStarten(STURMDRACHE, zufallMitStartwert(1), 'taktiker');
    expect(stand.planer).toBe('taktiker');
    expect(bossLage(stand, [], {}).planer).toBe('taktiker');
    expect(bossLage({ ...stand, planer: undefined }, [], {}).planer).toBe('instinkt');
  });
});
