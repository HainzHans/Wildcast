import type { Spieler } from '../../core/spiel/modell';
import type { Zufall } from '../../core/zufall';

export type Stufe = 1 | 2 | 3;

/** Ein Angebot im Basar. Bezahlt wird mit beliebigem Mana; Leben trägt die App selbst ein. */
export interface Angebot {
  id: string;
  name: string;
  preis: number;
  stufe: Stufe;
  text: string;
  leben?: { selbst?: number; gegner?: number };
}

export interface BasarEinstellungen {
  /** So viele Angebote liegen gleichzeitig aus. */
  groesse: number;
}

export const STANDARD_BASAR: BasarEinstellungen = { groesse: 3 };
export const BASAR_GROESSEN = [3, 4, 5];

export const ANGEBOTE: Angebot[] = [
  // ── Stufe 1: günstig ─────────────────────────────────────────────
  {
    id: 'schleifstein',
    name: 'Schleifstein',
    preis: 1,
    stufe: 1,
    text: 'Eine Kreatur deiner Wahl erhält +2/+2 bis zum Ende des Zugs.',
  },
  {
    id: 'kraeutertee',
    name: 'Kräutertee',
    preis: 2,
    stufe: 1,
    text: 'Erhalte 4 Leben.',
    leben: { selbst: 4 },
  },
  {
    id: 'wurfspeer',
    name: 'Wurfspeer',
    preis: 2,
    stufe: 1,
    text: 'Füge einer Kreatur deiner Wahl 2 Schaden zu.',
  },
  {
    id: 'wachhund',
    name: 'Wachhund',
    preis: 2,
    stufe: 1,
    text: 'Erzeuge einen 2/2 grünen Wolf-Kreaturenspielstein.',
  },
  {
    id: 'spaeher',
    name: 'Späher',
    preis: 2,
    stufe: 1,
    text: 'Schau dir die obersten drei Karten deiner Bibliothek an. Nimm eine auf die Hand und lege den Rest unter die Bibliothek.',
  },
  {
    id: 'fesseln',
    name: 'Fesseln',
    preis: 2,
    stufe: 1,
    text: 'Tappe eine Kreatur deiner Wahl. Sie enttappt in ihrem nächsten Enttappsegment nicht.',
  },
  {
    id: 'schattenmantel',
    name: 'Schattenmantel',
    preis: 2,
    stufe: 1,
    text: 'Eine Kreatur deiner Wahl, die du kontrollierst, erhält Fluchsicherheit und Unzerstörbarkeit bis zum Ende des Zugs.',
  },
  {
    id: 'gelehrtenschrift',
    name: 'Gelehrtenschrift',
    preis: 3,
    stufe: 1,
    text: 'Ziehe eine Karte. Erhalte 2 Leben.',
    leben: { selbst: 2 },
  },
  {
    id: 'soeldner',
    name: 'Söldner',
    preis: 3,
    stufe: 1,
    text: 'Erzeuge zwei 1/1 weiße Soldat-Kreaturenspielsteine.',
  },
  {
    id: 'landkarte',
    name: 'Landkarte',
    preis: 3,
    stufe: 1,
    text: 'Suche in deiner Bibliothek nach einem Standardland, bringe es getappt ins Spiel und mische danach.',
  },
  {
    id: 'brandbombe',
    name: 'Brandbombe',
    preis: 3,
    stufe: 1,
    text: 'Jeder Gegner verliert 2 Leben.',
    leben: { gegner: -2 },
  },
  {
    id: 'reliquie',
    name: 'Reliquie',
    preis: 3,
    stufe: 1,
    text: 'Nimm eine Kreaturenkarte mit Manawert 3 oder weniger aus deinem Friedhof auf die Hand.',
  },
  {
    id: 'muenzbeutel',
    name: 'Münzbeutel',
    preis: 3,
    stufe: 1,
    text: 'Erzeuge zwei Schatz-Spielsteine.',
  },

  // ── Stufe 2: mittel ──────────────────────────────────────────────
  { id: 'bibliothek', name: 'Bibliothek', preis: 4, stufe: 2, text: 'Ziehe zwei Karten.' },
  {
    id: 'greif',
    name: 'Greif',
    preis: 4,
    stufe: 2,
    text: 'Erzeuge einen 3/3 weißen Greif-Kreaturenspielstein mit Flugfähigkeit.',
  },
  {
    id: 'sprengladung',
    name: 'Sprengladung',
    preis: 4,
    stufe: 2,
    text: 'Zerstöre ein Artefakt oder eine Verzauberung deiner Wahl.',
  },
  {
    id: 'heilquelle',
    name: 'Heilquelle',
    preis: 4,
    stufe: 2,
    text: 'Erhalte 8 Leben.',
    leben: { selbst: 8 },
  },
  {
    id: 'kriegstrommel',
    name: 'Kriegstrommel',
    preis: 4,
    stufe: 2,
    text: 'Kreaturen, die du kontrollierst, erhalten +2/+1 und Trampelschaden bis zum Ende des Zugs.',
  },
  {
    id: 'gedankenraub',
    name: 'Gedankenraub',
    preis: 4,
    stufe: 2,
    text: 'Ein Gegner deiner Wahl zeigt dir seine Hand. Wähle eine Karte, die kein Land ist. Er wirft sie ab.',
  },
  {
    id: 'bannfluch',
    name: 'Bannfluch',
    preis: 5,
    stufe: 2,
    text: 'Zerstöre eine Kreatur deiner Wahl.',
  },
  {
    id: 'golem',
    name: 'Golem',
    preis: 5,
    stufe: 2,
    text: 'Erzeuge einen 4/4 farblosen Golem-Artefaktkreaturenspielstein.',
  },
  {
    id: 'blutzoll',
    name: 'Blutzoll',
    preis: 5,
    stufe: 2,
    text: 'Jeder Gegner verliert 3 Leben. Du erhältst 3 Leben.',
    leben: { selbst: 3, gegner: -3 },
  },
  {
    id: 'wiederkehr',
    name: 'Wiederkehr',
    preis: 5,
    stufe: 2,
    text: 'Bringe eine Kreaturenkarte mit Manawert 4 oder weniger aus deinem Friedhof ins Spiel.',
  },
  {
    id: 'schatzkammer',
    name: 'Schatzkammer',
    preis: 5,
    stufe: 2,
    text: 'Erzeuge vier Schatz-Spielsteine.',
  },

  // ── Stufe 3: teuer ───────────────────────────────────────────────
  {
    id: 'grosse-bibliothek',
    name: 'Große Bibliothek',
    preis: 6,
    stufe: 3,
    text: 'Ziehe vier Karten.',
  },
  {
    id: 'seelendieb',
    name: 'Seelendieb',
    preis: 6,
    stufe: 3,
    text: 'Übernimm die Kontrolle über eine Kreatur deiner Wahl mit Manawert 4 oder weniger.',
  },
  {
    id: 'lebensborn',
    name: 'Lebensborn',
    preis: 6,
    stufe: 3,
    text: 'Erhalte 15 Leben.',
    leben: { selbst: 15 },
  },
  {
    id: 'wiedergeburt',
    name: 'Wiedergeburt',
    preis: 6,
    stufe: 3,
    text: 'Bringe eine Kreaturenkarte aus deinem Friedhof ins Spiel.',
  },
  {
    id: 'meisterspaeher',
    name: 'Meisterspäher',
    preis: 6,
    stufe: 3,
    text: 'Suche in deiner Bibliothek nach einer Karte, nimm sie auf die Hand und mische danach.',
  },
  {
    id: 'drache',
    name: 'Drache',
    preis: 7,
    stufe: 3,
    text: 'Erzeuge einen 5/5 roten Drachen-Kreaturenspielstein mit Flugfähigkeit.',
  },
  {
    id: 'fegefeuer',
    name: 'Fegefeuer',
    preis: 7,
    stufe: 3,
    text: 'Fegefeuer fügt jeder Kreatur 4 Schaden zu.',
  },
  {
    id: 'heerschar',
    name: 'Heerschar',
    preis: 7,
    stufe: 3,
    text: 'Erzeuge vier 2/2 weiße Ritter-Kreaturenspielsteine mit Wachsamkeit.',
  },
  {
    id: 'laeuterung',
    name: 'Läuterung',
    preis: 8,
    stufe: 3,
    text: 'Zerstöre alle Artefakte und Verzauberungen, die deine Gegner kontrollieren.',
  },
  {
    id: 'meteor',
    name: 'Meteor',
    preis: 8,
    stufe: 3,
    text: 'Jeder Gegner verliert 6 Leben.',
    leben: { gegner: -6 },
  },
  {
    id: 'zeitsprung',
    name: 'Zeitsprung',
    preis: 8,
    stufe: 3,
    text: 'Mache nach diesem Zug einen zusätzlichen Zug.',
  },
  {
    id: 'urwurm',
    name: 'Urwurm',
    preis: 8,
    stufe: 3,
    text: 'Erzeuge einen 8/8 grünen Wurm-Kreaturenspielstein mit Trampelschaden.',
  },
];

