import type { Spieler } from '../../core/spiel/modell';
import type { Zufall } from '../../core/zufall';
import { Welt, WeltAuswahl, weltMitId, WELTEN } from './welten';

/** Beim Einrichten festgelegt: welche Welten kommen und nach wie vielen Runden sie wechseln. */
export interface WeltEinstellungen {
  auswahl: WeltAuswahl;
  intervall: number;
}

export const STANDARD_WELTEN: WeltEinstellungen = { auswahl: 'alle', intervall: 3 };
export const INTERVALLE = [1, 2, 3, 4, 5, 6];

export interface WeltStand {
  auswahl: WeltAuswahl;
  intervall: number;
  /** Eine Runde ist vorbei, wenn jeder Spieler einmal dran war. */
  runde: number;
  aktuell: string;
  /** Runde, in der die aktuelle Welt erschienen ist. */
  seitRunde: number;
  /** Gemischte Welten, die noch nicht dran waren. */
  stapel: string[];
  verlauf: { id: string; vonRunde: number }[];
}

/** Die Welten, die bei dieser Auswahl und Spielerzahl vorkommen können. */
export function weltenFuer(auswahl: WeltAuswahl, spielerAnzahl: number): Welt[] {
  return WELTEN.filter(
    (w) => (auswahl === 'alle' || w.art === auswahl) && spielerAnzahl >= (w.abSpielern ?? 0),
  );
}

function mischen<T>(liste: T[], zufall: Zufall): T[] {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Neuer Stapel ohne die Welt, die gerade gilt – so kommt keine zweimal hintereinander. */
function neuerStapel(auswahl: WeltAuswahl, spielerAnzahl: number, ohne: string, zufall: Zufall) {
  const ids = weltenFuer(auswahl, spielerAnzahl)
    .map((w) => w.id)
    .filter((id) => id !== ohne);
  return mischen(ids, zufall);
}

export function weltenStarten(
  einstellungen: WeltEinstellungen,
  spielerAnzahl: number,
  zufall: Zufall,
): WeltStand {
  const [erste, ...stapel] = neuerStapel(einstellungen.auswahl, spielerAnzahl, '', zufall);
  return {
    auswahl: einstellungen.auswahl,
    intervall: Math.max(1, Math.round(einstellungen.intervall)),
    runde: 1,
    aktuell: erste,
    seitRunde: 1,
    stapel,
    verlauf: [{ id: erste, vonRunde: 1 }],
  };
}

/** Runden, bis die nächste Welt erscheint (1 = nach dieser Runde). */
export function rundenBisWechsel(stand: WeltStand): number {
  return stand.seitRunde + stand.intervall - stand.runde;
}

/** Beendet die Runde. Ist das Intervall um, erscheint die nächste Welt vom Stapel. */
export function rundeBeenden(
  stand: WeltStand,
  spielerAnzahl: number,
  zufall: Zufall,
): { stand: WeltStand; neu: Welt | null } {
  const runde = stand.runde + 1;
  if (runde - stand.seitRunde < stand.intervall) return { stand: { ...stand, runde }, neu: null };

  const stapel = stand.stapel.length
    ? stand.stapel
    : neuerStapel(stand.auswahl, spielerAnzahl, stand.aktuell, zufall);
  const [naechste, ...rest] = stapel;
  return {
    stand: {
      ...stand,
      runde,
      aktuell: naechste,
      seitRunde: runde,
      stapel: rest,
      verlauf: [...stand.verlauf, { id: naechste, vonRunde: runde }],
    },
    neu: weltMitId(naechste) ?? null,
  };
}

/** Trägt die Lebensänderung ein, die eine Welt beim Erscheinen auslöst. */
export function lebenBeimErscheinen(welt: Welt, spieler: Spieler[]): Spieler[] {
  const leben = welt.erscheinen?.leben;
  if (leben === undefined || !spieler.length) return spieler;
  if (typeof leben === 'number') return spieler.map((p) => ({ ...p, leben: p.leben + leben }));
  if (leben === 'durchschnitt') {
    const schnitt = Math.ceil(spieler.reduce((s, p) => s + p.leben, 0) / spieler.length);
    return spieler.map((p) => ({ ...p, leben: schnitt }));
  }
  // Nach links weiterreichen: Jeder übernimmt die Leben des Spielers rechts von ihm (davor).
  return spieler.map((p, i) => ({
    ...p,
    leben: spieler[(i - 1 + spieler.length) % spieler.length].leben,
  }));
}
