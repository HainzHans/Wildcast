import type { VarianteId } from '../core/spiel/modell';
import type { SymbolName } from '../shared/ui/symbol';

/** Symbol und Akzentfarbe jeder Variante – überall in der App gleich. */
export const VARIANTEN_AUSSEHEN: Record<VarianteId, { symbol: SymbolName; farbe: string }> = {
  normal: { symbol: 'spieler', farbe: 'var(--messing)' },
  'mana-wuerfel': { symbol: 'mana-wuerfel', farbe: 'var(--chaos)' },
  boss: { symbol: 'boss', farbe: 'var(--negativ)' },
  welten: { symbol: 'welten', farbe: 'var(--positiv)' },
  untergang: { symbol: 'untergang', farbe: 'var(--himmel)' },
  segen: { symbol: 'segen', farbe: 'var(--messing)' },
  basar: { symbol: 'basar', farbe: 'var(--messing)' },
};
