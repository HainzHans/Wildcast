import { Art, Form } from '../../core/spiel/modell';
import { zufallMitStartwert } from '../../core/zufall';
import { EFFEKT_POOL } from './effekt-pool';
import {
  ANTWORT,
  fuelleText,
  waehleVorlage,
  wuerfleArt,
  wuerfleEffekt,
  wuerfleForm,
} from './wuerfel';
import {
  anteil,
  istWuerfelbar,
  STANDARD_WUERFEL,
  WuerfelEinstellungen,
} from './wuerfel-einstellungen';

function mit(aenderung: (e: WuerfelEinstellungen) => void): WuerfelEinstellungen {
  const e: WuerfelEinstellungen = structuredClone(STANDARD_WUERFEL);
  aenderung(e);
  return e;
}

const ARTEN: Art[] = ['positiv', 'negativ', 'chaos'];
const FORMEN: Form[] = ['normal', 'verrueckt', 'verzauberung', 'emblem'];

describe('Würfel', () => {
  it('teilt die Art an den Grenzen richtig ein', () => {
    expect(wuerfleArt(0)).toBe('positiv');
    expect(wuerfleArt(0.6499)).toBe('positiv');
    expect(wuerfleArt(0.65)).toBe('negativ');
    expect(wuerfleArt(0.9649)).toBe('negativ');
    expect(wuerfleArt(0.965)).toBe('chaos');
  });

  it('teilt die Form an den Grenzen richtig ein', () => {
    expect(wuerfleForm(0.5499)).toBe('normal');
    expect(wuerfleForm(0.55)).toBe('verrueckt');
    expect(wuerfleForm(0.75)).toBe('verzauberung');
    expect(wuerfleForm(0.9)).toBe('emblem');
  });

  it('trifft die Wahrscheinlichkeiten über viele Würfe', () => {
    const zufall = zufallMitStartwert(7);
    const wuerfe = 100_000;
    const arten = { positiv: 0, negativ: 0, chaos: 0 };
    const formen = { normal: 0, verrueckt: 0, verzauberung: 0, emblem: 0 };
    for (let i = 0; i < wuerfe; i++) {
      const w = wuerfleEffekt(EFFEKT_POOL, 5, zufall);
      arten[w.art]++;
      formen[w.form]++;
    }
    expect(arten.positiv / wuerfe).toBeCloseTo(0.65, 2);
    expect(arten.negativ / wuerfe).toBeCloseTo(0.315, 2);
    expect(arten.chaos / wuerfe).toBeCloseTo(0.035, 2);
    expect(formen.normal / wuerfe).toBeCloseTo(0.55, 2);
    expect(formen.emblem / wuerfe).toBeCloseTo(0.1, 2);
  });

  it('hat für jede Kombination aus Art und Form mindestens eine Vorlage', () => {
    for (const art of ARTEN) {
      for (const form of FORMEN) {
        const treffer = EFFEKT_POOL.filter(
          (v) => v.art === art && v.form === form && v.mana[0] !== ANTWORT,
        );
        expect(treffer.length, `${art} · ${form}`).toBeGreaterThan(0);
      }
    }
  });

  it('hat eindeutige IDs', () => {
    const ids = EFFEKT_POOL.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ersetzt Platzhalter, rundet ab und bleibt mindestens bei 1', () => {
    expect(fuelleText('{m}', 5)).toBe('5');
    expect(fuelleText('{2m+1}', 3)).toBe('7');
    expect(fuelleText('{m/2}', 5)).toBe('2');
    expect(fuelleText('{m-1}', 1)).toBe('1');
    expect(fuelleText('{m}/{m} Drache', 8)).toBe('8/8 Drache');
  });

  it('nimmt bei passender Art und Form die Vorlage mit dem passenden Manabereich', () => {
    const vorlage = waehleVorlage(EFFEKT_POOL, 8, 'positiv', 'normal', () => 0);
    expect(vorlage.mana[0]).toBeLessThanOrEqual(8);
    expect(vorlage.mana[1]).toBeGreaterThanOrEqual(8);
  });

  it('weicht bei Mana außerhalb aller Bereiche auf den nächsten aus und begrenzt die Skalierung', () => {
    const wurf = wuerfleEffekt(EFFEKT_POOL, 30, zufallMitStartwert(1));
    const vorlage = EFFEKT_POOL.find((v) => v.id === wurf.vorlage)!;
    expect(vorlage.mana[1]).toBe(20);
    expect(wurf.mana).toBe(30);
  });

  it('überspringt kürzlich gewürfelte Vorlagen, solange es Alternativen gibt', () => {
    const erste = waehleVorlage(EFFEKT_POOL, 2, 'positiv', 'normal', () => 0);
    const zweite = waehleVorlage(EFFEKT_POOL, 2, 'positiv', 'normal', () => 0, [erste.id]);
    expect(zweite.id).not.toBe(erste.id);
  });

  it('liefert bei 42 Mana die Antwort', () => {
    // Erste Zahl entscheidet die Art (positiv), zweite die Form (egal).
    const folge = [0.1, 0.95, 0];
    const wurf = wuerfleEffekt(EFFEKT_POOL, ANTWORT, () => folge.shift() ?? 0);
    expect(wurf.text).toBe('Du gewinnst das Spiel.');
  });

  describe('mit Hausregeln', () => {
    it('würfelt abgeschaltete Formen nie', () => {
      const ohneEmblem = mit((e) => (e.formen.emblem.aktiv = false));
      const zufall = zufallMitStartwert(11);
      for (let i = 0; i < 5000; i++) {
        expect(wuerfleEffekt(EFFEKT_POOL, 6, zufall, [], ohneEmblem).form).not.toBe('emblem');
      }
      // Der oberste Wurf landet jetzt bei der letzten verbliebenen Form.
      expect(wuerfleForm(0.999, ohneEmblem)).toBe('verzauberung');
    });

    it('rechnet Summen ungleich 100 anteilig hoch', () => {
      const nurZwei = mit((e) => {
        e.arten.positiv.prozent = 30;
        e.arten.negativ.prozent = 10;
        e.arten.chaos.aktiv = false;
      });
      expect(anteil(nurZwei.arten, 'positiv')).toBeCloseTo(0.75);
      expect(wuerfleArt(0.74, nurZwei)).toBe('positiv');
      expect(wuerfleArt(0.76, nurZwei)).toBe('negativ');
    });

    it('trifft eigene Wahrscheinlichkeiten über viele Würfe', () => {
      const viertel = mit((e) => {
        for (const f of Object.values(e.formen)) f.prozent = 25;
      });
      const zufall = zufallMitStartwert(5);
      let verrueckt = 0;
      for (let i = 0; i < 40_000; i++)
        if (wuerfleForm(zufall(), viertel) === 'verrueckt') verrueckt++;
      expect(verrueckt / 40_000).toBeCloseTo(0.25, 2);
    });

    it('ist nicht würfelbar, wenn eine Gruppe nichts mehr übrig hat', () => {
      expect(istWuerfelbar(STANDARD_WUERFEL)).toBe(true);
      expect(
        istWuerfelbar(
          mit((e) => {
            e.arten.positiv.prozent = 0;
            e.arten.negativ.prozent = 0;
            e.arten.chaos.prozent = 0;
          }),
        ),
      ).toBe(false);
    });
  });
});
