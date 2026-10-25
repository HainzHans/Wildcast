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

/** Ohne passende ID der erste Boss. */
export function bossMitId(id: string | undefined): BossDefinition {
  return BOSSE.find((b) => b.id === id) ?? BOSSE[0];
}
