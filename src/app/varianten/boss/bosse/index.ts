import { BossDefinition } from '../boss-modell';
import { STURMDRACHE } from './sturmdrache';

/** Alle Bosse. Weitere Level kommen hier dazu. */
export const BOSSE: BossDefinition[] = [STURMDRACHE];

export function bossMitId(id: string | undefined): BossDefinition {
  return BOSSE.find((b) => b.id === id) ?? BOSSE[0];
}
