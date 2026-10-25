/**
 * Vereinfachte Spielermodelle für Commander-Precons. Keine Karte-für-Karte-Simulation, sondern
 * Profile aus den offiziellen Decklisten: wie schnell das Deck Mana aufbaut, wie viel davon in
 * Kreaturen fließt, wie groß und wie oft fliegend sie sind, wie oft es Gegner entfernt usw.
 */
export interface DeckProfil {
  name: string;
  kurz: string;
  /** Wahrscheinlichkeit pro Zug (ab Zug 1), einen Mana-Stein oder Ramp-Zauber zu spielen. */
  ramp: number;
  /** Anteil des Manas, der in Kreaturen und Spielsteine fließt. */
  kreaturAnteil: number;
  /** Stärke pro investiertem Mana bei „großen“ Kreaturen. */
  staerkeProMana: number;
  /** Wahrscheinlichkeit, dass ein Zug statt einer großen Kreatur kleine Spielsteine bringt. */
  spielsteine: number;
  /** Anzahl und Größe der Spielsteine. */
  spielsteinAnzahl: number;
  spielsteinGroesse: number;
  flieger: number;
  /** Wahrscheinlichkeit pro Zug, einen Boss-Diener gezielt zu entfernen (ab Zug 2). */
  entfernung: number;
  /** Wahrscheinlichkeit pro Zug (ab Zug 5), eine Brettlöschung zu haben. */
  wipe: number;
  /** Schaden an den Boss pro Zug ohne Kampf (Zauber, Drain, Planeswalker). */
  direkt: number;
  lebensgewinn: number;
  /** Bonus auf alle Kreaturen, sobald der Kommandeur liegt (Anthem/Overrun-Effekte). */
  kommandeurBonus: number;
  /** Ab diesem Mana liegt der Kommandeur. */
  kommandeurMana: number;
  /** Anteil Artefakte/Verzauberungen unter den bleibenden Karten. */
  bleibende: number;
  /** Wahrscheinlichkeit pro Zug, eine Extrakarte zu ziehen. */
  kartenziehen: number;
  /** Wie gut das Deck Friedhöfe füllt (für die Friedhofs-Frage). */
  friedhof: number;
}

/** Zersplitterte Realität – „Ein neues Multiversum“ (Jace, Multiverse Architect). */
export const JACE: DeckProfil = {
  name: 'Ein neues Multiversum (Jace, 4 Farben)',
  kurz: 'Jace',
  ramp: 0.45, // elf Mana-Steine, Sol Ring
  kreaturAnteil: 0.55,
  staerkeProMana: 0.95, // große Flieger: Akroma, Avacyn, Serra's Emissary, Archon of Cruelty
  spielsteine: 0.3, // Lingering Souls, Secure the Wastes, Shark Typhoon, Elspeth
  spielsteinAnzahl: 3,
  spielsteinGroesse: 1,
  flieger: 0.65,
  entfernung: 0.22, // Path, Swords, Despark, Stroke of Midnight, Teferi's Reproach
  wipe: 0.05, // Sunfall, Martial Coup
  direkt: 1, // Planeswalker
  lebensgewinn: 0.3,
  kommandeurBonus: 0,
  kommandeurMana: 5,
  bleibende: 0.6,
  kartenziehen: 0.55,
  friedhof: 0.3,
};

/** Die fünf Precons aus „Geheimnisse von Strixhaven“. */
export const STRIXHAVEN: DeckProfil[] = [
  {
    name: 'Lorehold Spirit (Quintorius, Rot-Weiß)',
    kurz: 'Lorehold',
    ramp: 0.25,
    kreaturAnteil: 0.65,
    staerkeProMana: 0.75,
    spielsteine: 0.5, // Geister-Spielsteine
    spielsteinAnzahl: 2,
    spielsteinGroesse: 2,
    flieger: 0.35,
    entfernung: 0.18, // Path, Swords, Lorehold Charm
    wipe: 0.04, // Wave of Reckoning, Ceaseless Conflict
    direkt: 1,
    lebensgewinn: 0.2,
    kommandeurBonus: 1, // Quintorius pumpt die Geister
    kommandeurMana: 5,
    bleibende: 0.35,
    kartenziehen: 0.3,
    friedhof: 0.7,
  },
  {
    name: 'Prismari Artistry (Rootha, Blau-Rot)',
    kurz: 'Prismari',
    ramp: 0.35,
    kreaturAnteil: 0.35,
    staerkeProMana: 0.8,
    spielsteine: 0.55, // fliegende Elementar-Spielsteine durch große Zauber
    spielsteinAnzahl: 1,
    spielsteinGroesse: 3,
    flieger: 0.6,
    entfernung: 0.2, // Abrade, Chaos Warp
    wipe: 0.05, // Blasphemous Act, Volcanic Salvo
    direkt: 3, // Zauber mit Schaden
    lebensgewinn: 0,
    kommandeurBonus: 0,
    kommandeurMana: 4,
    bleibende: 0.35,
    kartenziehen: 0.5,
    friedhof: 0.5,
  },
  {
    name: 'Quandrix Unlimited (Zimone, Grün-Blau)',
    kurz: 'Quandrix',
    ramp: 0.55,
    kreaturAnteil: 0.7,
    staerkeProMana: 1.05, // X-Hydren mit Marken
    spielsteine: 0.15,
    spielsteinAnzahl: 2,
    spielsteinGroesse: 1,
    flieger: 0.1,
    entfernung: 0.1, // Beast Within
    wipe: 0.02,
    direkt: 0,
    lebensgewinn: 0.2,
    kommandeurBonus: 1, // Marken wachsen
    kommandeurMana: 4,
    bleibende: 0.35,
    kartenziehen: 0.5,
    friedhof: 0.3,
  },
  {
    name: 'Silverquill Influence (Killian, Weiß-Schwarz)',
    kurz: 'Silverquill',
    ramp: 0.3,
    kreaturAnteil: 0.45,
    staerkeProMana: 0.6,
    spielsteine: 0.3,
    spielsteinAnzahl: 2,
    spielsteinGroesse: 1,
    flieger: 0.4,
    entfernung: 0.24, // Anguished Unmaking, Vanishing Verse, Fracture, Auren auf Gegnern
    wipe: 0.02,
    direkt: 1,
    lebensgewinn: 1,
    kommandeurBonus: 0,
    kommandeurMana: 4,
    bleibende: 0.8, // Verzauberungen
    kartenziehen: 0.45,
    friedhof: 0.3,
  },
  {
    name: 'Witherbloom Pestilence (Dina, Schwarz-Grün)',
    kurz: 'Witherbloom',
    ramp: 0.45, // Cultivate, Sakura-Tribe Elder, Elfen
    kreaturAnteil: 0.6,
    staerkeProMana: 0.65,
    spielsteine: 0.55, // Schädlinge
    spielsteinAnzahl: 2,
    spielsteinGroesse: 1,
    flieger: 0.1,
    entfernung: 0.2, // Assassin's Trophy, Infernal Grasp, Mortality Spear
    wipe: 0.04, // Toxic Deluge, Casualties of War
    direkt: 2, // Drain durch Opfern
    lebensgewinn: 2,
    kommandeurBonus: 0,
    kommandeurMana: 4,
    bleibende: 0.3,
    kartenziehen: 0.35,
    friedhof: 0.8,
  },
];
