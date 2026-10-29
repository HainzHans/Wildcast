import type { Mehrspieler } from './boss-mehrspieler';

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
  | 'rache'
  | 'beute'
  | 'gestorben';

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
    /** Der Boss legt eines seiner Artefakte oder eine Verzauberung aufs Feld. */
    relikt?: boolean;
  };
}

/**
 * Ein Artefakt oder eine Verzauberung des Bosses. Liegt offen auf seiner Seite und wirkt,
 * bis die Spieler es zerstören: mit einem passenden Entfernungszauber sofort oder, wie eine
 * Belagerung (Battle) in Magic, indem sie es angreifen, bis seine Verteidigung auf 0 fällt.
 */
export interface Relikt {
  id: string;
  name: string;
  typ: 'artefakt' | 'verzauberung';
  verteidigung: number;
  /** Was die Karte tut – auch das, was die Spieler selbst beachten müssen. */
  text: string;
  /** Was die App in jedem Boss-Zug automatisch umsetzt, solange die Karte liegt. */
  proZug?: {
    /** Jeder Spieler verliert so viele Leben. */
    leben?: number;
    heilung?: number;
    heilungProDiener?: number;
    schutz?: number;
    diener?: number;
    dienerName?: string;
  };
  /** Liegt die Karte so viele Boss-Züge, löst sie `ablauf` aus und verschwindet. */
  countdown?: number;
  ablauf?: { text: string; leben?: number; heilung?: number };
  /** Solange die Karte liegt, fällt der Boss nicht unter 1 Leben. */
  unsterblich?: boolean;
  /** Was der Boss sagt, wenn die Spieler die Karte zerstören. */
  zerstoert: string;
}

/**
 * Charakterzug für eine Partie. Er verschiebt nur, welche Art von Aktion der Boss lieber nimmt –
 * nicht, wie stark er ist. So spielt sich derselbe Boss jedes Mal etwas anders.
 */
export type Temperament = 'jaehzornig' | 'listig' | 'bruetend' | 'zaeh' | 'unberechenbar';

/**
 * Wie weit der Boss vorausdenkt. „Instinkt“ ist das ursprüngliche Verhalten (Stimmung,
 * Temperament, Antworten). Taktiker und Gerissen rechnen zusätzlich jede Aktion zwei Runden
 * voraus und bevorzugen, was sich lohnt – ohne dabei berechenbar zu werden.
 */
export type Planerstufe = 'instinkt' | 'taktiker' | 'gerissen';

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

/** Ein Körper eines Bosses mit mehreren Gestalten oder Teilen, z. B. Morwens Spiegelbild. */
export interface KoerperDef {
  id: string;
  name: string;
  /** Anteil an den Gesamtleben des Bosses. */
  anteil: number;
  /** Fällt dieser Teil, ist der Boss besiegt. */
  haupt?: boolean;
  /** Solange er lebt: Der Boss handelt einmal mehr pro Zug. */
  extraAktion?: boolean;
  /** Solange er lebt: So viel heilt der Boss in jedem seiner Züge. */
  heilung?: number;
  /** Solange er lebt: So viele Leben verliert jeder Spieler in jedem Boss-Zug. */
  schaden?: number;
  /** Was der Teil bewirkt – steht auf seiner Karte. */
  wirkung: string;
}

/** Ein Teufelspakt des Dämonenfürsten: sofort ein Vorteil, dafür bekommt er eine Seele. */
export interface Pakt {
  id: string;
  name: string;
  text: string;
  /** Leben, die die App beim Annehmen einträgt. */
  leben?: number;
}

/**
 * Das eigene Merkmal eines Bosses – was ihn von allen anderen unterscheidet. Die App setzt es um
 * und zeigt es als Leiste, Zustand, mehrere Körper oder eigene Ziele (Eier) an.
 */
export type MerkmalRegel =
  | {
      art: 'koerper';
      teile: KoerperDef[];
      /** Fällt ein Teil, holt ihn der andere nach so vielen Boss-Zügen zurück. */
      wiederkehr?: { zuege: number; anteil: number };
      /** Nach so vielen Boss-Zügen verlieren die Spieler. */
      weltende?: number;
    }
  | { art: 'nebel'; max: number; halbierenAb: number; hinterhalt: number }
  | { art: 'hunger'; max: number; heilung: number }
  | { art: 'flug'; himmel: number; feueratem: number }
  | { art: 'totenarmee'; dienerName: string; max: number }
  | { art: 'brut'; schluepfen: number; drohnen: number; dienerName: string; schildMax: number }
  | {
      art: 'hitze';
      proZug: number;
      ausbruchAb: number;
      schadenProKuehlung: number;
      ausbruch: number;
    }
  | { art: 'zeitschleife'; alle: number; zurueck: number; reissenAnteil: number }
  | { art: 'pakte'; pakte: Pakt[]; heilungProSeele: number; stufe: number };

