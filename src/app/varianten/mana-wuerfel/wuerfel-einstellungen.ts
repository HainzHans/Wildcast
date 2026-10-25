import { Art, Form } from '../../core/spiel/modell';
import { lesen, schreiben } from '../../core/speicher';

/** Ein Würfelergebnis mit seiner Wahrscheinlichkeit in Prozent; abgeschaltet heißt: kommt nie. */
export interface Gewicht {
  prozent: number;
  aktiv: boolean;
}

/** Hausregeln für den Mana-Würfel, beim Einrichten der Partie festgelegt. */
export interface WuerfelEinstellungen {
  arten: Record<Art, Gewicht>;
  formen: Record<Form, Gewicht>;
}

export const ARTEN: Art[] = ['positiv', 'negativ', 'chaos'];
export const FORMEN: Form[] = [
  'normal',
  'verrueckt',
  'kreatur',
  'artefakt',
  'verzauberung',
  'emblem',
];

/** Die Werte aus dem Briefing, erweitert um Kreaturen und Artefakte. */
export const STANDARD_WUERFEL: WuerfelEinstellungen = {
  arten: {
    positiv: { prozent: 65, aktiv: true },
    negativ: { prozent: 31.5, aktiv: true },
    chaos: { prozent: 3.5, aktiv: true },
  },
  formen: {
    normal: { prozent: 40, aktiv: true },
    verrueckt: { prozent: 15, aktiv: true },
    kreatur: { prozent: 15, aktiv: true },
    artefakt: { prozent: 10, aktiv: true },
    verzauberung: { prozent: 12, aktiv: true },
    emblem: { prozent: 8, aktiv: true },
  },
};

/** Summe der eingeschalteten Prozente einer Gruppe. */
export function summe<T extends string>(gruppe: Record<T, Gewicht>): number {
  return (Object.values(gruppe) as Gewicht[])
    .filter((g) => g.aktiv)
    .reduce((s, g) => s + Math.max(0, g.prozent), 0);
}

/** Würfelbar ist eine Einstellung, solange in jeder Gruppe noch etwas mit Gewicht übrig ist. */
export function istWuerfelbar(e: WuerfelEinstellungen): boolean {
  return summe(e.arten) > 0 && summe(e.formen) > 0;
}

/**
 * Tatsächliche Wahrscheinlichkeit eines Eintrags. Ergeben die eingeschalteten Werte nicht
 * genau 100 %, wird anteilig hochgerechnet – so bleibt jede Eingabe spielbar.
 */
export function anteil<T extends string>(gruppe: Record<T, Gewicht>, schluessel: T): number {
  const g = gruppe[schluessel];
  const s = summe(gruppe);
  return g.aktiv && s > 0 ? Math.max(0, g.prozent) / s : 0;
}

const SCHLUESSEL = 'wildcast.mana-wuerfel.v1';

/** Zuletzt gespielte Hausregeln, damit die Runde sie nicht jedes Mal neu einstellen muss. */
export function letzteWuerfelEinstellungen(): WuerfelEinstellungen {
  const gespeichert = lesen<WuerfelEinstellungen>(SCHLUESSEL);
  if (!gespeichert) return STANDARD_WUERFEL;
  // Ältere Stände kannten Kreatur und Artefakt noch nicht: Dann gelten die neuen Standardformen.
  const formenAktuell = 'kreatur' in (gespeichert.formen ?? {});
  return {
    arten: { ...STANDARD_WUERFEL.arten, ...gespeichert.arten },
    formen: formenAktuell
      ? { ...STANDARD_WUERFEL.formen, ...gespeichert.formen }
      : STANDARD_WUERFEL.formen,
  };
}

export function merkeWuerfelEinstellungen(e: WuerfelEinstellungen): void {
  schreiben(SCHLUESSEL, e);
}
