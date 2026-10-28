import type { Spieler } from '../../core/spiel/modell';
import type { Zufall } from '../../core/zufall';

/** Ein Segen gilt die ganze Partie. Pakte sind stärker, haben aber einen Haken. */
export interface Segen {
  id: string;
  name: string;
  text: string;
  pakt?: boolean;
  /** Einmal pro Partie einsetzbar – danach wird er abgehakt. */
  einmalig?: boolean;
  /** Startleben, das die App beim Wählen selbst einträgt. */
  leben?: number;
}

export interface SegenEinstellungen {
  /** So viele Segen bekommt jeder Spieler. */
  anzahl: number;
  pakte: boolean;
}

export const STANDARD_SEGEN: SegenEinstellungen = { anzahl: 3, pakte: true };
export const SEGEN_ANZAHL = [2, 3];

export const SEGEN: Segen[] = [
  {
    id: 'lebenskraft',
    name: 'Lebenskraft',
    text: 'Du startest mit 5 zusätzlichen Leben.',
    leben: 5,
  },
  {
    id: 'vorsprung',
    name: 'Vorsprung',
    text: 'Ziehe in deinem ersten Zug eine zusätzliche Karte.',
  },
  { id: 'kronjuwel', name: 'Kronjuwel', text: 'Dein Kommandeur kostet {1} weniger.' },
  {
    id: 'heldenrueckkehr',
    name: 'Heldenrückkehr',
    text: 'Deine Kommandeurssteuer beträgt nur {1} für jedes frühere Wirken aus der Kommandozone.',
  },
  {
    id: 'erstes-land',
    name: 'Erstes Land',
    text: 'Bringe zu Beginn der Partie ein Standardland aus deiner Bibliothek getappt ins Spiel und mische danach.',
  },
  {
    id: 'schatzsucher',
    name: 'Schatzsucher',
    text: 'Du beginnst die Partie mit zwei Schatz-Spielsteinen.',
  },
  {
    id: 'leibwache',
    name: 'Leibwache',
    text: 'Du beginnst die Partie mit einem 2/2 weißen Soldat-Kreaturenspielstein mit Wachsamkeit.',
  },
  {
    id: 'weitblick',
    name: 'Weitblick',
    text: 'Schau dir zu Beginn der Partie die obersten fünf Karten deiner Bibliothek an und lege sie in beliebiger Reihenfolge zurück.',
  },
  {
    id: 'gegenzauber',
    name: 'Bannwort',
    text: 'Neutralisiere einen Zauberspruch.',
    einmalig: true,
  },
  {
    id: 'rettung',
    name: 'Rettung',
    text: 'Wenn eine Kreatur, die du kontrollierst, sterben würde, nimm sie stattdessen auf die Hand.',
    einmalig: true,
  },
  {
    id: 'letzte-chance',
    name: 'Letzte Chance',
    text: 'Wenn deine Leben auf 0 oder weniger fallen würden, werden sie stattdessen auf 5 gesetzt.',
    einmalig: true,
  },
  {
    id: 'zauberkundig',
    name: 'Zauberkundig',
    text: 'Der erste Spontanzauber oder die erste Hexerei, die du in jedem Zug wirkst, kostet {1} weniger.',
  },
  { id: 'kriegsherr', name: 'Kriegsherr', text: 'Deine angreifenden Kreaturen erhalten +1/+0.' },
  { id: 'bollwerk', name: 'Bollwerk', text: 'Kreaturen, die du kontrollierst, erhalten +0/+1.' },
  {
    id: 'tiefe-taschen',
    name: 'Tiefe Taschen',
    text: 'Du hast keine maximale Handkartenzahl.',
  },
  {
    id: 'manafluss',
    name: 'Manafluss',
    text: 'Du darfst in jedem deiner Züge ein zusätzliches Land spielen.',
  },
  {
    id: 'erneuerung',
    name: 'Erneuerung',
    text: 'Mische deinen Friedhof in deine Bibliothek und ziehe drei Karten.',
    einmalig: true,
  },
  {
    id: 'vergeltung',
    name: 'Vergeltung',
    text: 'Immer wenn eine Kreatur, die du kontrollierst, stirbt, verliert jeder Gegner 1 Leben.',
  },
  { id: 'schnelle-klinge', name: 'Schnelle Klinge', text: 'Dein Kommandeur hat Eile.' },
  {
    id: 'wachsamer-held',
    name: 'Wachsamer Held',
    text: 'Dein Kommandeur erhält +1/+1 und hat Wachsamkeit.',
  },
  {
    id: 'pluenderer',
    name: 'Plünderer',
    text: 'Einmal in jedem Zug: Wenn eine Kreatur, die du kontrollierst, einem Gegner Kampfschaden zufügt, erzeuge einen Schatz-Spielstein.',
  },
  { id: 'ruhm', name: 'Ruhm', text: 'Ziehe drei Karten.', einmalig: true },
  {
    id: 'zweiter-atem',
    name: 'Zweiter Atem',
    text: 'Enttappe alle bleibenden Karten, die du kontrollierst.',
    einmalig: true,
  },
  {
    id: 'einsamer-wolf',
    name: 'Einsamer Wolf',
    text: 'Solange du genau eine Kreatur kontrollierst, erhält sie +3/+3 und Trampelschaden.',
  },

  // ── Pakte: stark, aber mit Haken ─────────────────────────────────
  {
    id: 'blutpakt',
    name: 'Blutpakt',
    text: 'Ziehe in deinem Ziehsegment eine zusätzliche Karte. Du startest mit 8 Leben weniger.',
    pakt: true,
    leben: -8,
  },
  {
    id: 'glaskanone',
    name: 'Glaskanone',
    text: 'Kreaturen, die du kontrollierst, erhalten +2/−1.',
    pakt: true,
  },
  {
    id: 'hochmut',
    name: 'Hochmut',
    text: 'Dein Kommandeur erhält +3/+3, kann aber nicht blocken.',
    pakt: true,
  },
  {
    id: 'schuldenberg',
    name: 'Schuldenberg',
    text: 'Du beginnst die Partie mit vier Schatz-Spielsteinen. Deine maximale Handkartenzahl ist fünf.',
    pakt: true,
  },
  {
    id: 'besessenheit',
    name: 'Besessenheit',
    text: 'Deine Zaubersprüche kosten {1} weniger. Immer wenn du einen Zauberspruch wirkst, verlierst du 1 Leben.',
    pakt: true,
  },
  {
    id: 'raserei',
    name: 'Raserei',
    text: 'Kreaturen, die du kontrollierst, erhalten +1/+0 und Eile und greifen in jedem Kampf an, falls möglich.',
    pakt: true,
  },
  {
    id: 'aderlass',
    name: 'Aderlass',
    text: 'Dein Kommandeur kostet {2} weniger. Du startest mit 10 Leben weniger.',
    pakt: true,
    leben: -10,
  },
  {
    id: 'seelenhandel',
    name: 'Seelenhandel',
    text: 'Immer wenn eine Kreatur, die du kontrollierst, stirbt, ziehst du eine Karte und verlierst 1 Leben.',
    pakt: true,
  },
  {
    id: 'offenes-buch',
    name: 'Offenes Buch',
    text: 'Ziehe in deinem Ziehsegment eine zusätzliche Karte. Du spielst mit offener Hand.',
    pakt: true,
  },
];

