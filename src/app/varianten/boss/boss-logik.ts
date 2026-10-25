import { Zufall } from '../../core/zufall';
import {
  Antwort,
  BossAktion,
  BossDefinition,
  BossZug,
  DienerVorlage,
  Frage,
  FrageId,
  Lage,
  Phase,
  Schlagwort,
  SPIELER_FRAGEN,
  Stimmung,
  Temperament,
  Ziel,
} from './boss-modell';

/** Phase 2 beginnt bei 60 % der Leben, Phase 3 bei 30 %. */
export function phasenGrenzen(maxLeben: number): [number, number] {
  return [Math.floor(maxLeben * 0.6), Math.floor(maxLeben * 0.3)];
}

export function phase(leben: number, maxLeben: number): Phase {
  const [zwei, drei] = phasenGrenzen(maxLeben);
  if (leben <= drei) return 3;
  if (leben <= zwei) return 2;
  return 1;
}

export interface BossLeben {
  leben: number;
  maxLeben: number;
  /** Phasen-Schild: Nach Erreichen einer Phasengrenze verfällt jeder weitere Schaden in diesem Zug. */
  schild: boolean;
  /** Schaden, den der Boss noch verhindert (z. B. durch eine Aktion). */
  schutz: number;
}

/**
 * Wendet Schaden auf den Boss an. Erst greift der Schutz, dann stoppt der Schaden an der
 * nächsten Phasengrenze und der Schild geht hoch. Gibt zurück, wie viel Schaden verfallen ist.
 */
export function schadenAmBoss(boss: BossLeben, schaden: number): BossLeben & { verfallen: number } {
  if (schaden <= 0) return { ...boss, verfallen: 0 };
  if (boss.schild) return { ...boss, verfallen: schaden };

  const abgefangen = Math.min(boss.schutz, schaden);
  const rest = schaden - abgefangen;
  const schutz = boss.schutz - abgefangen;

  const grenze = phasenGrenzen(boss.maxLeben).find((g) => g > 0 && boss.leben > g);
  const ziel = boss.leben - rest;
  if (grenze !== undefined && ziel <= grenze) {
    return { ...boss, leben: grenze, schutz, schild: true, verfallen: abgefangen + grenze - ziel };
  }
  return { ...boss, leben: Math.max(0, ziel), schutz, verfallen: abgefangen };
}

/** Heilung bringt den Boss nie über die Grenze seiner aktuellen Phase zurück. */
export function heilen(leben: number, maxLeben: number, menge: number): number {
  const [zwei, drei] = phasenGrenzen(maxLeben);
  const deckel = { 1: maxLeben, 2: zwei, 3: drei }[phase(leben, maxLeben)];
  return Math.min(leben + menge, deckel);
}

/** Ab so vielen Dienern kommt kein automatischer Nachschub mehr (Aktionen können trotzdem rufen). */
export const DIENER_GRENZE = 6;

/**
 * Ein Diener pro Runde, solange weniger als {@link DIENER_GRENZE} da sind. Ab Runde 2 kommt bei
 * höchstens einem Diener einer extra dazu. Mehr würde zwei Spieler auf Dauer überrennen.
 */
export function dienerNachschub(runde: number, diener: number): number {
  if (diener >= DIENER_GRENZE) return 0;
  const nachschub = runde >= 2 && diener <= 1 ? 1 : 0;
  return 1 + nachschub;
}

export function stimmung(lage: Lage): Stimmung {
  const verlust = lage.lebenVorher - lage.leben;
  const schwach = lage.leben <= lage.maxLeben * 0.3;
  if (schwach && lage.diener <= 1) return 'verzweifelt';
  if (verlust >= lage.maxLeben * 0.2) return 'wuetend';
  if (lage.spieler.some((s) => s.leben <= 10)) return 'ueberlegen';
  const { kreaturen, grosseKreatur } = lage.antworten;
  if (kreaturen === '6-9' || kreaturen === '10+' || grosseKreatur === 'ja') return 'bedroht';
  return 'lauernd';
}

