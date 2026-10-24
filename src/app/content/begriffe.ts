import { Art, Form } from '../core/spiel/modell';

/**
 * Alle spielbezogenen Begriffe an einer Stelle. Für eine spielneutrale Fassung
 * (Fan Content Policy) reicht es, sie hier auszutauschen.
 */
export const ENERGIE = 'Mana';

export const ART_NAME: Record<Art, string> = {
  positiv: 'Positiv',
  negativ: 'Negativ',
  chaos: 'Chaos',
};

export const FORM_NAME: Record<Form, string> = {
  normal: 'Normal',
  verrueckt: 'Verrückt',
  verzauberung: 'Verzauberung',
  emblem: 'Emblem',
};

/** Kurzer Kommentar zur gewählten Manamenge im Wirken-Dialog. */
export function stufe(mana: number): string {
  if (mana === 42) return 'Die Antwort';
  if (mana > 20) return 'Übermut';
  if (mana >= 13) return 'Weltuntergang';
  if (mana >= 7) return 'Große Nummer';
  if (mana >= 4) return 'Ernsthaft';
  if (mana >= 2) return 'Kleinkram';
  return 'Funke';
}
