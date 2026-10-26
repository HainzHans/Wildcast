import { zufallMitStartwert } from '../../core/zufall';
import { bossZug, freieRelikte, RELIKT_GRENZE, stimmung } from './boss-logik';
import { Lage } from './boss-modell';
import {
  bossLage,
  bossStarten,
  bossTreffen,
  bossZugEintragen,
  reliktTreffen,
  reliktZerstoeren,
} from './boss-stand';
import { KNOCHENFUERST } from './bosse/knochenfuerst';
import { SCHWARMKOENIGIN } from './bosse/schwarmkoenigin';
import { WELTENFRESSER } from './bosse/weltenfresser';
import { ZEITWEBER } from './bosse/zeitweber';

const spieler = [
  { id: 1, name: 'Jo', leben: 40 },
  { id: 2, name: 'Flo', leben: 40 },
];

function lage(aenderung: Partial<Lage> = {}): Lage {
  return {
    runde: 3,
    leben: 200,
    maxLeben: 200,
    lebenVorher: 200,
    diener: 2,
    spieler,
    antworten: {},
    letzteAktionen: [],
    verlauf: [],
    letzteFragen: [],
    letzteSprueche: [],
    spezialAngekuendigt: false,
    relikte: [],
    ...aenderung,
  };
}

describe('Artefakte und Verzauberungen des Bosses', () => {
  it('legt mit seiner Relikt-Aktion eine freie Karte aufs Feld', () => {
    const nurLegen = {
      ...SCHWARMKOENIGIN,
      aktionen: SCHWARMKOENIGIN.aktionen.filter((a) => a.folgen?.relikt),
    };
    const zug = bossZug(nurLegen, lage(), zufallMitStartwert(1));
    expect(SCHWARMKOENIGIN.relikte.map((r) => r.id)).toContain(zug.neuesRelikt?.id);
    expect(zug.neuesRelikt?.schaden).toBe(0);
  });

  it(`legt höchstens ${RELIKT_GRENZE} gleichzeitig und die Startkarte nie neu`, () => {
    const voll = lage({
      relikte: SCHWARMKOENIGIN.relikte.map((r) => ({ id: r.id, schaden: 0 })),
    });
    expect(freieRelikte(SCHWARMKOENIGIN, voll)).toEqual([]);
    const frei = freieRelikte(KNOCHENFUERST, lage()).map((r) => r.id);
    expect(frei).not.toContain('phylakterium');
    expect(frei).toContain('totenglocke');
  });

  it('wirkt in jedem Boss-Zug, solange die Karte liegt', () => {
    const zug = bossZug(
      SCHWARMKOENIGIN,
      lage({
        relikte: [
          { id: 'brutnest', schaden: 0 },
          { id: 'honigwabe', schaden: 0 },
        ],
        leben: 150,
      }),
      zufallMitStartwert(2),
    );
    expect(zug.neueDiener.filter((d) => d.name === 'Drohne').length).toBeGreaterThanOrEqual(2);
    expect(zug.heilung).toBeGreaterThanOrEqual(4);
    expect(zug.reliktEffekte.length).toBe(2);
  });

  it('löst nach Ablauf des Countdowns aus und verschwindet', () => {
    const zug = bossZug(
      WELTENFRESSER,
      lage({ relikte: [{ id: 'singularitaetskern', schaden: 0, countdown: 1 }] }),
      zufallMitStartwert(3),
    );
    expect(zug.abgelaufen).toEqual(['singularitaetskern']);
    for (const s of spieler) {
      const verlust = zug.lebenAenderungen
        .filter((l) => l.spielerId === s.id)
        .reduce((n, l) => n + l.um, 0);
      expect(verlust).toBeLessThanOrEqual(-15);
    }
  });

  it('zählt den Countdown herunter und trägt abgelaufene Karten aus', () => {
    const stand = {
      ...bossStarten(ZEITWEBER, zufallMitStartwert(4)),
      relikte: [
        { id: 'sanduhr', schaden: 0, countdown: 3 },
        { id: 'pendel', schaden: 2 },
      ],
    };
    const zug = bossZug(ZEITWEBER, bossLage(stand, spieler, {}), zufallMitStartwert(4));
    const nach = bossZugEintragen(stand, zug, spieler, {});
    expect(nach.relikte.find((l) => l.id === 'sanduhr')?.countdown).toBe(2);
    expect(nach.relikte.find((l) => l.id === 'pendel')?.schaden).toBe(2);
  });

  it('ist zerstört, sobald der Schaden ihre Verteidigung erreicht', () => {
    const start = bossStarten(KNOCHENFUERST, zufallMitStartwert(5));
    const halb = reliktTreffen(start, 'phylakterium', 5);
    expect(halb.relikte[0].schaden).toBe(5);
    expect(reliktTreffen(halb, 'phylakterium', -2).relikte[0].schaden).toBe(3);
    const weg = reliktTreffen(halb, 'phylakterium', 9);
    expect(weg.relikte).toEqual([]);
    expect(weg.verlorenesRelikt).toBe('phylakterium');
  });

  it('hält den Knochenfürsten mit dem Phylakterium bei mindestens 1 Leben', () => {
    const start = { ...bossStarten(KNOCHENFUERST, zufallMitStartwert(6)), leben: 20 };
    expect(start.relikte.map((l) => l.id)).toEqual(['phylakterium']);
    const { stand } = bossTreffen(start, 50);
    expect(stand.leben).toBe(1);
    const ohne = reliktZerstoeren(stand, 'phylakterium');
    expect(bossTreffen(ohne, 1).stand.leben).toBe(0);
  });

  it('reagiert wütend auf eine zerstörte Karte, mit eigenem Spruch', () => {
    const l = lage({ verlorenesRelikt: 'brutnest' });
    expect(stimmung(l)).toBe('wuetend');
    const zug = bossZug(SCHWARMKOENIGIN, l, zufallMitStartwert(7));
    expect(zug.spruch).toBe(SCHWARMKOENIGIN.relikte.find((r) => r.id === 'brutnest')?.zerstoert);
  });
});
