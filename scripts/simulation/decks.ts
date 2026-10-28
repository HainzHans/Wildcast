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
  /** Wahrscheinlichkeit pro Zug, ein Artefakt oder eine Verzauberung des Bosses zu entfernen. */
  artefaktEntfernung: number;
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

/** Reality Fracture – „Multiverse Reforged“ (FRC, Jace, Multiverse Architect). */
export const JACE: DeckProfil = {
  name: 'Multiverse Reforged (Jace, 4 Farben)',
  kurz: 'Jace',
  ramp: 0.45, // elf Mana-Steine, Sol Ring
  kreaturAnteil: 0.55,
  staerkeProMana: 0.95, // große Flieger: Akroma, Avacyn, Serra's Emissary, Archon of Cruelty
  spielsteine: 0.3, // Lingering Souls, Secure the Wastes, Shark Typhoon, Elspeth
  spielsteinAnzahl: 3,
  spielsteinGroesse: 1,
  flieger: 0.65,
  entfernung: 0.22, // Path, Swords, Despark, Stroke of Midnight, Teferi's Reproach
  artefaktEntfernung: 0.2,
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
    artefaktEntfernung: 0.15,
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
    artefaktEntfernung: 0.15,
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
    artefaktEntfernung: 0.12,
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
    artefaktEntfernung: 0.25,
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
    artefaktEntfernung: 0.2,
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

/**
 * Die Precons für die Merkmal-Simulation: Multiverse Reforged (FRC), die vier Final-Fantasy-Decks
 * (FIC) und die zwei aus Lorwyn Eclipsed (ECC). Werte geschätzt aus den offiziellen Decklisten.
 */
export const REVIVAL_TRANCE: DeckProfil = {
  name: 'Revival Trance (Terra, Mardu)',
  kurz: 'Terra',
  ramp: 0.35, // Sol Ring, Signet, Talismane, Solemn, Millikin
  kreaturAnteil: 0.65, // 35 Kreaturen
  staerkeProMana: 0.85, // Sun Titan, Sepulchral Primordial, Angel of the Ruins
  spielsteine: 0.15,
  spielsteinAnzahl: 1,
  spielsteinGroesse: 2,
  flieger: 0.15,
  entfernung: 0.22, // Mortify, Bedevil, Crackling Doom, Palace Jailer
  artefaktEntfernung: 0.15,
  wipe: 0.04, // Tragic Arrogance, Ruinous Ultimatum
  direkt: 1,
  lebensgewinn: 0.2,
  kommandeurBonus: 0,
  kommandeurMana: 3,
  bleibende: 0.35,
  kartenziehen: 0.3,
  friedhof: 0.8, // Reanimation
};

export const LIMIT_BREAK: DeckProfil = {
  name: 'Limit Break (Cloud, Naya)',
  kurz: 'Cloud',
  ramp: 0.35, // Cultivate, Nature's Lore, Rampant Growth, Rocks
  kreaturAnteil: 0.5, // 24 Kreaturen, viel Ausrüstung
  staerkeProMana: 0.9,
  spielsteine: 0.2,
  spielsteinAnzahl: 2,
  spielsteinGroesse: 1,
  flieger: 0.1,
  entfernung: 0.15, // Chaos Warp, Dispatch, Decimate
  artefaktEntfernung: 0.18, // Vandalblast, Decimate
  wipe: 0.03, // Austere Command
  direkt: 1.5,
  lebensgewinn: 0.3,
  kommandeurBonus: 2, // Ausrüstung auf Cloud und Co.
  kommandeurMana: 4,
  bleibende: 0.6,
  kartenziehen: 0.3,
  friedhof: 0.3,
};

export const COUNTER_BLITZ: DeckProfil = {
  name: 'Counter Blitz (Tidus, Bant)',
  kurz: 'Tidus',
  ramp: 0.4, // Farseek, Three Visits, Incubation Druid
  kreaturAnteil: 0.7, // 34 Kreaturen mit +1/+1-Marken
  staerkeProMana: 1.0,
  spielsteine: 0.1,
  spielsteinAnzahl: 2,
  spielsteinGroesse: 1,
  flieger: 0.15,
  entfernung: 0.12, // Path, Destroy Evil
  artefaktEntfernung: 0.05,
  wipe: 0.03, // Farewell, Damning Verdict
  direkt: 0.5, // Walking Ballista
  lebensgewinn: 0.2,
  kommandeurBonus: 1, // Marken wandern und wachsen
  kommandeurMana: 3,
  bleibende: 0.4,
  kartenziehen: 0.45,
  friedhof: 0.3,
};

export const SCIONS_SPELLCRAFT: DeckProfil = {
  name: 'Scions & Spellcraft (Y’shtola, Esper)',
  kurz: 'Yshtola',
  ramp: 0.45, // viele Mana-Steine
  kreaturAnteil: 0.4, // Kontrolle, 22 Kreaturen
  staerkeProMana: 0.8,
  spielsteine: 0.25, // Lingering Souls
  spielsteinAnzahl: 3,
  spielsteinGroesse: 1,
  flieger: 0.5,
  entfernung: 0.26, // Swords, Murderous Rider, Snuff Out, Vindicate
  artefaktEntfernung: 0.12,
  wipe: 0.06, // Crux of Fate, Final Judgment, Cleansing Nova
  direkt: 2, // Y'shtola und Exsanguinate
  lebensgewinn: 1.5,
  kommandeurBonus: 0,
  kommandeurMana: 4,
  bleibende: 0.55,
  kartenziehen: 0.55,
  friedhof: 0.4,
};

export const DANCE_OF_ELEMENTS: DeckProfil = {
  name: 'Dance of the Elements (Ashling, 5 Farben)',
  kurz: 'Ashling',
  ramp: 0.5, // elf Ramp-Karten
  kreaturAnteil: 0.65, // 35 große Elementare
  staerkeProMana: 1.0,
  spielsteine: 0.3, // Avenger of Zendikar, Elemental Spectacle
  spielsteinAnzahl: 3,
  spielsteinGroesse: 1,
  flieger: 0.1,
  entfernung: 0.16, // Path, Reality Shift, Crib Swap, Shriekmaw
  artefaktEntfernung: 0.03,
  wipe: 0.04, // Shatter the Sky, Blasphemous Act
  direkt: 1.5, // Omnath, Fury, Ingot Chewer
  lebensgewinn: 0.1,
  kommandeurBonus: 0,
  kommandeurMana: 3,
  bleibende: 0.3,
  kartenziehen: 0.35,
  friedhof: 0.5,
};

export const BLIGHT_CURSE: DeckProfil = {
  name: 'Blight Curse (Auntie Ool, Jund)',
  kurz: 'Ool',
  ramp: 0.3,
  kreaturAnteil: 0.55, // 27 Kreaturen
  staerkeProMana: 0.8, // Grave Titan, Archfiend of Ifnir
  spielsteine: 0.2,
  spielsteinAnzahl: 2,
  spielsteinGroesse: 2,
  flieger: 0.3,
  entfernung: 0.26, // Infernal Grasp, Terminate, Putrefy, Assassin's Trophy
  artefaktEntfernung: 0.15,
  wipe: 0.07, // Black Sun's Zenith, Chain Reaction, Massacre Girl
  direkt: 1.5, // −1/−1-Drain
  lebensgewinn: 0.3,
  kommandeurBonus: 0,
  kommandeurMana: 4,
  bleibende: 0.3,
  kartenziehen: 0.4,
  friedhof: 0.6,
};

export const PRECONS: DeckProfil[] = [
  JACE,
  REVIVAL_TRANCE,
  LIMIT_BREAK,
  COUNTER_BLITZ,
  SCIONS_SPELLCRAFT,
  DANCE_OF_ELEMENTS,
  BLIGHT_CURSE,
];