/** Wie stark eine Stimmung jede Art von Aktion bevorzugt. */
const NEIGUNG: Record<Stimmung, Record<Schlagwort, number>> = {
  wuetend: { angriff: 2, beschwoerung: 1.4, kontrolle: 1, heilung: 0.5 },
  bedroht: { angriff: 1, beschwoerung: 1, kontrolle: 2.2, heilung: 0.6 },
  ueberlegen: { angriff: 2.2, beschwoerung: 0.9, kontrolle: 0.8, heilung: 0.4 },
  verzweifelt: { angriff: 0.8, beschwoerung: 2, kontrolle: 1, heilung: 2.2 },
  lauernd: { angriff: 1, beschwoerung: 1.3, kontrolle: 1, heilung: 0.8 },
};

/** Charakterzüge für eine Partie. Jeder bevorzugt eine Art von Aktion leicht – die Stärke bleibt gleich. */
export const TEMPERAMENTE: Record<
  Temperament,
  { name: string; text: string; neigung: Record<Schlagwort, number> }
> = {
  jaehzornig: {
    name: 'Jähzornig',
    text: 'greift lieber an, heilt sich seltener',
    neigung: { angriff: 1.35, kontrolle: 1, beschwoerung: 1, heilung: 0.75 },
  },
  listig: {
    name: 'Listig',
    text: 'stört lieber eure Pläne, als direkt anzugreifen',
    neigung: { angriff: 0.85, kontrolle: 1.35, beschwoerung: 1, heilung: 1 },
  },
  bruetend: {
    name: 'Brütend',
    text: 'ruft lieber Diener, als selbst zuzuschlagen',
    neigung: { angriff: 0.85, kontrolle: 1, beschwoerung: 1.35, heilung: 1 },
  },
  zaeh: {
    name: 'Zäh',
    text: 'schützt und heilt sich lieber',
    neigung: { angriff: 1, kontrolle: 1, beschwoerung: 0.85, heilung: 1.35 },
  },
  unberechenbar: {
    name: 'Unberechenbar',
    text: 'folgt keiner Vorliebe',
    neigung: { angriff: 1, kontrolle: 1, beschwoerung: 1, heilung: 1 },
  },
};

/** Anteil der Aktionen, die ein Boss in einer Partie beherrscht. */
const REPERTOIRE_ANTEIL = 0.8;

export function temperamentWaehlen(zufall: Zufall): Temperament {
  const alle = Object.keys(TEMPERAMENTE) as Temperament[];
  return alle[Math.floor(zufall() * alle.length)];
}

/**
 * Welche Aktionen der Boss in dieser Partie beherrscht: etwa 80 %, aber von jeder Art
 * mindestens zwei (soweit vorhanden), damit er in jeder Lage reagieren kann.
 */
export function repertoireWaehlen(boss: BossDefinition, zufall: Zufall): string[] {
  const gemischt = [...boss.aktionen]
    .map((a) => ({ a, z: zufall() }))
    .sort((x, y) => x.z - y.z)
    .map((x) => x.a);
  const ziel = Math.ceil(boss.aktionen.length * REPERTOIRE_ANTEIL);
  const gewaehlt = new Set<string>();
  for (const art of ['angriff', 'kontrolle', 'beschwoerung', 'heilung'] as Schlagwort[]) {
    gemischt
      .filter((a) => a.schlagworte.includes(art))
      .slice(0, 2)
      .forEach((a) => gewaehlt.add(a.id));
  }
  for (const a of gemischt) {
    if (gewaehlt.size >= ziel) break;
    gewaehlt.add(a.id);
  }
  return boss.aktionen.filter((a) => gewaehlt.has(a.id)).map((a) => a.id);
}

function beherrscht(aktion: BossAktion, lage: Lage): boolean {
  return !lage.repertoire || lage.repertoire.includes(aktion.id);
}

