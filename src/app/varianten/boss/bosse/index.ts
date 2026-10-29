import { fuerSpielerzahl, spielerzahlGueltig } from '../boss-mehrspieler';
import { BossDefinition } from '../boss-modell';
import { DAEMONENFUERST } from './daemonenfuerst';
import { FLAMMENKOLOSS } from './flammenkoloss';
import { GORVAK } from './gorvak';
import { KNOCHENFUERST } from './knochenfuerst';
import { NEBELKOENIGIN } from './nebelkoenigin';
import { SCHWARMKOENIGIN } from './schwarmkoenigin';
import { SPIEGELHEXE } from './spiegelhexe';
import { STURMDRACHE } from './sturmdrache';
import { WELTENFRESSER } from './weltenfresser';
import { ZEITWEBER } from './zeitweber';

/** Alle Bosse, nach Level sortiert. */
export const BOSSE: BossDefinition[] = [
  SPIEGELHEXE,
  NEBELKOENIGIN,
  GORVAK,
  STURMDRACHE,
  KNOCHENFUERST,
  SCHWARMKOENIGIN,
  FLAMMENKOLOSS,
  ZEITWEBER,
  DAEMONENFUERST,
  WELTENFRESSER,
];

const angepasst = new Map<string, BossDefinition>();

/** Ohne passende ID der erste Boss. Mit mehr als zwei Spielern wird er entsprechend stärker. */
export function bossMitId(id: string | undefined, spielerzahl?: number): BossDefinition {
  const boss = BOSSE.find((b) => b.id === id) ?? BOSSE[0];
  const n = spielerzahlGueltig(spielerzahl);
  if (n === 2) return boss;
  const key = `${boss.id}:${n}`;
  if (!angepasst.has(key)) angepasst.set(key, fuerSpielerzahl(boss, n));
  return angepasst.get(key)!;
}