export interface BasarStand {
  groesse: number;
  /** Was gerade ausliegt, das älteste zuerst. */
  angebote: string[];
  gekauft: { id: string; spielerId: number; runde: number }[];
}

export function angebotMitId(id: string): Angebot | undefined {
  return ANGEBOTE.find((a) => a.id === id);
}

/** Je später die Runde, desto eher kommen teure, starke Angebote. In Prozent je Stufe. */
export function stufenAnteile(runde: number): Record<Stufe, number> {
  if (runde <= 3) return { 1: 100, 2: 0, 3: 0 };
  if (runde <= 6) return { 1: 60, 2: 40, 3: 0 };
  if (runde <= 9) return { 1: 25, 2: 50, 3: 25 };
  return { 1: 10, 2: 40, 3: 50 };
}

/** Zieht ein neues Angebot passend zur Runde, das nicht schon ausliegt. */
function ziehen(ausliegend: string[], runde: number, zufall: Zufall): string {
  const anteile = stufenAnteile(runde);
  let wurf = zufall() * 100;
  let stufe: Stufe = 1;
  for (const s of [1, 2, 3] as Stufe[]) {
    if (wurf < anteile[s]) {
      stufe = s;
      break;
    }
    wurf -= anteile[s];
  }
  const frei = ANGEBOTE.filter((a) => !ausliegend.includes(a.id));
  const passend = frei.filter((a) => a.stufe === stufe);
  const liste = passend.length ? passend : frei;
  return liste[Math.floor(zufall() * liste.length)].id;
}

