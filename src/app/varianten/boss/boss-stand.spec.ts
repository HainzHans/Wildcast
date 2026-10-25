import { BossZug, DienerVorlage } from './boss-modell';
import {
  bossLage,
  bossStarten,
  BossStand,
  bossTreffen,
  bossZugEintragen,
  dienerBesiegen,
  dienerTappen,
  schildAufheben,
} from './boss-stand';
import { STURMDRACHE } from './bosse/sturmdrache';
import { TEMPERAMENTE } from './boss-logik';
import { zufallMitStartwert } from '../../core/zufall';

const spieler = [
  { id: 1, name: 'Jo' },
  { id: 2, name: 'Flo' },
];

const normal: DienerVorlage = { name: 'Blitzwyrm', staerke: 2, widerstand: 2 };
const wachsam: DienerVorlage = {
  name: 'Donnergreif',
  staerke: 3,
  widerstand: 3,
  wachsamkeit: true,
};
const eilig: DienerVorlage = { name: 'Sturmfalke', staerke: 1, widerstand: 1, eile: true };
const blocker: DienerVorlage = {
  name: 'Wolkenwächter',
  staerke: 1,
  widerstand: 4,
  greiftNichtAn: true,
};

function zug(aenderung: Partial<BossZug> = {}): BossZug {
  return {
    phase: 1,
    stimmung: 'wuetend',
    spruch: 'Grr',
    spruchVorlage: 'Grr',
    aktionen: [{ id: 'auge', name: 'Auge des Sturms', text: '…', schlagworte: ['heilung'] }],
    lebenAenderungen: [],
    heilung: 0,
    schutz: 0,
    neueDiener: [],
    dienerBonus: { staerke: 0, widerstand: 0 },
    dienerOpfern: 0,
    rundenEffekt: null,
    angriffsziel: 1,
    ankuendigung: null,
    spezialAngekuendigt: false,
    spezialEingesetzt: false,
    ...aenderung,
  };
}

function mitDienern(...diener: DienerVorlage[]): BossStand {
  return {
    ...bossStarten({ ...STURMDRACHE, startDiener: 0 }, () => 0),
    diener: diener.map((d, i) => ({ ...d, nr: i + 1, getappt: false })),
    naechsteNr: diener.length + 1,
  };
}

describe('Boss-Stand', () => {
  it('startet mit vollen Leben und Startdienern', () => {
    const stand = bossStarten(STURMDRACHE, () => 0);
    expect(stand.leben).toBe(160);
    expect(stand.diener.length).toBe(STURMDRACHE.startDiener);
    expect(stand.diener.every((d) => !d.getappt)).toBe(true);
  });

  it('hält den Phasen-Schild, bis jemand ihn für den nächsten Zug aufhebt', () => {
    let stand = bossTreffen({ ...bossStarten(STURMDRACHE, () => 0), leben: 100 }, 10).stand;
    expect(stand.schild).toBe(true);
    expect(bossTreffen(stand, 5).verfallen).toBe(5);
    stand = schildAufheben(stand);
    expect(bossTreffen(stand, 5).stand.leben).toBe(91);
  });

  it('entfernt besiegte Diener gezielt und tappt sie auf Wunsch', () => {
    const stand = mitDienern(normal, wachsam, eilig);
    expect(dienerBesiegen(stand, 2).diener.map((d) => d.nr)).toEqual([1, 3]);
    expect(dienerTappen(stand, 1).diener[0].getappt).toBe(true);
    expect(dienerTappen(dienerTappen(stand, 1), 1).diener[0].getappt).toBe(false);
  });

  describe('Angriff wie in Magic', () => {
    it('tappt Angreifer, außer mit Wachsamkeit; reine Blocker greifen nicht an', () => {
      const nach = bossZugEintragen(mitDienern(normal, wachsam, blocker), zug(), spieler, {});
      expect(nach.diener.map((d) => d.getappt)).toEqual([true, false, false]);
      expect(nach.protokoll[0].angreifer).toBe(2);
    });

    it('lässt neue Diener nur mit Eile sofort angreifen', () => {
      const nach = bossZugEintragen(
        mitDienern(),
        zug({ neueDiener: [normal, eilig] }),
        spieler,
        {},
      );
      expect(nach.diener.map((d) => [d.name, d.getappt])).toEqual([
        ['Blitzwyrm', false],
        ['Sturmfalke', true],
      ]);
      expect(nach.protokoll[0].angreifer).toBe(1);
    });

    it('enttappt zu Beginn des Boss-Zugs alle Diener', () => {
      const stand = dienerTappen(mitDienern(blocker), 1);
      const nach = bossZugEintragen(stand, zug(), spieler, {});
      expect(nach.diener[0].getappt).toBe(false);
    });

    it('greift ohne Ziel nicht an', () => {
      const nach = bossZugEintragen(mitDienern(normal), zug({ angriffsziel: null }), spieler, {});
      expect(nach.diener[0].getappt).toBe(false);
      expect(nach.protokoll[0]).toMatchObject({ angreifer: 0, angriffsziel: null });
    });
  });

  it('trägt einen Boss-Zug ein und beginnt die nächste Runde', () => {
    const stand = { ...mitDienern(normal), leben: 120 };
    const nach = bossZugEintragen(
      stand,
      zug({ heilung: 12, lebenAenderungen: [{ spielerId: 2, um: -6 }] }),
      spieler,
      { kreaturen: '3-5' },
    );
    expect(nach.leben).toBe(132);
    expect(nach.lebenVorher).toBe(120);
    expect(nach.runde).toBe(2);
    expect(nach.letzteAktionen).toEqual(['auge']);
    expect(nach.protokoll[0]).toMatchObject({
      angriffsziel: 'Jo',
      lebenAenderungen: [{ name: 'Flo', um: -6 }],
    });
  });

  it('merkt sich Fragen, Antworten, Aktionen und Sprüche – Rache nur für eine Runde', () => {
    const nach = bossZugEintragen(mitDienern(), zug(), spieler, { kreaturen: '10+', rache: '2' });
    expect(nach.letzteFragen).toEqual(['kreaturen', 'rache']);
    expect(nach.gemerkteAntworten).toEqual({ kreaturen: '10+' });
    expect(nach.verlauf).toEqual(['auge']);
    expect(nach.letzteSprueche).toEqual(['Grr']);

    const lage = bossLage(nach, [{ id: 1, name: 'Jo', leben: 40 }], { grosseKreatur: 'ja' });
    expect(lage.antworten).toEqual({ kreaturen: '10+', grosseKreatur: 'ja' });
  });

  it('würfelt Temperament und Repertoire beim Start', () => {
    const stand = bossStarten(STURMDRACHE, zufallMitStartwert(3));
    expect(Object.keys(TEMPERAMENTE)).toContain(stand.temperament);
    expect(stand.repertoire.length).toBeLessThan(STURMDRACHE.aktionen.length);
  });

  it('opfert die schwächsten Diener und stärkt die übrigen dauerhaft', () => {
    const stand = mitDienern(wachsam, normal, eilig);
    const nach = bossZugEintragen(
      stand,
      zug({ dienerOpfern: 1, dienerBonus: { staerke: 1, widerstand: 1 }, angriffsziel: null }),
      spieler,
      {},
    );
    expect(nach.diener.map((d) => [d.name, d.staerke, d.widerstand])).toEqual([
      ['Donnergreif', 4, 4],
      ['Blitzwyrm', 3, 3],
    ]);
  });
});