export function segenMitId(id: string): Segen | undefined {
  return SEGEN.find((s) => s.id === id);
}

/**
 * Der Draft: Jeder Spieler bekommt ein Päckchen mit einem Segen mehr, als er am Ende hat.
 * Er nimmt einen und gibt den Rest nach links weiter. Der letzte Segen jedes Päckchens verfällt.
 */
export interface SegenStand {
  anzahl: number;
  /** Päckchen in Spielerreihenfolge; Päckchen i startet bei Spieler i. */
  paeckchen: string[][];
  /** Wie viele Segen jeder schon hat (0 … anzahl). */
  schritt: number;
  /** Wer gerade wählt (Index in der Spielerliste). */
  waehler: number;
  /** Gewählte Segen je Spieler-Id. */
  gewaehlt: Record<number, string[]>;
  /** Eingesetzte einmalige Segen als „Spieler-Id:Segen-Id“. */
  benutzt: string[];
  fertig: boolean;
}

export function segenPool(pakte: boolean): Segen[] {
  return SEGEN.filter((s) => pakte || !s.pakt);
}

function mischen<T>(liste: T[], zufall: Zufall): T[] {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function segenStarten(
  e: SegenEinstellungen,
  spieler: Spieler[],
  zufall: Zufall,
): SegenStand {
  const groesse = e.anzahl + 1;
  const ids = mischen(segenPool(e.pakte), zufall).map((s) => s.id);
  return {
    anzahl: e.anzahl,
    paeckchen: spieler.map((_, i) => ids.slice(i * groesse, (i + 1) * groesse)),
    schritt: 0,
    waehler: 0,
    gewaehlt: Object.fromEntries(spieler.map((p) => [p.id, []])),
    benutzt: [],
    fertig: false,
  };
}

/** Das Päckchen, das der aktuelle Wähler gerade in der Hand hat. */
export function paeckchenIndex(stand: SegenStand): number {
  const n = stand.paeckchen.length;
  return (((stand.waehler - stand.schritt) % n) + n) % n;
}

export function aktuelleAuswahl(stand: SegenStand): Segen[] {
  if (stand.fertig) return [];
  return stand.paeckchen[paeckchenIndex(stand)].map((id) => segenMitId(id)!).filter(Boolean);
}

/** Der aktuelle Wähler nimmt einen Segen. Startleben werden sofort eingetragen. */
export function segenWaehlen(
  stand: SegenStand,
  spieler: Spieler[],
  segenId: string,
): { stand: SegenStand; spieler: Spieler[] } {
  const p = paeckchenIndex(stand);
  const segen = segenMitId(segenId);
  if (stand.fertig || !segen || !stand.paeckchen[p].includes(segenId)) return { stand, spieler };
  const wer = spieler[stand.waehler];
  const letzter = stand.waehler === spieler.length - 1;
  const schritt = letzter ? stand.schritt + 1 : stand.schritt;
  return {
    stand: {
      ...stand,
      paeckchen: stand.paeckchen.map((pk, i) => (i === p ? pk.filter((id) => id !== segenId) : pk)),
      gewaehlt: { ...stand.gewaehlt, [wer.id]: [...(stand.gewaehlt[wer.id] ?? []), segenId] },
      schritt,
      waehler: letzter ? 0 : stand.waehler + 1,
      fertig: schritt >= stand.anzahl,
    },
    spieler: segen.leben
      ? spieler.map((x) => (x.id === wer.id ? { ...x, leben: x.leben + segen.leben! } : x))
      : spieler,
  };
}

/** Einen einmaligen Segen abhaken – oder den Haken wieder entfernen. */
export function segenUmschalten(stand: SegenStand, spielerId: number, segenId: string): SegenStand {
  const schluessel = `${spielerId}:${segenId}`;
  return {
    ...stand,
    benutzt: stand.benutzt.includes(schluessel)
      ? stand.benutzt.filter((b) => b !== schluessel)
      : [...stand.benutzt, schluessel],
  };
}
