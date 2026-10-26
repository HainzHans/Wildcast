import { Zufall } from '../../core/zufall';
import { heilen, repertoireWaehlen, schadenAmBoss, temperamentWaehlen } from './boss-logik';
import {
  Antworten,
  BossDefinition,
  BossZug,
  DienerVorlage,
  FrageId,
  Lage,
  LiegendesRelikt,
  Stimmung,
  Temperament,
} from './boss-modell';
import { bossMitId } from './bosse';

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
  /** Neu gelegte Karte und was seine Karten bewirkt haben. Fehlt in älteren Spielständen. */
  relikte?: string[];
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
  /** Fehlt in älteren Spielständen. */
  spezialEingesetzt?: boolean;
  ankuendigung: string | null;
  protokoll: BossProtokoll[];
  /** Charakterzug und beherrschte Aktionen – pro Partie neu gewürfelt, gleich stark. */
  temperament: Temperament;
  repertoire: string[];
  /** Seine Artefakte und Verzauberungen auf dem Feld. */
  relikte: LiegendesRelikt[];
  /** Seit seinem letzten Zug zerstörte Karte – darauf reagiert er. */
  verlorenesRelikt: string | null;
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
    relikte: [],
    verlorenesRelikt: null,
  };
  const startRelikt = boss.relikte.find((r) => r.id === boss.startRelikt);
  if (startRelikt) {
    leer.relikte = [{ id: startRelikt.id, schaden: 0, countdown: startRelikt.countdown }];
  }
  const start = Array.from(
    { length: boss.startDiener },
    () => boss.diener[Math.floor(zufall() * boss.diener.length)],
  );
  return dienerAnlegen(leer, start);
}

/**
 * Schaden durch die Spieler, mit Phasen-Schild. Gibt zusätzlich zurück, wie viel verfallen ist.
 * Liegt eine Karte, die ihn unsterblich macht, bleibt er bei mindestens 1 Leben.
 */
export function bossTreffen(
  stand: BossStand,
  schaden: number,
  boss: BossDefinition = bossMitId(stand.bossId),
): { stand: BossStand; verfallen: number } {
  const { verfallen, ...nach } = schadenAmBoss(stand, schaden);
  const unsterblich = stand.relikte.some(
    (l) => boss.relikte.find((r) => r.id === l.id)?.unsterblich,
  );
  if (unsterblich && nach.leben < 1) {
    return { stand: { ...stand, ...nach, leben: 1 }, verfallen: verfallen + 1 - nach.leben };
  }
  return { stand: { ...stand, ...nach }, verfallen };
}

function reliktName(bossId: string, id: string): string {
  return bossMitId(bossId).relikte.find((r) => r.id === id)?.name ?? id;
}

/** Die Spieler zerstören eine Karte des Bosses, etwa mit einem Entfernungszauber. */
export function reliktZerstoeren(stand: BossStand, id: string): BossStand {
  if (!stand.relikte.some((l) => l.id === id)) return stand;
  return { ...stand, relikte: stand.relikte.filter((l) => l.id !== id), verlorenesRelikt: id };
}

/**
 * Schaden an einer Karte des Bosses, etwa von Kreaturen, die sie angreifen (negativ zum
 * Korrigieren). Fällt ihre Verteidigung auf 0, ist die Karte zerstört.
 */
export function reliktTreffen(
  stand: BossStand,
  id: string,
  schaden: number,
  boss: BossDefinition = bossMitId(stand.bossId),
): BossStand {
  const r = boss.relikte.find((x) => x.id === id);
  const liegend = stand.relikte.find((l) => l.id === id);
  if (!r || !liegend) return stand;
  const neu = Math.max(0, liegend.schaden + schaden);
  if (neu >= r.verteidigung) return reliktZerstoeren(stand, id);
  return {
    ...stand,
    relikte: stand.relikte.map((l) => (l.id === id ? { ...l, schaden: neu } : l)),
  };
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
    spezialEingesetzt: stand.spezialEingesetzt ?? false,
    temperament: stand.temperament ?? 'unberechenbar',
    // Ältere Spielstände kennen kein Repertoire: dann beherrscht er alles.
    repertoire: stand.repertoire?.length ? stand.repertoire : undefined,
    relikte: stand.relikte,
    verlorenesRelikt: stand.verlorenesRelikt ?? undefined,
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
  // Countdowns laufen weiter, Abgelaufenes verschwindet, Neues kommt dazu.
  const relikte = [
    ...stand.relikte
      .filter((l) => !zug.abgelaufen.includes(l.id))
      .map((l) => (l.countdown === undefined ? l : { ...l, countdown: l.countdown - 1 })),
    ...(zug.neuesRelikt ? [zug.neuesRelikt] : []),
  ];

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
    spezialEingesetzt: !!stand.spezialEingesetzt || zug.spezialEingesetzt,
    ankuendigung: zug.ankuendigung,
    relikte,
    verlorenesRelikt: null,
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
        relikte: [
          ...(zug.neuesRelikt
            ? [`Neu auf dem Feld: ${reliktName(stand.bossId, zug.neuesRelikt.id)}`]
            : []),
          ...zug.reliktEffekte,
        ],
      },
    ],
  };
}
