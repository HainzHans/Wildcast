import { Zufall } from '../../core/zufall';
import { heilen, repertoireWaehlen, schadenAmBoss, temperamentWaehlen } from './boss-logik';
import {
  Antworten,
  BossDefinition,
  BossZug,
  DienerVorlage,
  FrageId,
  Lage,
  Stimmung,
  Temperament,
} from './boss-modell';

/** So viele vergangene Aktionen und Sprüche merkt sich der Boss, um sich nicht zu wiederholen. */
const GEDAECHTNIS = 6;

/** Ein Diener auf dem Tisch. Die Nummer bleibt stabil, damit „Besiegt“ den richtigen trifft. */
export interface Diener extends DienerVorlage {
  nr: number;
  getappt: boolean;
}

export interface BossProtokoll {
  runde: number;
  stimmung: Stimmung;
  spruch: string;
  aktionen: { name: string; text: string }[];
  neueDiener: string[];
  angriffsziel: string | null;
  /** Wie viele Diener tatsächlich angegriffen haben. */
  angreifer: number;
  ankuendigung: string | null;
  lebenAenderungen: { name: string; um: number }[];
}

/** Alles, was der Bosskampf über die Leben der Spieler hinaus speichert. */
export interface BossStand {
  bossId: string;
  leben: number;
  maxLeben: number;
  /** Leben zu Beginn des vorigen Boss-Zugs. */
  lebenVorher: number;
  /** Phasen-Schild: hält bis zum nächsten Boss-Zug oder bis ihn jemand aufhebt. */
  schild: boolean;
  schutz: number;
  runde: number;
  diener: Diener[];
  naechsteNr: number;
  letzteAktionen: string[];
  verlauf: string[];
  letzteFragen: FrageId[];
  /** Antworten aus früheren Zügen – der Boss erinnert sich, auch wenn er nicht neu fragt. */
  gemerkteAntworten: Antworten;
  letzteSprueche: string[];
  spezialAngekuendigt: boolean;
  ankuendigung: string | null;
  protokoll: BossProtokoll[];
  /** Charakterzug und beherrschte Aktionen – pro Partie neu gewürfelt, gleich stark. */
  temperament: Temperament;
  repertoire: string[];
}

function dienerAnlegen(stand: BossStand, vorlagen: DienerVorlage[]): BossStand {
  const neu = vorlagen.map((v, i) => ({ ...v, nr: stand.naechsteNr + i, getappt: false }));
  return { ...stand, diener: [...stand.diener, ...neu], naechsteNr: stand.naechsteNr + neu.length };
}

export function bossStarten(boss: BossDefinition, zufall: Zufall): BossStand {
  const leer: BossStand = {
    bossId: boss.id,
    leben: boss.leben,
    maxLeben: boss.leben,
    lebenVorher: boss.leben,
    schild: false,
    schutz: 0,
    runde: 1,
    diener: [],
    naechsteNr: 1,
    letzteAktionen: [],
    verlauf: [],
    letzteFragen: [],
    gemerkteAntworten: {},
    letzteSprueche: [],
    spezialAngekuendigt: false,
    ankuendigung: null,
    protokoll: [],
    temperament: temperamentWaehlen(zufall),
    repertoire: repertoireWaehlen(boss, zufall),
  };
  const start = Array.from(
    { length: boss.startDiener },
    () => boss.diener[Math.floor(zufall() * boss.diener.length)],
  );
  return dienerAnlegen(leer, start);
}

/** Schaden durch die Spieler, mit Phasen-Schild. Gibt zusätzlich zurück, wie viel verfallen ist. */
export function bossTreffen(
  stand: BossStand,
  schaden: number,
): { stand: BossStand; verfallen: number } {
  const { verfallen, ...nach } = schadenAmBoss(stand, schaden);
  return { stand: { ...stand, ...nach }, verfallen };
}

/** Heilung oder Korrektur nach oben, z. B. wenn sich jemand vertippt hat. */
export function bossKorrigieren(stand: BossStand, um: number): BossStand {
  return { ...stand, leben: Math.min(stand.maxLeben, Math.max(0, stand.leben + um)) };
}

/** Für den nächsten Spielerzug: Der Schild gilt nur für den Zug, in dem die Grenze erreicht wurde. */
export function schildAufheben(stand: BossStand): BossStand {
  return { ...stand, schild: false };
}

export function dienerBesiegen(stand: BossStand, nr: number): BossStand {
  return { ...stand, diener: stand.diener.filter((d) => d.nr !== nr) };
}

/** Für Effekte der Spieler, die Diener tappen oder enttappen. */
export function dienerTappen(stand: BossStand, nr: number): BossStand {
  return {
    ...stand,
    diener: stand.diener.map((d) => (d.nr === nr ? { ...d, getappt: !d.getappt } : d)),
  };
}

