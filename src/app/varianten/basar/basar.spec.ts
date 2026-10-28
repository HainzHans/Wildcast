import { zufallMitStartwert } from '../../core/zufall';
import {
  angebotMitId,
  ANGEBOTE,
  basarKaufen,
  basarRunde,
  basarStarten,
  BasarStand,
  stufenAnteile,
} from './basar';

const spieler = [
  { id: 1, name: 'Jo', leben: 40 },
  { id: 2, name: 'Flo', leben: 40 },
  { id: 3, name: 'Mia', leben: 40 },
];

describe('Basar', () => {
  it('hat eindeutige Angebote und jede Stufe gut gefüllt', () => {
    expect(new Set(ANGEBOTE.map((a) => a.id)).size).toBe(ANGEBOTE.length);
    for (const stufe of [1, 2, 3]) {
      expect(ANGEBOTE.filter((a) => a.stufe === stufe).length).toBeGreaterThanOrEqual(10);
    }
  });

  it('öffnet mit günstigen, verschiedenen Angeboten', () => {
    const stand = basarStarten({ groesse: 5 }, zufallMitStartwert(1));
    expect(stand.angebote.length).toBe(5);
    expect(new Set(stand.angebote).size).toBe(5);
    expect(stand.angebote.every((id) => angebotMitId(id)?.stufe === 1)).toBe(true);
  });

  it('wird mit den Runden teurer', () => {
    for (const runde of [1, 4, 7, 10]) {
      const a = stufenAnteile(runde);
      expect(a[1] + a[2] + a[3]).toBe(100);
    }
    let stand = basarStarten({ groesse: 3 }, zufallMitStartwert(2));
    const zufall = zufallMitStartwert(3);
    for (let r = 2; r <= 14; r++) stand = basarRunde(stand, r, zufall);
    const preis = stand.angebote.reduce((s, id) => s + angebotMitId(id)!.preis, 0) / 3;
    expect(preis).toBeGreaterThan(4);
  });

  it('ersetzt ein gekauftes Angebot und trägt Leben für Käufer und Gegner ein', () => {
    const stand: BasarStand = {
      groesse: 3,
      angebote: ['blutzoll', 'golem', 'wachhund'],
      gekauft: [],
    };
    const r = basarKaufen(stand, spieler, 'blutzoll', 2, 5, zufallMitStartwert(4));
    expect(r.spieler.map((p) => p.leben)).toEqual([37, 43, 37]);
    expect(r.stand.angebote.slice(0, 2)).toEqual(['golem', 'wachhund']);
    expect(r.stand.angebote.length).toBe(3);
    expect(r.stand.angebote[2]).not.toBe('blutzoll');
    expect(r.stand.gekauft).toEqual([{ id: 'blutzoll', spielerId: 2, runde: 5 }]);
  });

  it('lässt in jeder Runde das älteste Angebot verschwinden', () => {
    const stand: BasarStand = { groesse: 3, angebote: ['golem', 'greif', 'wachhund'], gekauft: [] };
    const neu = basarRunde(stand, 2, zufallMitStartwert(5));
    expect(neu.angebote.slice(0, 2)).toEqual(['greif', 'wachhund']);
    expect(new Set(neu.angebote).size).toBe(3);
  });
});