export type Merkmal = MerkmalRegel & {
  name: string;
  /** Kurz erklärt für die Boss-Karte und das Einrichten. */
  text: string;
};

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
  /** Artefakte und Verzauberungen, die der Boss ins Spiel bringen kann. */
  relikte: Relikt[];
  /** Liegt schon zu Kampfbeginn (z. B. das Phylakterium des Knochenfürsten). */
  startRelikt?: string;
  /** Was diesen Boss einzigartig macht. */
  merkmal?: Merkmal;
  /** Gesetzt, wenn er gegen mehr als zwei Spieler antritt (siehe `fuerSpielerzahl`). */
  mehrspieler?: Mehrspieler;
}

/**
 * Laufender Zustand des Merkmals. Ein gemeinsames Format für alle Bosse; jeder nutzt die Felder,
 * die er braucht.
 */
export interface MerkmalStand {
  /** Leiste: Nebel, Hunger, Hitze, Seelen, Zähler der Zeitschleife oder Weltende-Countdown. */
  wert: number;
  /** Zustand, z. B. 'himmel' oder 'boden' beim Sturmdrachen, 'ausgehungert' bei Gorvak. */
  zustand?: string;
  /** Boss-Züge bis zum nächsten Zustandswechsel. */
  zuege?: number;
  /** Mehrere Körper mit eigenen Leben. */
  teile?: { id: string; leben: number; max: number }[];
  /** Ein gefallener Körper, der zurückkehrt. */
  wiederkehr?: { id: string; zuege: number } | null;
  /** Eier der Schwarmkönigin. */
  eier?: { nr: number; countdown: number }[];
  naechstesEi?: number;
  /** Leben zu Beginn der letzten Boss-Züge (Zeitschleife). */
  verlauf?: number[];
  /** Pakte, die die Spieler noch annehmen oder ablehnen. */
  offen?: { spielerId: number; pakt: string }[];
  /** Erreichte Seelenstufen, damit jede Stufe nur einmal wirkt. */
  stufen?: number;
}

/** Eine Karte des Bosses auf dem Tisch. */
export interface LiegendesRelikt {
  id: string;
  /** Schaden, den die Spieler der Karte schon zugefügt haben. */
  schaden: number;
  /** Boss-Züge bis zum Ablauf, falls die Karte einen Countdown hat. */
  countdown?: number;
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
  /** Den Spezialangriff setzt der Boss nur einmal pro Kampf ein. */
  spezialEingesetzt?: boolean;
  /** Charakterzug dieser Partie. */
  temperament?: Temperament;
  /** Aktionen, die der Boss in dieser Partie beherrscht. Ohne Angabe: alle. */
  repertoire?: string[];
  /** Seine Karten auf dem Tisch. */
  relikte?: LiegendesRelikt[];
  /** Die Karte, die die Spieler seit seinem letzten Zug zerstört haben – das macht ihn wütend. */
  verlorenesRelikt?: string;
  /** Summe der Stärke seiner Diener, die angreifen können. */
  dienerMacht?: number;
  /** Wie weit er vorausdenkt. Ohne Angabe: Instinkt. */
  planer?: Planerstufe;
  /** Zustand seines Merkmals. */
  merkmal?: MerkmalStand;
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
  /** Ob in diesem Zug der Spezialangriff kam. */
  spezialEingesetzt: boolean;
  /** Karte, die der Boss in diesem Zug neu legt. */
  neuesRelikt: LiegendesRelikt | null;
  /** Was seine liegenden Karten in diesem Zug bewirkt haben (schon eingerechnet). */
  reliktEffekte: string[];
  /** Karten, deren Countdown abgelaufen ist – sie haben ausgelöst und verschwinden. */
  abgelaufen: string[];
  /** Was das Merkmal in diesem Zug getan hat und sein neuer Zustand. */
  merkmal?: MerkmalZug | null;
}

export interface MerkmalZug {
  stand: MerkmalStand;
  /** Was passiert ist, für Dialog und Protokoll. */
  texte: string[];
  /** Wirkungen auf Kreaturen der Spieler, die nur im Text stehen (wie bei Aktionen). */
  wirkungen: string[];
  /** Leben, die direkt dazukommen (Wiederkehr eines Körpers) – ohne Phasen-Deckel. */
  wiederbelebung: number;
  /** Der Boss frisst so viele eigene Diener (die stärksten zuerst). */
  dienerFressen: number;
}
