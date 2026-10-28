import { BossAktion, BossDefinition, Lage, Planerstufe, Relikt } from './boss-modell';

export const PLANERSTUFEN: Record<
  Planerstufe,
  { name: string; text: string; hinweis: string; schaerfe: number }
> = {
  instinkt: {
    name: 'Instinkt',
    text: 'handelt aus Stimmung und Laune',
    hinweis: 'So sind die Level ausbalanciert.',
    schaerfe: 0,
  },
  taktiker: {
    name: 'Taktiker',
    text: 'rechnet seine Züge zwei Runden voraus',
    hinweis: 'Merklich schwerer ab Level 4.',
    schaerfe: 0.35,
  },
  gerissen: {
    name: 'Gerissen',
    text: 'rechnet voraus und spielt meist den stärksten Zug',
    hinweis: 'Für erfahrene Gruppen – deutlich schwerer.',
    schaerfe: 0.75,
  },
};

const START_LEBEN = 40;
/** Anteil des Diener-Angriffs, der nach Blocks bei den Spielern ankommt. */
const DURCHKOMMEN = 0.6;

/** Was der Boss über den Tisch weiß – geschätzt aus Antworten und dem, was ihm zugestoßen ist. */
interface Bild {
  boss: number;
  schutz: number;
  spieler: number[];
  /** Schaden, den die Spieler ihm pro Runde zufügen. */
  druck: number;
  /** Stärke seiner angriffsfähigen Diener. */
  diener: number;
  dienerAnzahl: number;
  kreaturen: number;
}

/** Wie viele Kreaturen und wie viel Schaden die Spieler vermutlich haben. */
function bildAus(lage: Lage): Bild {
  const a = lage.antworten;
  const kreaturen =
    { '0-2': 1, '3-5': 4, '6-9': 7, '10+': 11 }[a.kreaturen ?? ''] ??
    Math.min(10, 1 + lage.runde * 0.8);
  // Kreaturen werden im Lauf der Partie größer.
  const staerke = 1.5 + Math.min(lage.runde, 12) * 0.25;
  const geschaetzt = kreaturen * staerke * 0.6 + (a.grosseKreatur === 'ja' ? 4 : 0);
  const erlitten = Math.max(0, lage.lebenVorher - lage.leben);
  // Was er wirklich abbekommen hat, zählt mehr als die Schätzung.
  const druck = erlitten > 0 ? erlitten * 0.6 + geschaetzt * 0.4 : geschaetzt;
  return {
    boss: lage.leben,
    schutz: 0,
    spieler: lage.spieler.map((s) => s.leben),
    druck,
    diener: lage.dienerMacht ?? lage.diener * 2,
    dienerAnzahl: lage.diener,
    kreaturen,
  };
}

/** Grob, wie viel vom Druck der Spieler eine Kontroll-Aktion nimmt, und ob dauerhaft. */
function kontrolle(text: string, bild: Bild): { anteil: number; dauerhaft: boolean } {
  const t = text.toLowerCase();
  const n = /\bdrei\b/.test(t) ? 3 : /\bzwei\b/.test(t) ? 2 : 1;
  // Die stärkste Kreatur trägt mehr als ihren Anteil.
  const eine = Math.min(0.6, 1.5 / Math.max(1, bild.kreaturen));
  if (/alle kreaturen/.test(t) && /(zerstör|exil|schaden|−\d)/.test(t)) {
    return { anteil: /oder weniger/.test(t) ? 0.45 : 0.7, dauerhaft: !/bis zum/.test(t) };
  }
  if (/(zerstör|ins exil|opfer|auf die hand|kehrt|erhält \d+ schaden|−1\/−1-marke)/.test(t)) {
    return { anteil: Math.min(0.8, eine * n), dauerhaft: true };
  }
  if (/(tappe|nicht angreifen|weder angreifen|höchstens zwei)/.test(t)) {
    return {
      anteil: /alle|oder weniger/.test(t) ? 0.4 : Math.min(0.6, eine * n),
      dauerhaft: false,
    };
  }
  if (/−\d+\/−\d+|−\d+\/−0/.test(t)) return { anteil: 0.3, dauerhaft: false };
  if (/(abwerfen|wirft|mischt seine hand|kostet)/.test(t))
    return { anteil: 0.12, dauerhaft: false };
  return { anteil: 0, dauerhaft: false };
}

function mittlereStaerke(boss: BossDefinition): number {
  const angreifer = boss.diener.filter((d) => !d.greiftNichtAn);
  return angreifer.reduce((s, d) => s + d.staerke, 0) / Math.max(1, angreifer.length);
}

/** Phasen-Schild: Schaden reicht in einem Zug höchstens bis zur nächsten Phasengrenze. */
function schadenNehmen(bild: Bild, schaden: number, maxLeben: number): void {
  const nachSchutz = Math.max(0, schaden - bild.schutz);
  bild.schutz = Math.max(0, bild.schutz - schaden);
  const grenze = [0.6, 0.3].map((f) => Math.floor(maxLeben * f)).find((g) => bild.boss > g);
  const ziel = bild.boss - nachSchutz;
  bild.boss = grenze !== undefined && ziel < grenze ? grenze : ziel;
}

function heilen(bild: Bild, menge: number, maxLeben: number): void {
  const deckel = [maxLeben, Math.floor(maxLeben * 0.6), Math.floor(maxLeben * 0.3)].filter(
    (g) => g >= bild.boss,
  );
  bild.boss = Math.min(bild.boss + menge, Math.min(...deckel));
}

