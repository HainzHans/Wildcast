import { Art, Form } from '../../core/spiel/modell';
import { Zufall } from '../../core/zufall';

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

/** Positiv 65 %, Negativ 31,5 %, Chaos 3,5 % (= 10 % der negativen Würfe). */
export function wuerfleArt(z: number): Art {
  if (z < 0.65) return 'positiv';
  if (z < 0.965) return 'negativ';
  return 'chaos';
}

/** Normal 55 %, Verrückt 20 %, Verzauberung 15 %, Emblem 10 %. */
export function wuerfleForm(z: number): Form {
  if (z < 0.55) return 'normal';
  if (z < 0.75) return 'verrueckt';
  if (z < 0.9) return 'verzauberung';
  return 'emblem';
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
): Wurf {
  const vorlage = waehleVorlage(
    pool,
    mana,
    wuerfleArt(zufall()),
    wuerfleForm(zufall()),
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
