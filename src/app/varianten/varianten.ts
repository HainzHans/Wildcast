import { Variante, VarianteId, Werkzeug } from '../core/spiel/modell';

/**
 * Alle Spielvarianten. Eine neue Variante beschreibt hier, für wie viele Spieler sie gedacht ist
 * und welche Werkzeuge der Spieltisch einblendet.
 */
export const VARIANTEN: Variante[] = [
  {
    id: 'mana-wuerfel',
    name: 'Mana-Würfel',
    untertitel: 'Bezahle Mana, würfle einen Effekt – und hoffe auf das Beste.',
    spieler: { min: 2, max: 4, standard: 2 },
    startLeben: 40,
    regeln: [
      'Nur die Manamenge zählt, die Farbe ist egal.',
      'Effekte wirkst du jederzeit wie einen Spontanzauber. Sie gehen auf den Stapel, und Gegner können antworten – auch mit eigenen Effekten.',
      'Würfel 1 entscheidet die Art: positiv (65 %), negativ für dich (31,5 %) oder Chaos für alle (3,5 %).',
      'Würfel 2 entscheidet die Form: normal, verrückt, Kreatur oder Artefakt (als Spielstein), Verzauberung (zerstörbar) oder Emblem (bleibt für immer).',
      'Je mehr Mana, desto stärker der Effekt – in beide Richtungen.',
    ],
    werkzeuge: ['leben', 'effekt-wuerfel'],
    verfuegbar: true,
  },
  {
    id: 'boss',
    name: 'Bosskampf',
    untertitel: 'Zwei Spieler gegen einen Boss, der mit jeder Runde stärker wird.',
    spieler: { min: 2, max: 2, standard: 2 },
    startLeben: 40,
    regeln: [],
    werkzeuge: ['leben', 'boss'],
    verfuegbar: false,
  },
];

export function varianteMitId(id: string | undefined): Variante | undefined {
  return VARIANTEN.find((v) => v.id === id);
}

/** Eine oder mehrere Varianten, die gemeinsam in einer Partie laufen. */
export interface Kombination {
  ids: VarianteId[];
  varianten: Variante[];
  name: string;
  untertitel: string;
  spieler: Variante['spieler'];
  startLeben: number;
  werkzeuge: Werkzeug[];
}

/**
 * Legt Varianten zusammen: Die Spielerzahl muss für alle passen, Werkzeuge werden vereint.
 * Liefert `null`, wenn eine Variante fehlt, noch nicht spielbar ist oder die Spielerzahlen
 * sich nicht überschneiden.
 */
export function kombinieren(ids: readonly string[]): Kombination | null {
  const varianten = [...new Set(ids)].map(varianteMitId);
  if (!varianten.length || varianten.some((v) => !v?.verfuegbar)) return null;
  const liste = varianten as Variante[];

  const min = Math.max(...liste.map((v) => v.spieler.min));
  const max = Math.min(...liste.map((v) => v.spieler.max));
  if (min > max) return null;
  const standard = Math.min(Math.max(liste[0].spieler.standard, min), max);

  return {
    ids: liste.map((v) => v.id),
    varianten: liste,
    name: liste.map((v) => v.name).join(' + '),
    untertitel: liste.length === 1 ? liste[0].untertitel : 'Mehrere Varianten in einer Partie.',
    spieler: { min, max, standard },
    startLeben: Math.max(...liste.map((v) => v.startLeben)),
    werkzeuge: [...new Set(liste.flatMap((v) => v.werkzeuge))],
  };
}

/** Anzeigename für eine laufende Partie, z. B. „Mana-Würfel + Bosskampf“. */
export function variantenName(ids: readonly VarianteId[]): string {
  return ids.map((id) => varianteMitId(id)?.name ?? id).join(' + ');
}