export function bossLage(
  stand: BossStand,
  spieler: { id: number; name: string; leben: number }[],
  antworten: Antworten,
): Lage {
  return {
    runde: stand.runde,
    leben: stand.leben,
    maxLeben: stand.maxLeben,
    lebenVorher: stand.lebenVorher,
    diener: stand.diener.length,
    spieler,
    // Neue Antworten gehen vor; was er nicht neu gefragt hat, weiß er noch vom letzten Mal.
    antworten: { ...stand.gemerkteAntworten, ...antworten },
    letzteAktionen: stand.letzteAktionen,
    verlauf: stand.verlauf,
    letzteFragen: stand.letzteFragen,
    letzteSprueche: stand.letzteSprueche,
    spezialAngekuendigt: stand.spezialAngekuendigt,
    temperament: stand.temperament ?? 'unberechenbar',
    // Ältere Spielstände kennen kein Repertoire: dann beherrscht er alles.
    repertoire: stand.repertoire?.length ? stand.repertoire : undefined,
  };
}

/** Der Boss opfert seine schwächsten Diener zuerst. */
function opfern(diener: Diener[], anzahl: number): Diener[] {
  if (anzahl <= 0) return diener;
  const weg = new Set(
    [...diener]
      .sort((a, b) => a.staerke + a.widerstand - (b.staerke + b.widerstand))
      .slice(0, anzahl)
      .map((d) => d.nr),
  );
  return diener.filter((d) => !weg.has(d.nr));
}

/**
 * Wie in Magic: Zu Beginn seines Zuges enttappt der Boss seine Diener. Angreifen dürfen alle,
 * die schon da waren, und neue mit Eile – außer reinen Blockern. Wer angreift, wird getappt,
 * es sei denn, er hat Wachsamkeit.
 */
function angreifen(diener: Diener[], neueNr: Set<number>): { diener: Diener[]; angreifer: number } {
  let angreifer = 0;
  const nach = diener.map((d) => {
    const darf = !d.greiftNichtAn && (!neueNr.has(d.nr) || d.eile);
    if (!darf) return { ...d, getappt: false };
    angreifer++;
    return { ...d, getappt: !d.wachsamkeit };
  });
  return { diener: nach, angreifer };
}

/**
 * Trägt einen ausgewürfelten Boss-Zug ein: Heilung, Schutz, neue Diener, Angriff, Gedächtnis
 * und Protokoll. Danach beginnt die nächste Runde. Die Leben der Spieler ändert der Store.
 */
export function bossZugEintragen(
  stand: BossStand,
  zug: BossZug,
  spieler: { id: number; name: string }[],
  antworten: Antworten,
): BossStand {
  const name = (id: number | null) => spieler.find((s) => s.id === id)?.name ?? null;
  const nachOpfer = { ...stand, diener: opfern(stand.diener, zug.dienerOpfern ?? 0) };
  const mitDienern = dienerAnlegen(nachOpfer, zug.neueDiener);
  const bonus = zug.dienerBonus ?? { staerke: 0, widerstand: 0 };
  mitDienern.diener = mitDienern.diener.map((d) => ({
    ...d,
    staerke: d.staerke + bonus.staerke,
    widerstand: d.widerstand + bonus.widerstand,
  }));
  const neueNr = new Set(mitDienern.diener.slice(nachOpfer.diener.length).map((d) => d.nr));
  const angriff =
    zug.angriffsziel === null
      ? { diener: mitDienern.diener.map((d) => ({ ...d, getappt: false })), angreifer: 0 }
      : angreifen(mitDienern.diener, neueNr);
  // Wer ihm diese Runde am meisten geschadet hat, gilt nur für diese Runde.
  const { rache: _, ...gemerkt } = { ...stand.gemerkteAntworten, ...antworten };

  return {
    ...mitDienern,
    diener: angriff.diener,
    leben: heilen(stand.leben, stand.maxLeben, zug.heilung),
    lebenVorher: stand.leben,
    schutz: zug.schutz,
    schild: false,
    runde: stand.runde + 1,
    letzteAktionen: zug.aktionen.map((a) => a.id),
    verlauf: [...stand.verlauf, ...zug.aktionen.map((a) => a.id)].slice(-GEDAECHTNIS),
    letzteFragen: Object.keys(antworten) as FrageId[],
    gemerkteAntworten: gemerkt,
    letzteSprueche: [...stand.letzteSprueche, zug.spruchVorlage].slice(-GEDAECHTNIS),
    spezialAngekuendigt: zug.spezialAngekuendigt,
    ankuendigung: zug.ankuendigung,
    protokoll: [
      ...stand.protokoll,
      {
        runde: stand.runde,
        stimmung: zug.stimmung,
        spruch: zug.spruch,
        aktionen: zug.aktionen.map(({ name, text }) => ({ name, text })),
        neueDiener: zug.neueDiener.map((d) => d.name),
        angriffsziel: angriff.angreifer ? name(zug.angriffsziel) : null,
        angreifer: angriff.angreifer,
        ankuendigung: zug.ankuendigung,
        lebenAenderungen: zug.lebenAenderungen.map((l) => ({
          name: name(l.spielerId) ?? '',
          um: l.um,
        })),
      },
    ],
  };
}
