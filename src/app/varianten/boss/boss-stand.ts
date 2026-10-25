import { Zufall } from '../../core/zufall';
import { heilen, schadenAmBoss } from './boss-logik';
import { Antworten, BossDefinition, BossZug, DienerVorlage, Lage, Stimmung } from './boss-modell';

/** Ein Diener auf dem Tisch. Die Nummer bleibt stabil, damit „Besiegt“ den richtigen trifft. */
export interface Diener extends DienerVorlage {
  nr: number;
}

export interface BossProtokoll {
  runde: number;
  stimmung: Stimmung;
  spruch: string;
  aktionen: { name: string; text: string }[];
  neueDiener: string[];
  angriffsziel: string | null;
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
  schild: boolean;
  schutz: number;
  runde: number;
  /** Spieler-ID oder der Boss. Reihenfolge: Spieler 1, Spieler 2, …, Boss. */
  amZug: number | 'boss';
  diener: Diener[];
  naechsteNr: number;
  letzteAktionen: string[];
  spezialAngekuendigt: boolean;
  ankuendigung: string | null;
  protokoll: BossProtokoll[];
}

function dienerAnlegen(stand: BossStand, vorlagen: DienerVorlage[]): BossStand {
  const neu = vorlagen.map((v, i) => ({ ...v, nr: stand.naechsteNr + i }));
  return { ...stand, diener: [...stand.diener, ...neu], naechsteNr: stand.naechsteNr + neu.length };
}

export function bossStarten(boss: BossDefinition, spielerIds: number[], zufall: Zufall): BossStand {
  const leer: BossStand = {
    bossId: boss.id,
    leben: boss.leben,
    maxLeben: boss.leben,
    lebenVorher: boss.leben,
    schild: false,
    schutz: 0,
    runde: 1,
    amZug: spielerIds[0],
    diener: [],
    naechsteNr: 1,
    letzteAktionen: [],
    spezialAngekuendigt: false,
    ankuendigung: null,
    protokoll: [],
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

/** Manuelle Korrektur nach oben, z. B. wenn sich jemand vertippt hat. */
export function bossKorrigieren(stand: BossStand, um: number): BossStand {
  return { ...stand, leben: Math.min(stand.maxLeben, Math.max(0, stand.leben + um)) };
}

export function dienerBesiegen(stand: BossStand, nr: number): BossStand {
  return { ...stand, diener: stand.diener.filter((d) => d.nr !== nr) };
}

/** Nächster am Zug. Mit jedem neuen Zug fällt der Phasen-Schild wieder. */
export function zugBeenden(stand: BossStand, spielerIds: number[]): BossStand {
  const i = stand.amZug === 'boss' ? -1 : spielerIds.indexOf(stand.amZug);
  const amZug = i + 1 < spielerIds.length ? spielerIds[i + 1] : 'boss';
  return { ...stand, amZug, schild: false };
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
    antworten,
    letzteAktionen: stand.letzteAktionen,
    spezialAngekuendigt: stand.spezialAngekuendigt,
  };
}

/**
 * Trägt einen ausgewürfelten Boss-Zug ein: Heilung, Schutz, neue Diener, Protokoll.
 * Danach beginnt die nächste Runde mit dem ersten Spieler. Die Leben der Spieler ändert der Store.
 */
export function bossZugEintragen(
  stand: BossStand,
  zug: BossZug,
  spieler: { id: number; name: string }[],
): BossStand {
  const name = (id: number | null) => spieler.find((s) => s.id === id)?.name ?? null;
  const mitDienern = dienerAnlegen(stand, zug.neueDiener);
  return {
    ...mitDienern,
    leben: heilen(stand.leben, stand.maxLeben, zug.heilung),
    lebenVorher: stand.leben,
    schutz: zug.schutz,
    schild: false,
    runde: stand.runde + 1,
    amZug: spieler[0]?.id ?? 'boss',
    letzteAktionen: zug.aktionen.map((a) => a.id),
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
        angriffsziel: name(zug.angriffsziel),
        ankuendigung: zug.ankuendigung,
        lebenAenderungen: zug.lebenAenderungen.map((l) => ({
          name: name(l.spielerId) ?? '',
          um: l.um,
        })),
      },
    ],
  };
}
