import type { Spieler } from '../../core/spiel/modell';
import type { Zufall } from '../../core/zufall';

/** Wie schnell der Sturm stärker wird. */
export type SturmStaerke = 'sanft' | 'normal' | 'hart';

export interface SturmEinstellungen {
  /** In dieser Runde trifft der Sturm zum ersten Mal. */
  abRunde: number;
  staerke: SturmStaerke;
}

export const STANDARD_STURM: SturmEinstellungen = { abRunde: 3, staerke: 'normal' };
export const STURM_START = [2, 3, 4, 5, 6];
export const STURM_STAERKEN: Record<SturmStaerke, { name: string; alle: number }> = {
  sanft: { name: 'Sanft', alle: 3 },
  normal: { name: 'Normal', alle: 2 },
  hart: { name: 'Hart', alle: 1 },
};
/** Alle so viele Sturmrunden fällt ein Versorgungsabwurf. */
const ABWURF_ALLE = 3;

/** Ein Versorgungsabwurf. Leben und Schutz trägt die App selbst ein. */
export interface Abwurf {
  id: string;
  name: string;
  text: string;
  leben?: number;
  /** Der Sturm verschont diesen Spieler in der nächsten Runde. */
  schutz?: boolean;
}

export const ABWUERFE: Abwurf[] = [
  { id: 'vorraete', name: 'Vorräte', text: 'Erhalte 6 Leben.', leben: 6 },
  {
    id: 'schutzkuppel',
    name: 'Schutzkuppel',
    text: 'Der Sturm verschont dich in der nächsten Runde.',
    schutz: true,
  },
  { id: 'schatzkiste', name: 'Schatzkiste', text: 'Erzeuge drei Schatz-Spielsteine.' },
  { id: 'feldpost', name: 'Feldpost', text: 'Ziehe zwei Karten.' },
  {
    id: 'kartograph',
    name: 'Kartograph',
    text: 'Suche in deiner Bibliothek nach einem Standardland, bringe es getappt ins Spiel und mische danach.',
  },
  {
    id: 'sturmklinge',
    name: 'Sturmklinge',
    text: 'Erzeuge einen farblosen Ausrüstungs-Artefaktspielstein „Sturmklinge“ mit „Ausgerüstete Kreatur erhält +2/+1“ und Ausrüsten {2}.',
  },
  {
    id: 'soeldner',
    name: 'Söldner',
    text: 'Erzeuge zwei 2/2 weiße Soldat-Kreaturenspielsteine mit Wachsamkeit.',
  },
  { id: 'heiltrank', name: 'Heiltrank', text: 'Erhalte 3 Leben und ziehe eine Karte.', leben: 3 },
  {
    id: 'sprengsatz',
    name: 'Sprengsatz',
    text: 'Zerstöre ein Artefakt oder eine Verzauberung deiner Wahl.',
  },
  {
    id: 'wurfmesser',
    name: 'Wurfmesser',
    text: 'Füge einer Kreatur oder einem Planeswalker deiner Wahl 4 Schaden zu.',
  },
  {
    id: 'funkfeuer',
    name: 'Funkfeuer',
    text: 'Schau dir die obersten fünf Karten deiner Bibliothek an. Nimm eine auf die Hand und lege den Rest in beliebiger Reihenfolge unter die Bibliothek.',
  },
  {
    id: 'grabraub',
    name: 'Grabraub',
    text: 'Nimm eine Kreaturenkarte aus deinem Friedhof auf die Hand.',
  },
  {
    id: 'manakristall',
    name: 'Manakristall',
    text: 'Bringe bis zu zwei Standardländer aus deiner Hand ins Spiel.',
  },
  {
    id: 'nebelwand',
    name: 'Nebelwand',
    text: 'Verhindere bis zu deinem nächsten Zug allen Kampfschaden, der dir zugefügt würde.',
  },
  {
    id: 'adrenalin',
    name: 'Adrenalin',
    text: 'Kreaturen, die du kontrollierst, erhalten bis zum Ende deines nächsten Zugs +2/+0 und Eile.',
  },
  {
    id: 'heimkehr',
    name: 'Heimkehr',
    text: 'Wirke deinen Kommandeur das nächste Mal ohne Kommandeurssteuer.',
  },
];

