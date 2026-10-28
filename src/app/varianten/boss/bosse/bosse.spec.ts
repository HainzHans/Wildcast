import { zufallMitStartwert } from '../../../core/zufall';
import { bossZug, repertoireWaehlen, TEMPERAMENTE } from '../boss-logik';
import { BossDefinition, Lage, Schlagwort, Stimmung, Temperament } from '../boss-modell';
import { BOSSE } from '.';

const ARTEN: Schlagwort[] = ['angriff', 'kontrolle', 'beschwoerung', 'heilung'];
const STIMMUNGEN: Stimmung[] = ['wuetend', 'bedroht', 'ueberlegen', 'verzweifelt', 'lauernd'];

function lage(leben: number, maxLeben: number, aenderung: Partial<Lage> = {}): Lage {
  return {
    runde: 3,
    leben,
    maxLeben,
    lebenVorher: leben,
    diener: 3,
    spieler: [
      { id: 1, name: 'Jo', leben: 30 },
      { id: 2, name: 'Flo', leben: 30 },
    ],
    antworten: {},
    letzteAktionen: [],
    verlauf: [],
    letzteFragen: [],
    letzteSprueche: [],
    spezialAngekuendigt: false,
    ...aenderung,
  };
}

/**
 * Grobe Bedrohung pro Boss-Zug: direkter Lebensverlust der Spieler, Stärke neuer Diener,
 * Heilung/Schutz und Kontrolle. Nur ein Vergleichsmaß zwischen Bossen und Temperamenten.
 */
/**
 * Grobes Maß für die Gefahr eines Boss-Zugs. Ohne Merkmal: Was ein Merkmal wert ist (zwei
 * Gestalten, Nebel, Hitze …), misst nur die Bosskampf-Simulation sinnvoll.
 */
function bedrohung(def: BossDefinition, seed: number, temperament?: Temperament): number {
  const boss = { ...def, merkmal: undefined };
  const zufall = zufallMitStartwert(seed);
  let summe = 0;
  const zuege = 1500;
  for (let i = 0; i < zuege; i++) {
    const leben = Math.round(boss.leben * (0.2 + zufall() * 0.8));
    const l = lage(leben, boss.leben, {
      temperament,
      repertoire: repertoireWaehlen(boss, zufall),
      spezialAngekuendigt: zufall() < 0.5,
    });
    const z = bossZug(boss, l, zufall);
    summe -= z.lebenAenderungen.reduce((s, x) => s + x.um, 0);
    summe += 1.2 * (z.neueDiener.reduce((s, d) => s + d.staerke, 0) + z.dienerBonus.staerke * 4);
    summe += 0.5 * (z.heilung + z.schutz * 0.7);
    summe += 3 * z.aktionen.filter((a) => a.schlagworte.includes('kontrolle')).length;
  }
  return summe / zuege;
}

