import type { Planerstufe } from '../../varianten/boss/boss-modell';
import type { BossStand } from '../../varianten/boss/boss-stand';
import type { WuerfelEinstellungen } from '../../varianten/mana-wuerfel/wuerfel-einstellungen';
import type { BasarEinstellungen, BasarStand } from '../../varianten/basar/basar';
import type { SegenEinstellungen, SegenStand } from '../../varianten/segen/segen';
import type { SturmEinstellungen, SturmStand } from '../../varianten/untergang/sturm';
import type { WeltEinstellungen, WeltStand } from '../../varianten/welten/welt-stand';

/** Kennung einer Spielvariante. Neue Varianten kommen hier dazu. */
export type VarianteId = 'mana-wuerfel' | 'boss' | 'welten' | 'untergang' | 'segen' | 'basar';

/** Werkzeuge, die eine Variante auf dem Spieltisch einblendet. */
export type Werkzeug = 'leben' | 'effekt-wuerfel' | 'boss' | 'welt' | 'sturm' | 'segen' | 'basar';

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
  /** Nur im Bosskampf. */
  boss?: BossStand;
  /** Eine Runde ist vorbei, wenn jeder einmal dran war. Ältere Stände kannten sie nicht. */
  runde?: number;
  /** Nur im Weltenwandel. */
  welt?: WeltStand;
  /** Nur im Untergang. */
  sturm?: SturmStand;
  /** Nur mit Segen-Draft. */
  segen?: SegenStand;
  /** Nur mit Basar. */
  basar?: BasarStand;
}

export interface SpielOptionen {
  manaWuerfel?: WuerfelEinstellungen;
  bossId?: string;
  bossPlaner?: Planerstufe;
  welten?: WeltEinstellungen;
  sturm?: SturmEinstellungen;
  segen?: SegenEinstellungen;
  basar?: BasarEinstellungen;
}