export interface SturmStand {
  abRunde: number;
  staerke: SturmStaerke;
  /** Schaden, den der Sturm zuletzt angerichtet hat, und in welcher Runde. */
  zuletzt: { runde: number; schaden: number } | null;
  /** Spieler, die der Sturm in der nächsten Runde verschont. */
  geschuetzt: number[];
  /** Offener Versorgungsabwurf: wer in welcher Reihenfolge wählt. */
  abwurf: { angebote: string[]; reihenfolge: number[] } | null;
}

export function abwurfMitId(id: string): Abwurf | undefined {
  return ABWUERFE.find((a) => a.id === id);
}

export function sturmStarten(e: SturmEinstellungen): SturmStand {
  return { abRunde: e.abRunde, staerke: e.staerke, zuletzt: null, geschuetzt: [], abwurf: null };
}

/** Schaden des Sturms in dieser Runde: 0 vor dem Start, dann steigend. */
export function sturmSchaden(
  stand: Pick<SturmStand, 'abRunde' | 'staerke'>,
  runde: number,
): number {
  if (runde < stand.abRunde) return 0;
  return Math.floor((runde - stand.abRunde) / STURM_STAERKEN[stand.staerke].alle) + 1;
}

/** Die ersten Werte des Sturms, z. B. für die Anzeige beim Einrichten. */
export function sturmVerlauf(e: SturmEinstellungen, runden = 8): number[] {
  return Array.from({ length: runden }, (_, i) => sturmSchaden(e, e.abRunde + i));
}

/** Runden, bis der nächste Abwurf fällt (0 = in dieser Runde). */
export function rundenBisAbwurf(stand: SturmStand, runde: number): number {
  const erste = stand.abRunde + ABWURF_ALLE - 1;
  if (runde <= erste) return erste - runde;
  return (ABWURF_ALLE - ((runde - erste) % ABWURF_ALLE)) % ABWURF_ALLE;
}

function mischen<T>(liste: T[], zufall: Zufall): T[] {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Eine neue Runde beginnt: Der Sturm trifft alle, die noch leben und nicht geschützt sind.
 * Ist es Zeit für einen Abwurf, wählt der Spieler mit den wenigsten Leben zuerst.
 */
export function sturmRunde(
  stand: SturmStand,
  spieler: Spieler[],
  runde: number,
  zufall: Zufall,
): { stand: SturmStand; spieler: Spieler[] } {
  const schaden = sturmSchaden(stand, runde);
  if (!schaden) return { stand, spieler };

  const getroffen = spieler.map((p) =>
    p.leben > 0 && !stand.geschuetzt.includes(p.id) ? { ...p, leben: p.leben - schaden } : p,
  );
  const lebend = getroffen.filter((p) => p.leben > 0);
  const abwurf =
    rundenBisAbwurf(stand, runde) === 0 && lebend.length
      ? {
          angebote: mischen(ABWUERFE, zufall)
            .slice(0, Math.max(2, lebend.length))
            .map((a) => a.id),
          reihenfolge: [...lebend]
            .sort((a, b) => a.leben - b.leben || a.id - b.id)
            .map((p) => p.id),
        }
      : stand.abwurf;
  return {
    stand: { ...stand, zuletzt: { runde, schaden }, geschuetzt: [], abwurf },
    spieler: getroffen,
  };
}

/** Der nächste Spieler in der Reihenfolge nimmt sich ein Angebot aus dem Abwurf. */
export function abwurfWaehlen(
  stand: SturmStand,
  spieler: Spieler[],
  angebotId: string,
): { stand: SturmStand; spieler: Spieler[] } {
  const a = stand.abwurf;
  const abwurf = abwurfMitId(angebotId);
  if (!a || !abwurf || !a.angebote.includes(angebotId)) return { stand, spieler };
  const [waehlt, ...rest] = a.reihenfolge;
  const angebote = a.angebote.filter((id) => id !== angebotId);
  return {
    stand: {
      ...stand,
      geschuetzt: abwurf.schutz ? [...stand.geschuetzt, waehlt] : stand.geschuetzt,
      abwurf: rest.length && angebote.length ? { angebote, reihenfolge: rest } : null,
    },
    spieler: abwurf.leben
      ? spieler.map((p) => (p.id === waehlt ? { ...p, leben: p.leben + abwurf.leben! } : p))
      : spieler,
  };
}
