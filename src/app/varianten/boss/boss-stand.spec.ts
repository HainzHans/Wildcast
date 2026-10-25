import {
  bossStarten,
  bossTreffen,
  bossZugEintragen,
  dienerBesiegen,
  zugBeenden,
} from './boss-stand';
import { BossZug } from './boss-modell';
import { STURMDRACHE } from './bosse/sturmdrache';

const spieler = [
  { id: 1, name: 'Jo' },
  { id: 2, name: 'Flo' },
];

describe('Boss-Stand', () => {
  it('startet mit vollen Leben, Startdienern und Spieler 1 am Zug', () => {
    const stand = bossStarten(STURMDRACHE, [1, 2], () => 0);
    expect(stand.leben).toBe(160);
    expect(stand.diener.length).toBe(STURMDRACHE.startDiener);
    expect(stand.amZug).toBe(1);
  });

  it('geht Spieler 1 → Spieler 2 → Boss und lässt den Schild mit jedem Zug fallen', () => {
    let stand = bossStarten(STURMDRACHE, [1, 2], () => 0);
    stand = bossTreffen({ ...stand, leben: 100 }, 10).stand;
    expect(stand.schild).toBe(true);
    stand = zugBeenden(stand, [1, 2]);
    expect(stand.amZug).toBe(2);
    expect(stand.schild).toBe(false);
    stand = zugBeenden(stand, [1, 2]);
    expect(stand.amZug).toBe('boss');
  });

  it('entfernt besiegte Diener gezielt', () => {
    const stand = bossStarten({ ...STURMDRACHE, startDiener: 3 }, [1, 2], () => 0);
    const nach = dienerBesiegen(stand, 2);
    expect(nach.diener.map((d) => d.nr)).toEqual([1, 3]);
  });

  it('trägt einen Boss-Zug ein und beginnt die nächste Runde', () => {
    const stand = {
      ...bossStarten(STURMDRACHE, [1, 2], () => 0),
      leben: 120,
      amZug: 'boss' as const,
    };
    const zug: BossZug = {
      phase: 1,
      stimmung: 'wuetend',
      spruch: 'Grr',
      aktionen: [{ id: 'auge', name: 'Auge des Sturms', text: '…', schlagworte: ['heilung'] }],
      lebenAenderungen: [{ spielerId: 2, um: -6 }],
      heilung: 12,
      schutz: 0,
      neueDiener: [STURMDRACHE.diener[0], STURMDRACHE.diener[1]],
      angriffsziel: 1,
      ankuendigung: null,
      spezialAngekuendigt: false,
    };
    const nach = bossZugEintragen(stand, zug, spieler);
    expect(nach.leben).toBe(132);
    expect(nach.lebenVorher).toBe(120);
    expect(nach.runde).toBe(2);
    expect(nach.amZug).toBe(1);
    expect(nach.diener.length).toBe(STURMDRACHE.startDiener + 2);
    expect(nach.letzteAktionen).toEqual(['auge']);
    expect(nach.protokoll[0]).toMatchObject({
      angriffsziel: 'Jo',
      lebenAenderungen: [{ name: 'Flo', um: -6 }],
    });
  });
});