/** Aktionen aus den letzten Zügen werden so viel seltener – damit der Boss abwechslungsreich bleibt. */
const SCHON_GESEHEN = 0.35;
/** Frage aus dem vorigen Zug: nur noch selten wieder. */
const SCHON_GEFRAGT = 0.15;
/** Mit dieser Wahrscheinlichkeit stellt der Boss zwei Fragen statt einer. */
const ZWEI_FRAGEN = 0.6;

function verfuegbar(aktion: BossAktion, p: Phase): boolean {
  return !aktion.phasen || aktion.phasen.includes(p);
}

export function aktionsGewicht(aktion: BossAktion, lage: Lage, s: Stimmung): number {
  if (!verfuegbar(aktion, phase(lage.leben, lage.maxLeben))) return 0;
  if (aktion.folgen?.heilung && lage.leben >= lage.maxLeben) return 0;
  const temperament = TEMPERAMENTE[lage.temperament ?? 'unberechenbar'].neigung;
  const neigung = Math.max(...aktion.schlagworte.map((w) => NEIGUNG[s][w] * temperament[w]));
  const treffer = Object.entries(aktion.bevorzugt ?? {}).filter(([frage, werte]) =>
    werte?.includes(lage.antworten[frage as FrageId] ?? ''),
  ).length;
  const gesehen = lage.verlauf.includes(aktion.id) ? SCHON_GESEHEN : 1;
  return aktion.gewicht * neigung * 2 ** treffer * gesehen;
}

function gewichtetAus<T>(eintraege: { wert: T; gewicht: number }[], zufall: Zufall): T | null {
  const summe = eintraege.reduce((s, e) => s + e.gewicht, 0);
  if (summe <= 0) return null;
  let ziel = zufall() * summe;
  for (const e of eintraege) {
    ziel -= e.gewicht;
    if (ziel < 0) return e.wert;
  }
  return eintraege[eintraege.length - 1].wert;
}

/**
 * Wählt eine Aktion nach Stimmung und Antworten. Eine Aktion wiederholt sich nie direkt,
 * und innerhalb eines Zugs kommt keine doppelt vor.
 */
export function waehleAktion(
  boss: BossDefinition,
  lage: Lage,
  s: Stimmung,
  zufall: Zufall,
  ausschluss: string[] = [],
): BossAktion {
  const gesperrt = new Set([...ausschluss, ...lage.letzteAktionen]);
  const kandidaten = boss.aktionen
    .filter((a) => !gesperrt.has(a.id) && beherrscht(a, lage))
    .map((a) => ({ wert: a, gewicht: aktionsGewicht(a, lage, s) }));
  return (
    gewichtetAus(kandidaten, zufall) ??
    boss.aktionen.find((a) => !gesperrt.has(a.id)) ??
    boss.aktionen[0]
  );
}

/**
 * Ein oder zwei Fragen pro Zug. Gewichtet danach, wie viele Aktionen der aktuellen Phase die
 * Antwort brauchen; die Kreaturen-Frage zählt etwas mehr, weil davon „bedroht“ abhängt.
 * Was er im vorigen Zug gefragt hat, fragt er nur noch selten.
 */