function spielerTreffen(bild: Bild, ziel: string, um: number): void {
  if (!bild.spieler.length) return;
  if (ziel === 'alle') {
    bild.spieler = bild.spieler.map((l) => l + um);
    return;
  }
  // Wen es genau trifft, ist für die Bewertung fast egal – es trifft den mit den meisten Leben.
  const i = bild.spieler.indexOf(
    ziel === 'wenigsteLeben' ? Math.min(...bild.spieler) : Math.max(...bild.spieler),
  );
  bild.spieler[i] += um;
}

/** Was eine Karte des Bosses in einem seiner Züge bringt. */
function reliktZug(r: Relikt, bild: Bild, maxLeben: number): void {
  const z = r.proZug;
  if (!z) return;
  if (z.leben) spielerTreffen(bild, 'alle', -z.leben);
  heilen(bild, (z.heilung ?? 0) + (z.heilungProDiener ?? 0) * bild.dienerAnzahl, maxLeben);
  bild.schutz += z.schutz ?? 0;
}

/**
 * Spielt eine Aktion zwei Runden voraus: Wirkung jetzt, Zug der Spieler, Angriff der Diener,
 * noch ein Zug der Spieler. Höher ist besser für den Boss.
 */
export function aktionBewerten(boss: BossDefinition, lage: Lage, aktion: BossAktion): number {
  const bild = bildAus(lage);
  const max = lage.maxLeben;
  const f = aktion.folgen ?? {};

  if (f.leben)
    spielerTreffen(bild, f.leben.ziel === 'rache' ? 'meisteLeben' : f.leben.ziel, f.leben.um);
  heilen(bild, f.heilung ?? 0, max);
  if (f.heilungAusVerlust) {
    const verlust = Math.max(0, lage.lebenVorher - lage.leben);
    heilen(bild, Math.min(f.heilungAusVerlust.max, verlust * f.heilungAusVerlust.anteil), max);
  }
  bild.schutz += f.schutz ?? 0;

  const neue = f.diener ?? 0;
  const neueStaerke = f.dienerName
    ? (boss.diener.find((d) => d.name === f.dienerName)?.staerke ?? mittlereStaerke(boss))
    : mittlereStaerke(boss);
  bild.diener += neue * neueStaerke;
  bild.dienerAnzahl += neue;
  bild.diener += (f.dienerBonus?.staerke ?? 0) * bild.dienerAnzahl;
  if (f.dienerOpfern) {
    const weg = Math.min(f.dienerOpfern, bild.dienerAnzahl);
    bild.diener = Math.max(0, bild.diener - weg * Math.max(1, mittlereStaerke(boss) - 1));
    bild.dienerAnzahl -= weg;
  }

  // Eine neue Karte wirkt über die nächsten beiden Boss-Züge; gemittelt über seine freien Karten.
  let reliktWert: Relikt[] = [];
  if (f.relikt) {
    const liegend = new Set((lage.relikte ?? []).map((l) => l.id));
    reliktWert = boss.relikte.filter((r) => !liegend.has(r.id) && r.id !== boss.startRelikt);
  }

  const k = kontrolle(aktion.text, bild);
  const druckJetzt = bild.druck * (1 - k.anteil);
  const druckDanach = bild.druck * (1 - (k.dauerhaft ? k.anteil : k.anteil * 0.3));

  // Runde 1: die Spieler schlagen zu, dann greifen seine Diener an.
  schadenNehmen(bild, druckJetzt, max);
  bild.schutz = 0;
  if (reliktWert.length) {
    const r = reliktWert[0];
    reliktZug(r, bild, max);
    // Karten mit Dienern machen seinen nächsten Angriff stärker.
    if (r.proZug?.diener) bild.diener += r.proZug.diener * mittlereStaerke(boss);
  }
  spielerTreffen(bild, 'meisteLeben', -bild.diener * DURCHKOMMEN);
  // Runde 2: noch ein Zug der Spieler.
  schadenNehmen(bild, druckDanach, max);

  const lebend = bild.spieler.filter((l) => l > 0);
  const spielerAnteil =
    lebend.reduce((s, l) => s + l, 0) / (Math.max(1, lage.spieler.length) * START_LEBEN);
  return (
    Math.max(0, bild.boss) / max -
    1.2 * spielerAnteil +
    (bild.boss <= 0 ? -1.5 : 0) +
    0.4 * (lage.spieler.length - lebend.length)
  );
}

/**
 * Faktoren, mit denen die Gewichte der Kandidaten multipliziert werden. Gute Züge werden
 * wahrscheinlicher, schlechte seltener – je nach Schärfe der Stufe.
 */
export function planerFaktoren(
  boss: BossDefinition,
  lage: Lage,
  kandidaten: BossAktion[],
  stufe: Planerstufe = 'instinkt',
): number[] {
  const schaerfe = PLANERSTUFEN[stufe].schaerfe;
  if (!schaerfe || kandidaten.length < 2) return kandidaten.map(() => 1);
  const werte = kandidaten.map((a) => aktionBewerten(boss, lage, a));
  const mittel = werte.reduce((s, w) => s + w, 0) / werte.length;
  const streuung = Math.sqrt(werte.reduce((s, w) => s + (w - mittel) ** 2, 0) / werte.length);
  if (streuung < 1e-6) return kandidaten.map(() => 1);
  return werte.map((w) => Math.exp((schaerfe * (w - mittel)) / streuung));
}
