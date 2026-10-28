import { Frage, FrageId } from '../boss-modell';

/**
 * Alle Fragen, die Bosse am Tisch stellen können – schlicht formuliert, damit man schnell antwortet.
 * Jeder Boss wählt, welche davon zu ihm passen. Spieler-Fragen bekommen die Namen automatisch dazu.
 */
const FRAGEN: Record<FrageId, Frage> = {
  kreaturen: {
    id: 'kreaturen',
    text: 'Wie viele Kreaturen kontrolliert ihr zusammen?',
    antworten: [
      { wert: '0-2', label: '0–2' },
      { wert: '3-5', label: '3–5' },
      { wert: '6-9', label: '6–9' },
      { wert: '10+', label: '10 oder mehr' },
    ],
  },
  grosseKreatur: {
    id: 'grosseKreatur',
    text: 'Habt ihr eine Kreatur mit Stärke 6 oder mehr?',
    antworten: [
      { wert: 'ja', label: 'Ja' },
      { wert: 'nein', label: 'Nein' },
    ],
  },
  flieger: {
    id: 'flieger',
    text: 'Habt ihr Kreaturen mit Flugfähigkeit?',
    antworten: [
      { wert: 'ja', label: 'Ja' },
      { wert: 'nein', label: 'Nein' },
    ],
  },
  bleibende: {
    id: 'bleibende',
    text: 'Wie viele Artefakte und Verzauberungen habt ihr zusammen?',
    antworten: [
      { wert: 'wenige', label: '0–1' },
      { wert: 'einige', label: '2–4' },
      { wert: 'viele', label: '5 oder mehr' },
    ],
  },
  handkarten: {
    id: 'handkarten',
    text: 'Wer von euch hat mehr Karten auf der Hand?',
    antworten: [{ wert: 'gleich', label: 'Gleich viele' }],
  },
  kommandeur: {
    id: 'kommandeur',
    text: 'Ist gerade ein Kommandeur von euch im Spiel?',
    antworten: [
      { wert: 'ja', label: 'Ja' },
      { wert: 'nein', label: 'Nein' },
    ],
  },
  friedhof: {
    id: 'friedhof',
    text: 'Wie viele Kreaturen liegen in euren Friedhöfen zusammen?',
    antworten: [
      { wert: 'wenige', label: '0–2' },
      { wert: 'einige', label: '3–6' },
      { wert: 'viele', label: '7 oder mehr' },
    ],
  },
  beute: {
    id: 'beute',
    text: 'Habt ihr eine Kreatur mit Stärke 4 oder mehr?',
    antworten: [
      { wert: 'ja', label: 'Ja' },
      { wert: 'nein', label: 'Nein' },
    ],
  },
  gestorben: {
    id: 'gestorben',
    text: 'Wie viele eurer Kreaturen (keine Spielsteine) sind seit seinem letzten Zug gestorben?',
    antworten: [
      { wert: '0', label: 'Keine' },
      { wert: '1', label: '1' },
      { wert: '2', label: '2' },
      { wert: '3', label: '3 oder mehr' },
    ],
  },
  rache: {
    id: 'rache',
    text: 'Wer von euch hat dem Boss in dieser Runde am meisten Schaden gemacht?',
    antworten: [{ wert: 'niemand', label: 'Niemand' }],
  },
};

/** Ohne Angabe alle Fragen, sonst die genannten. */
export function fragen(...ids: FrageId[]): Frage[] {
  return (ids.length ? ids : (Object.keys(FRAGEN) as FrageId[])).map((id) => FRAGEN[id]);
}

export function frageMitId(id: FrageId): Frage {
  return FRAGEN[id];
}