export function fragenFuerZug(
  boss: BossDefinition,
  lage: Lage,
  zufall: Zufall,
  anzahl = zufall() < ZWEI_FRAGEN ? 2 : 1,
): Frage[] {
  const p = phase(lage.leben, lage.maxLeben);
  const relevanz = new Map<FrageId, number>();
  for (const a of boss.aktionen.filter((a) => verfuegbar(a, p) && beherrscht(a, lage))) {
    for (const frage of Object.keys(a.bevorzugt ?? {}) as FrageId[]) {
      relevanz.set(frage, (relevanz.get(frage) ?? 0) + a.gewicht);
    }
  }
  relevanz.set('kreaturen', (relevanz.get('kreaturen') ?? 0) + 3);
  const gewaehlt: FrageId[] = [];
  while (gewaehlt.length < anzahl) {
    const naechste = gewichtetAus(
      [...relevanz]
        .filter(([f]) => !gewaehlt.includes(f) && boss.fragen.some((q) => q.id === f))
        .map(([wert, gewicht]) => ({
          wert,
          gewicht: gewicht * (lage.letzteFragen.includes(wert) ? SCHON_GEFRAGT : 1),
        })),
      zufall,
    );
    if (!naechste) break;
    gewaehlt.push(naechste);
  }
  return gewaehlt
    .map((id) => boss.fragen.find((f) => f.id === id))
    .filter((f): f is Frage => !!f)
    .map((f) => (SPIELER_FRAGEN.includes(f.id) ? mitSpielern(f, lage) : f));
}

/** Bei Fragen wie „Wer hat mehr Handkarten?“ sind die Spieler selbst die Antworten. */
function mitSpielern(frage: Frage, lage: Lage): Frage {
  const antworten: Antwort[] = lage.spieler.map((s) => ({ wert: String(s.id), label: s.name }));
  return { ...frage, antworten: [...antworten, ...frage.antworten] };
}

export function zielSpieler(lage: Lage, ziel: Ziel, zufall: Zufall): number[] {
  if (ziel === 'alle') return lage.spieler.map((s) => s.id);
  if (ziel === 'rache') {
    const genannt = lage.spieler.find((s) => String(s.id) === lage.antworten.rache);
    return genannt ? [genannt.id] : zielSpieler(lage, 'meisteLeben', zufall);
  }
  const leben = lage.spieler.map((s) => s.leben);
  const grenze = ziel === 'meisteLeben' ? Math.max(...leben) : Math.min(...leben);
  const kandidaten = lage.spieler.filter((s) => s.leben === grenze);
  // Bei Gleichstand entscheidet der Würfel.
  return [kandidaten[Math.floor(zufall() * kandidaten.length)].id];
}

function fuelle(text: string, lage: Lage, verlust: number, boss: BossDefinition): string {
  const schwaechster = [...lage.spieler].sort((a, b) => a.leben - b.leben)[0]?.name ?? '';
  return text
    .replaceAll('{verlust}', String(verlust))
    .replaceAll('{schwaechster}', schwaechster)
    .replaceAll('{boss}', boss.name);
}

function zufaelligAus<T>(liste: T[], zufall: Zufall): T {
  return liste[Math.floor(zufall() * liste.length)];
}

/** Ein Spruch, der zuletzt nicht kam – solange es noch andere gibt. */
function neuerSpruch(sprueche: string[], zuletzt: string[], zufall: Zufall): string {
  const frisch = sprueche.filter((s) => !zuletzt.includes(s));
  return zufaelligAus(frisch.length ? frisch : sprueche, zufall);
}

/**
 * Ein kompletter Boss-Zug: Stimmung aus Lage und Antworten, eine Aktion (in Phase 3 zwei),
 * Spezialangriff mit Ankündigung, Diener-Wachstum und Angriffsziel.
 */
