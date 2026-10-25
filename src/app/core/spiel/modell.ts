import type { WuerfelEinstellungen } from '../../varianten/mana-wuerfel/wuerfel-einstellungen';

/** Kennung einer Spielvariante. Neue Varianten kommen hier dazu. */
export type VarianteId = 'mana-wuerfel' | 'boss';

/** Werkzeuge, die eine Variante auf dem Spieltisch einblendet. */
export type Werkzeug = 'leben' | 'effekt-wuerfel' | 'boss';

export interface Variante {
  id: VarianteId;
  name: string;
  untertitel: string;
  spieler: { min: number; max: number; standard: number };
  startLeben: number;
  regeln: string[];
  werkzeuge: Werkzeug[];
  /** Noch nicht spielbare Varianten erscheinen als „Kommt bald“. */
  verfuegbar: boolean;
}

export interface Spieler {
  id: number;
  name: string;
  leben: number;
}

/** Würfel 1: wen der Effekt trifft. */
export type Art = 'positiv' | 'negativ' | 'chaos';

/** Würfel 2: wie der Effekt wirkt. */
export type Form = 'normal' | 'verrueckt' | 'kreatur' | 'artefakt' | 'verzauberung' | 'emblem';

/** Ein gewürfelter Effekt, so wie er im Spiel gelandet ist. */
export interface Effekt {
  nr: number;
  vorlage: string;
  mana: number;
  art: Art;
  form: Form;
  name: string;
  text: string;
  spruch: string;
  /** Spieler, der bezahlt hat. */
  spielerId: number;
  zeit: string;
  /** Nur Verzauberungen können zerstört werden. */
  zerstoert?: boolean;
}

export interface Spielstand {
  /** Eine Partie kann mehrere Varianten gleichzeitig spielen. */
  varianten: VarianteId[];
  gestartet: string;
  spieler: Spieler[];
  effekte: Effekt[];
  /** Hausregeln der einzelnen Varianten, beim Einrichten festgelegt. */
  optionen?: SpielOptionen;
}

export interface SpielOptionen {
  manaWuerfel?: WuerfelEinstellungen;
}