describe('Alle Bosse', () => {
  it('gibt es für Level 1 bis 10, mit steigenden Leben', () => {
    expect(BOSSE.map((b) => b.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (let i = 1; i < BOSSE.length; i++) {
      expect(BOSSE[i].leben).toBeGreaterThan(BOSSE[i - 1].leben);
    }
    expect(new Set(BOSSE.map((b) => b.id)).size).toBe(10);
  });

  for (const boss of BOSSE) {
    describe(boss.name, () => {
      it('hat eindeutige Aktionen und von jeder Art mindestens zwei', () => {
        const ids = boss.aktionen.map((a) => a.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).not.toContain(boss.spezial.id);
        for (const art of ARTEN) {
          const anzahl = boss.aktionen.filter((a) => a.schlagworte.includes(art)).length;
          expect(anzahl, art).toBeGreaterThanOrEqual(2);
        }
      });

      it('ruft nur Diener, die es gibt, und fragt nur, was er fragen kann', () => {
        const diener = boss.diener.map((d) => d.name);
        const fragen = boss.fragen.map((f) => f.id);
        for (const a of [...boss.aktionen, boss.spezial]) {
          if (a.folgen?.dienerName) expect(diener, a.id).toContain(a.folgen.dienerName);
          for (const frage of Object.keys(a.bevorzugt ?? {})) expect(fragen, a.id).toContain(frage);
        }
      });

      it('hat eigene Artefakte oder Verzauberungen und eine Aktion, die sie legt', () => {
        const ids = boss.relikte.map((r) => r.id);
        expect(ids.length).toBeGreaterThanOrEqual(1);
        expect(new Set(ids).size).toBe(ids.length);
        expect(boss.aktionen.some((a) => a.folgen?.relikt)).toBe(true);
        if (boss.startRelikt) expect(ids).toContain(boss.startRelikt);
        for (const r of boss.relikte) {
          expect(r.verteidigung, r.id).toBeGreaterThan(0);
          if (r.proZug?.dienerName) {
            expect(
              boss.diener.map((d) => d.name),
              r.id,
            ).toContain(r.proZug.dienerName);
          }
          if (r.countdown) expect(r.ablauf, r.id).toBeDefined();
        }
      });

      it('hat für jede Stimmung mindestens fünf Sprüche', () => {
        for (const s of STIMMUNGEN) expect(boss.sprueche[s].length).toBeGreaterThanOrEqual(5);
      });

      it('wählt pro Partie ein Repertoire mit jeder Art von Aktion', () => {
        const zufall = zufallMitStartwert(boss.level);
        for (let i = 0; i < 20; i++) {
          const rep = repertoireWaehlen(boss, zufall);
          expect(rep.length).toBeGreaterThanOrEqual(Math.ceil(boss.aktionen.length * 0.8));
          for (const art of ARTEN) {
            const vorhanden = boss.aktionen.some(
              (a) => rep.includes(a.id) && a.schlagworte.includes(art),
            );
            expect(vorhanden, art).toBe(true);
          }
        }
      });
    });
  }

  // Die genaue Reihenfolge der Schwierigkeit prüft die Bosskampf-Simulation
  // (scripts/simulation), denn Brettlöschung, Start-Diener und Spezialangriff stecken nicht in
  // diesem groben Maß. Hier nur: kein Boss fällt deutlich unter seinen Vorgänger.
  it('wird über die Level hinweg gefährlicher', () => {
    const werte = BOSSE.map((b) => bedrohung(b, 11));
    for (let i = 1; i < werte.length; i++)
      expect(werte[i], BOSSE[i].name).toBeGreaterThan(werte[i - 1] * 0.85);
    expect(werte[9]).toBeGreaterThan(werte[0] * 1.5);
  });

  it('spielt sich je nach Temperament anders, bleibt aber gleich stark', () => {
    const boss = BOSSE[3];
    const zaehle = (t: Temperament) => {
      const zufall = zufallMitStartwert(5);
      const zaehler: Record<string, number> = {};
      for (let i = 0; i < 1500; i++) {
        const z = bossZug(boss, lage(120, boss.leben, { temperament: t }), zufall);
        for (const a of z.aktionen)
          for (const w of a.schlagworte) zaehler[w] = (zaehler[w] ?? 0) + 1;
      }
      return zaehler;
    };
    expect(zaehle('jaehzornig')['angriff']).toBeGreaterThan(zaehle('bruetend')['angriff']);
    expect(zaehle('bruetend')['beschwoerung']).toBeGreaterThan(
      zaehle('jaehzornig')['beschwoerung'],
    );

    for (const b of BOSSE) {
      const werte = (Object.keys(TEMPERAMENTE) as Temperament[]).map((t) => bedrohung(b, 11, t));
      const spanne = (Math.max(...werte) - Math.min(...werte)) / Math.min(...werte);
      expect(spanne, b.name).toBeLessThan(0.15);
    }
  });
});
