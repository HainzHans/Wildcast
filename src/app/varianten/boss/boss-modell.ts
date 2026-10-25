/**
 * Datenmodell des Boss-Modus. Ein Boss ist reine Beschreibung (Leben, Diener, Aktionen, Sprüche);
 * die Logik in `boss-logik.ts` entscheidet daraus jeden Boss-Zug. So können später weitere Bosse
 * als Daten dazukommen, auch aus Supabase.
 */

export type Phase = 1 | 2 | 3;

/** Wie der Boss die Lage einschätzt. Bestimmt, welche Art von Aktion er bevorzugt. */
export type Stimmung = 'wuetend' | 'bedroht' | 'ueberlegen' | 'verzweifelt' | 'lauernd';

export type Schlagwort = 'angriff' | 'kontrolle' | 'beschwoerung' | 'heilung';

/** Fragen, die der Boss am Tisch stellen kann. Die App selbst kennt nur Leben, Diener und Runden. */
export type FrageId =
  | 'kreaturen'
  | 'grosseKreatur'
  | 'flieger'
  | 'bleibende'
  | 'handkarten'
  | 'kommandeur'
  | 'friedhof'
  | 'rache';

/** Fragen, deren Antworten die Spieler selbst sind. */
export const SPIELER_FRAGEN: FrageId[] = ['handkarten', 'rache'];

export interface Antwort {
  wert: string;
  label: string;
}

export interface Frage {
  id: FrageId;
  text: string;
  /** Feste Antworten; bei Spieler-Fragen ergänzt die Logik die Spielernamen davor. */
  antworten: Antwort[];
}

export type Antworten = Partial<Record<FrageId, string>>;

/**
 * Wen eine Lebensänderung trifft. Die App löst das selbst auf, weil sie alle Leben kennt.
 * `rache` meint den Spieler, den die Spieler auf die Rache-Frage genannt haben.
 */
export type Ziel = 'meisteLeben' | 'wenigsteLeben' | 'alle' | 'rache';

export interface DienerVorlage {
  name: string;
  staerke: number;
  widerstand: number;
  faehigkeit?: string;
  /** Wird beim Angreifen nicht getappt. */
  wachsamkeit?: boolean;
  /** Greift schon in dem Zug an, in dem er erscheint. */
  eile?: boolean;
  /** Greift nie an (z. B. reine Blocker). */
  greiftNichtAn?: boolean;
}

export interface BossAktion {
  id: string;
  name: string;
  schlagworte: Schlagwort[];
  /** Grundgewicht bei der Auswahl. */
  gewicht: number;
  text: string;
  /** In welchen Phasen die Aktion vorkommt. Ohne Angabe: in allen. */
  phasen?: Phase[];
  /** Antworten, bei denen die Aktion besonders gut passt (Gewicht ×2 je Treffer). */
  bevorzugt?: Partial<Record<FrageId, string[]>>;
  /** Was die App automatisch umsetzt. Alles Weitere steht im Text und regeln die Spieler. */
  folgen?: {
    leben?: { ziel: Ziel; um: number };
    heilung?: number;
    /** Schaden, den der Boss bis zu seinem nächsten Zug verhindert. */
    schutz?: number;
    diener?: number;
    /** Ruft gezielt diesen Diener (Name aus der Diener-Liste) statt eines zufälligen. */
    dienerName?: string;
    /** Dauerhafte Stärkung aller Diener, auch der neu gerufenen. */
    dienerBonus?: { staerke: number; widerstand: number };
    /** Der Boss opfert so viele eigene Diener (die schwächsten zuerst). */
    dienerOpfern?: number;
    /** Heilt einen Anteil des Schadens, den er seit seinem letzten Zug erlitten hat. */
    heilungAusVerlust?: { anteil: number; max: number };
    /** Der Boss handelt in diesem Zug noch ein weiteres Mal. */
    extraAktion?: boolean;
  };
}

/**
 * Charakterzug für eine Partie. Er verschiebt nur, welche Art von Aktion der Boss lieber nimmt –
 * nicht, wie stark er ist. So spielt sich derselbe Boss jedes Mal etwas anders.
 */
export type Temperament = 'jaehzornig' | 'listig' | 'bruetend' | 'zaeh' | 'unberechenbar';

/** Was jede Runde im Boss-Zug automatisch passiert, z. B. Gorvaks Hunger. */
export interface RundenEffekt {
  text: string;
  /** Jeder Spieler verliert so viele Leben … */
  leben?: number;
  /** … plus so viele pro Diener des Bosses … */
  lebenProDiener?: number;
  /** … höchstens so viele. */
  max?: number;
}

export interface BossDefinition {
  id: string;
  name: string;
  level: number;
  leben: number;
  passiv: string;
  diener: DienerVorlage[];
  /** Diener, mit denen der Boss ins Spiel kommt. */
  startDiener: number;
  fragen: Frage[];
  aktionen: BossAktion[];
  /** Spezialangriff in Phase 3, eine Runde vorher angekündigt. */
  spezial: BossAktion;
  ankuendigung: string;
  /** Einleitende Sprüche je Stimmung. Platzhalter: {verlust}, {schwaechster}, {boss}. */
  sprueche: Record<Stimmung, string[]>;
  /** Kurzer Untertitel für die Auswahl. */
  beschreibung: string;
  rundenEffekt?: RundenEffekt;
}

/** Alles, was der Boss zu Beginn seines Zuges über die Partie weiß. */
export interface Lage {
  runde: number;
  leben: number;
  maxLeben: number;
  /** Leben zu Beginn des vorigen Boss-Zugs, um Verluste zu erkennen. */
  lebenVorher: number;
  diener: number;
  spieler: { id: number; name: string; leben: number }[];
  antworten: Antworten;
  /** IDs der Aktionen aus dem vorigen Boss-Zug – die wiederholt er nie direkt. */
  letzteAktionen: string[];
  /** Ältere Aktionen, neueste zuletzt – die werden seltener. */
  verlauf: string[];
  /** Was er im vorigen Zug gefragt hat – das fragt er möglichst nicht gleich wieder. */
  letzteFragen: FrageId[];
  letzteSprueche: string[];
  spezialAngekuendigt: boolean;
  /** Charakterzug dieser Partie. */
  temperament?: Temperament;
  /** Aktionen, die der Boss in dieser Partie beherrscht. Ohne Angabe: alle. */
  repertoire?: string[];
}

export interface AusgefuehrteAktion {
  id: string;
  name: string;
  text: string;
  schlagworte: Schlagwort[];
}

export interface BossZug {
  phase: Phase;
  stimmung: Stimmung;
  spruch: string;
  /** Der Spruch vor dem Einsetzen der Platzhalter – damit er sich nicht gleich wiederholt. */
  spruchVorlage: string;
  aktionen: AusgefuehrteAktion[];
  lebenAenderungen: { spielerId: number; um: number }[];
  heilung: number;
  schutz: number;
  neueDiener: DienerVorlage[];
  dienerBonus: { staerke: number; widerstand: number };
  dienerOpfern: number;
  /** Was der Runden-Effekt diesmal ausgelöst hat (schon in lebenAenderungen enthalten). */
  rundenEffekt: string | null;
  /** Spieler, den die Diener angreifen; null ohne Diener. */
  angriffsziel: number | null;
  /** Ankündigung des Spezialangriffs für den nächsten Zug. */
  ankuendigung: string | null;
  spezialAngekuendigt: boolean;
}