export function bossZug(boss: BossDefinition, lage: Lage, zufall: Zufall): BossZug {
  const p = phase(lage.leben, lage.maxLeben);
  const s = stimmung(lage);
  const verlust = Math.max(0, lage.lebenVorher - lage.leben);

  const aktionen: BossAktion[] = [];
  let ankuendigung: string | null = null;
  let spezialAngekuendigt = false;

  if (p === 3 && lage.spezialAngekuendigt) {
    aktionen.push(boss.spezial);
  } else if (p === 3 && !lage.spezialEingesetzt) {
    ankuendigung = boss.ankuendigung;
    spezialAngekuendigt = true;
  }
  let anzahl = p === 3 ? 2 : 1;
  let extra = false;
  while (aktionen.length < anzahl) {
    aktionen.push(
      waehleAktion(
        boss,
        lage,
        s,
        zufall,
        aktionen.map((a) => a.id),
      ),
    );
    // „Handelt noch einmal“: höchstens eine zusätzliche Aktion pro Zug.
    if (!extra && aktionen.at(-1)?.folgen?.extraAktion) {
      extra = true;
      anzahl++;
    }
  }
  if (!extra && aktionen.some((a) => a.folgen?.extraAktion)) {
    aktionen.push(
      waehleAktion(
        boss,
        lage,
        s,
        zufall,
        aktionen.map((a) => a.id),
      ),
    );
  }

  const spruch = neuerSpruch(boss.sprueche[s], lage.letzteSprueche, zufall);
  const lebenAenderungen: BossZug['lebenAenderungen'] = [];
  let heilung = 0;
  let schutz = 0;
  let zusatzDiener = 0;
  const benannteDiener: DienerVorlage[] = [];
  const dienerBonus = { staerke: 0, widerstand: 0 };
  let dienerOpfern = 0;
  for (const a of aktionen) {
    const f = a.folgen ?? {};
    if (f.leben) {
      for (const id of zielSpieler(lage, f.leben.ziel, zufall)) {
        lebenAenderungen.push({ spielerId: id, um: f.leben.um });
      }
    }
    heilung += f.heilung ?? 0;
    if (f.heilungAusVerlust) {
      heilung += Math.min(
        f.heilungAusVerlust.max,
        Math.floor(verlust * f.heilungAusVerlust.anteil),
      );
    }
    schutz += f.schutz ?? 0;
    const benannt = f.dienerName && boss.diener.find((d) => d.name === f.dienerName);
    if (benannt) {
      for (let i = 0; i < (f.diener ?? 1); i++) benannteDiener.push(benannt);
    } else {
      zusatzDiener += f.diener ?? 0;
    }
    dienerBonus.staerke += f.dienerBonus?.staerke ?? 0;
    dienerBonus.widerstand += f.dienerBonus?.widerstand ?? 0;
    dienerOpfern += f.dienerOpfern ?? 0;
  }

  // Runden-Effekt (z. B. Hunger): trifft jeden Spieler in jedem Boss-Zug.
  let rundenEffekt: string | null = null;
  if (boss.rundenEffekt) {
    const e = boss.rundenEffekt;
    const menge = Math.floor(
      Math.min(e.max ?? Infinity, (e.leben ?? 0) + (e.lebenProDiener ?? 0) * lage.diener),
    );
    if (menge > 0) {
      rundenEffekt = e.text;
      for (const sp of lage.spieler) lebenAenderungen.push({ spielerId: sp.id, um: -menge });
    }
  }

  const neueDiener: DienerVorlage[] = [
    ...Array.from({ length: dienerNachschub(lage.runde, lage.diener) + zusatzDiener }, () =>
      zufaelligAus(boss.diener, zufall),
    ),
    ...benannteDiener,
  ];

  // Wer schwächelt, wird gejagt; sonst trifft es den Spieler mit den meisten Leben.
  const angriffsziel =
    lage.diener + neueDiener.length > 0
      ? zielSpieler(lage, s === 'ueberlegen' ? 'wenigsteLeben' : 'meisteLeben', zufall)[0]
      : null;

  return {
    phase: p,
    stimmung: s,
    spruch: fuelle(spruch, lage, verlust, boss),
    spruchVorlage: spruch,
    aktionen: aktionen.map((a) => ({
      id: a.id,
      name: a.name,
      text: fuelle(a.text, lage, verlust, boss),
      schlagworte: a.schlagworte,
    })),
    lebenAenderungen,
    heilung,
    schutz,
    neueDiener,
    dienerBonus,
    dienerOpfern,
    rundenEffekt,
    angriffsziel,
    ankuendigung,
    spezialAngekuendigt,
    spezialEingesetzt: aktionen.includes(boss.spezial),
  };
}
