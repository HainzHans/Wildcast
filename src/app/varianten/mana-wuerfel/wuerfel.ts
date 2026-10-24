import { Art, Form } from '../../core/spiel/modell';
import { Zufall } from '../../core/zufall';
import {
  ARTEN,
  FORMEN,
  Gewicht,
  STANDARD_WUERFEL,
  summe,
  WuerfelEinstellungen,
} from './wuerfel-einstellungen';

/**
 * Vorlage aus dem kuratierten Pool. Platzhalter im Text skalieren mit dem bezahlten Mana:
 * `{m}`, `{2m}`, `{m/2}`, `{m+1}`, `{2m-1}`, `{3m/2+1}` … (abgerundet, mindestens 1).
 * Bewusst als reiner Text, damit der Pool später als JSON oder aus Supabase kommen kann.
 */
export interface EffektVorlage {
  id: string;
  name: string;
  art: Art;
  form: Form;
  /** Manabereich, in dem die Vorlage passt (beide Grenzen inklusive). */
  mana: [number, number];
  spruch: string;
  text: string;
}

export interface Wurf {
  vorlage: string;
  mana: number;
  art: Art;
  form: Form;
  name: string;
  text: string;
  spruch: string;
}

/** „Per Anhalter durch die Galaxis“: Bei 42 Mana gibt es nur noch die Antwort. */
export const ANTWORT = 42;

/**
 * Zieht einen Eintrag nach Gewicht. Abgeschaltete Einträge kommen nie;
 * stimmt die Summe nicht genau, wird anteilig verrechnet.
 */
function ziehe<T extends string>(z: number, reihenfolge: T[], gruppe: Record<T, Gewicht>): T {
  const ziel = z * summe(gruppe);
  let bisher = 0;
  const moeglich = reihenfolge.filter((s) => gruppe[s].aktiv && gruppe[s].prozent > 0);
  for (const s of moeglich) {
    bisher += gruppe[s].prozent;
    if (ziel < bisher) return s;
  }
  return moeglich[moeglich.length - 1];
}

/** Standard: Positiv 65 %, Negativ 31,5 %, Chaos 3,5 % (= 10 % der negativen Würfe). */
export function wuerfleArt(z: number, e: WuerfelEinstellungen = STANDARD_WUERFEL): Art {
  return ziehe(z, ARTEN, e.arten);
}

/** Standard: Normal 55 %, Verrückt 20 %, Verzauberung 15 %, Emblem 10 %. */
export function wuerfleForm(z: number, e: WuerfelEinstellungen = STANDARD_WUERFEL): Form {
  return ziehe(z, FORMEN, e.formen);
}

const PLATZHALTER = /\{(\d*)m(?:\/(\d+))?(?:([+-])(\d+))?\}/g;

export function fuelleText(text: string, mana: number): string {
  return text.replace(PLATZHALTER, (_, faktor, teiler, vorzeichen, summand) => {
    let wert = Math.floor(((Number(faktor) || 1) * mana) / (Number(teiler) || 1));
    if (vorzeichen) wert += (vorzeichen === '+' ? 1 : -1) * Number(summand);
    return String(Math.max(1, wert));
  });
}

function abstand(vorlage: EffektVorlage, mana: number): number {
  const [min, max] = vorlage.mana;
  return mana < min ? min - mana : mana > max ? mana - max : 0;
}

function zufaelligAus<T>(liste: T[], zufall: Zufall): T {
  return liste[Math.floor(zufall() * liste.length)];
}

/**
 * Sucht eine Vorlage zu Art und Form, deren Manabereich am besten passt.
 * Kürzlich gewürfelte Vorlagen werden übersprungen, solange es Alternativen gibt.
 */
export function waehleVorlage(
  pool: EffektVorlage[],
  mana: number,
  art: Art,
  form: Form,
  zufall: Zufall,
  zuletzt: string[] = [],
): EffektVorlage {
  if (mana === ANTWORT) {
    const antwort = pool.find((v) => v.art === art && v.mana[0] === ANTWORT);
    if (antwort) return antwort;
  }

  const passend = pool.filter((v) => v.art === art && v.form === form && v.mana[0] !== ANTWORT);
  const kandidaten = passend.length ? passend : pool.filter((v) => v.art === art);
  const naechster = Math.min(...kandidaten.map((v) => abstand(v, mana)));
  const beste = kandidaten.filter((v) => abstand(v, mana) === naechster);
  const frisch = beste.filter((v) => !zuletzt.includes(v.id));
  return zufaelligAus(frisch.length ? frisch : beste, zufall);
}

export function wuerfleEffekt(
  pool: EffektVorlage[],
  mana: number,
  zufall: Zufall,
  zuletzt: string[] = [],
  einstellungen: WuerfelEinstellungen = STANDARD_WUERFEL,
): Wurf {
  const vorlage = waehleVorlage(
    pool,
    mana,
    wuerfleArt(zufall(), einstellungen),
    wuerfleForm(zufall(), einstellungen),
    zufall,
    zuletzt,
  );
  // Außerhalb des Bereichs skaliert der Text nur bis zur Grenze der Vorlage.
  const m = Math.min(Math.max(mana, vorlage.mana[0]), vorlage.mana[1]);
  return {
    vorlage: vorlage.id,
    mana,
    art: vorlage.art,
    form: vorlage.form,
    name: fuelleText(vorlage.name, m),
    text: fuelleText(vorlage.text, m),
    spruch: fuelleText(vorlage.spruch, m),
  };
}
