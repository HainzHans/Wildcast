import { Variante, VarianteId } from '../core/spiel/modell';

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
      'Würfel 1 entscheidet die Art: positiv (65 %), negativ für dich (31,5 %) oder Chaos für alle (3,5 %).',
      'Würfel 2 entscheidet die Form: normal, verrückt, Verzauberung (zerstörbar) oder Emblem (bleibt für immer).',
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
