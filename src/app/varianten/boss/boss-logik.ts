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
  Stimmung,
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

/** Wachstum: Runde 1–2 ein Diener, 3–4 zwei, ab 5 drei. Nachschub ab Runde 2 bei höchstens einem Diener. */
export function dienerNachschub(runde: number, diener: number): number {
  const wachstum = runde <= 2 ? 1 : runde <= 4 ? 2 : 3;
  const nachschub = runde >= 2 && diener <= 1 ? 2 : 0;
  return wachstum + nachschub;
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
  wuetend: { angriff: 2.5, beschwoerung: 1.5, kontrolle: 1, heilung: 0.5 },
  bedroht: { angriff: 1, beschwoerung: 1, kontrolle: 3, heilung: 0.5 },
  ueberlegen: { angriff: 3, beschwoerung: 0.8, kontrolle: 0.7, heilung: 0.3 },
  verzweifelt: { angriff: 0.7, beschwoerung: 2.5, kontrolle: 1, heilung: 3 },
  lauernd: { angriff: 1, beschwoerung: 1.5, kontrolle: 1, heilung: 0.7 },
};

function verfuegbar(aktion: BossAktion, p: Phase): boolean {
  return !aktion.phasen || aktion.phasen.includes(p);
}

export function aktionsGewicht(aktion: BossAktion, lage: Lage, s: Stimmung): number {
  if (!verfuegbar(aktion, phase(lage.leben, lage.maxLeben))) return 0;
  if (aktion.folgen?.heilung && lage.leben >= lage.maxLeben) return 0;
  const neigung = Math.max(...aktion.schlagworte.map((w) => NEIGUNG[s][w]));
  const treffer = Object.entries(aktion.bevorzugt ?? {}).filter(([frage, werte]) =>
    werte?.includes(lage.antworten[frage as FrageId] ?? ''),
  ).length;
  return aktion.gewicht * neigung * 2 ** treffer;
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
  const gesperrt = new Set([...ausschluss, lage.letzteAktionen.at(-1) ?? '']);
  const kandidaten = boss.aktionen
    .filter((a) => !gesperrt.has(a.id))
    .map((a) => ({ wert: a, gewicht: aktionsGewicht(a, lage, s) }));
  return (
    gewichtetAus(kandidaten, zufall) ??
    boss.aktionen.find((a) => !gesperrt.has(a.id)) ??
    boss.aktionen[0]
  );
}

/**
 * Höchstens zwei Fragen pro Zug: zuerst die Kreaturen (davon hängt „bedroht“ ab), dann eine
 * weitere, die für die Aktionen der aktuellen Phase gerade am meisten zählt.
 */
export function fragenFuerZug(
  boss: BossDefinition,
  lage: Lage,
  zufall: Zufall,
  anzahl = 2,
): Frage[] {
  const p = phase(lage.leben, lage.maxLeben);
  const relevanz = new Map<FrageId, number>();
  for (const a of boss.aktionen.filter((a) => verfuegbar(a, p))) {
    for (const frage of Object.keys(a.bevorzugt ?? {}) as FrageId[]) {
      relevanz.set(frage, (relevanz.get(frage) ?? 0) + a.gewicht);
    }
  }
  const gewaehlt: FrageId[] = ['kreaturen'];
  while (gewaehlt.length < anzahl) {
    const naechste = gewichtetAus(
      [...relevanz]
        .filter(([f]) => !gewaehlt.includes(f))
        .map(([wert, gewicht]) => ({ wert, gewicht })),
      zufall,
    );
    if (!naechste) break;
    gewaehlt.push(naechste);
  }
  return gewaehlt
    .map((id) => boss.fragen.find((f) => f.id === id))
    .filter((f): f is Frage => !!f)
    .map((f) => (f.id === 'handkarten' ? mitSpielern(f, lage) : f));
}

/** Bei „Wer hat mehr Handkarten?“ sind die Spieler selbst die Antworten. */
function mitSpielern(frage: Frage, lage: Lage): Frage {
  const antworten: Antwort[] = lage.spieler.map((s) => ({ wert: String(s.id), label: s.name }));
  return { ...frage, antworten: [...antworten, ...frage.antworten] };
}

export function zielSpieler(lage: Lage, ziel: Ziel, zufall: Zufall): number[] {
  if (ziel === 'alle') return lage.spieler.map((s) => s.id);
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
  } else if (p === 3) {
    ankuendigung = boss.ankuendigung;
    spezialAngekuendigt = true;
  }
  const anzahl = p === 3 ? 2 : 1;
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
  }

  const lebenAenderungen: BossZug['lebenAenderungen'] = [];
  let heilung = 0;
  let schutz = 0;
  let zusatzDiener = 0;
  for (const a of aktionen) {
    const f = a.folgen ?? {};
    if (f.leben) {
      for (const id of zielSpieler(lage, f.leben.ziel, zufall)) {
        lebenAenderungen.push({ spielerId: id, um: f.leben.um });
      }
    }
    heilung += f.heilung ?? 0;
    schutz += f.schutz ?? 0;
    zusatzDiener += f.diener ?? 0;
  }

  const neueDiener: DienerVorlage[] = Array.from(
    { length: dienerNachschub(lage.runde, lage.diener) + zusatzDiener },
    () => zufaelligAus(boss.diener, zufall),
  );

  // Wer schwächelt, wird gejagt; sonst trifft es den Spieler mit den meisten Leben.
  const angriffsziel =
    lage.diener + neueDiener.length > 0
      ? zielSpieler(lage, s === 'ueberlegen' ? 'wenigsteLeben' : 'meisteLeben', zufall)[0]
      : null;

  return {
    phase: p,
    stimmung: s,
    spruch: fuelle(zufaelligAus(boss.sprueche[s], zufall), lage, verlust, boss),
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
    angriffsziel,
    ankuendigung,
    spezialAngekuendigt,
  };
}