export function basarStarten(e: BasarEinstellungen, zufall: Zufall): BasarStand {
  const angebote: string[] = [];
  while (angebote.length < e.groesse) angebote.push(ziehen(angebote, 1, zufall));
  return { groesse: e.groesse, angebote, gekauft: [] };
}

/** Ein Spieler kauft ein Angebot. Es verschwindet, ein neues rückt hinten nach. */
export function basarKaufen(
  stand: BasarStand,
  spieler: Spieler[],
  angebotId: string,
  spielerId: number,
  runde: number,
  zufall: Zufall,
): { stand: BasarStand; spieler: Spieler[] } {
  const angebot = angebotMitId(angebotId);
  if (!angebot || !stand.angebote.includes(angebotId)) return { stand, spieler };
  const rest = stand.angebote.filter((id) => id !== angebotId);
  const l = angebot.leben;
  return {
    stand: {
      ...stand,
      angebote: [...rest, ziehen(stand.angebote, runde, zufall)],
      gekauft: [...stand.gekauft, { id: angebotId, spielerId, runde }],
    },
    spieler: l
      ? spieler.map((p) => ({
          ...p,
          leben: p.leben + (p.id === spielerId ? (l.selbst ?? 0) : (l.gegner ?? 0)),
        }))
      : spieler,
  };
}

/** Neue Runde: Das älteste Angebot verschwindet, ein neues kommt dazu. */
export function basarRunde(stand: BasarStand, runde: number, zufall: Zufall): BasarStand {
  const [, ...rest] = stand.angebote;
  return { ...stand, angebote: [...rest, ziehen(stand.angebote, runde, zufall)] };
}
