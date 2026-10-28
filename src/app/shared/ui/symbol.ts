import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Zeichnung {
  pfade: string[];
  /** cx, cy, r – gefüllt, wenn das vierte Feld true ist */
  kreise?: [number, number, number, boolean?][];
  gefuellt?: boolean;
}

/** Eigene Linien-Symbole im 24er-Raster, damit die App ohne Symbol-Bibliothek auskommt. */
const SYMBOLE = {
  spielen: { pfade: ['M8 5v14l11-7z'], gefuellt: true },
  varianten: { pfade: ['M4 19V5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14', 'M9 7h7'] },
  einstellungen: {
    pfade: ['M4 7h10', 'M18 7h2', 'M4 17h4', 'M12 17h8'],
    kreise: [
      [16, 7, 2],
      [10, 17, 2],
    ],
  },
  zurueck: { pfade: ['M15 18l-6-6 6-6'] },
  weiter: { pfade: ['M9 18l6-6-6-6'] },
  menue: { pfade: ['M4 7h16', 'M4 12h16', 'M4 17h16'] },
  rueckgaengig: { pfade: ['M9 14L4 9l5-5', 'M4 9h10a6 6 0 0 1 0 12h-3'] },
  schliessen: { pfade: ['M6 6l12 12', 'M18 6L6 18'] },
  haken: { pfade: ['M5 12l5 5 9-10'] },
  drehen: { pfade: ['M20 12a8 8 0 1 1-2.3-5.7', 'M20 4v5h-5'] },
  'mana-wuerfel': {
    pfade: ['M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z'],
    kreise: [
      [9, 9, 1.4, true],
      [12, 12, 1.4, true],
      [15, 15, 1.4, true],
    ],
  },
  boss: { pfade: ['M4 19h16', 'M5 19L3.5 8l5 4L12 5l3.5 7 5-4L19 19'] },
  welten: {
    pfade: ['M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'],
    kreise: [[12, 12, 9]],
  },
  untergang: {
    pfade: ['M7 16a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 9.4 3.5 3.5 0 0 1 17 16', 'M13 12l-2 4h3l-2 4'],
  },
  segen: {
    pfade: [
      'M12 2v2',
      'M12 20v2',
      'M4.9 4.9l1.4 1.4',
      'M17.7 17.7l1.4 1.4',
      'M2 12h2',
      'M20 12h2',
      'M4.9 19.1l1.4-1.4',
      'M17.7 6.3l1.4-1.4',
    ],
    kreise: [[12, 12, 4]],
  },
  basar: {
    pfade: [
      'M12 4v16',
      'M7 20h10',
      'M5 7h14',
      'M5 7l-3 7a3 3 0 0 0 6 0z',
      'M19 7l-3 7a3 3 0 0 0 6 0z',
    ],
  },
  effekte: {
    pfade: [
      'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
      'M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
    ],
  },
  spieler: {
    pfade: ['M3 20a6 6 0 0 1 12 0', 'M16 14.2a5 5 0 0 1 5 4.8'],
    kreise: [
      [9, 8, 3.5],
      [17, 9, 2.5],
    ],
  },
  start: { pfade: ['M3 11l9-8 9 8', 'M5 10v10h14V10'] },
  beenden: { pfade: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'] },
  info: { pfade: ['M12 11v6', 'M12 7.5v.5'], kreise: [[12, 12, 9]] },
} satisfies Record<string, Zeichnung>;

export type SymbolName = keyof typeof SYMBOLE;

@Component({
  selector: 'app-symbol',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.fill]="zeichnung().gefuellt ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (d of zeichnung().pfade; track $index) {
        <path [attr.d]="d" />
      }
      @for (k of zeichnung().kreise ?? []; track $index) {
        <circle
          [attr.cx]="k[0]"
          [attr.cy]="k[1]"
          [attr.r]="k[2]"
          [attr.fill]="k[3] ? 'currentColor' : 'none'"
        />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-grid;
      width: 1.4em;
      height: 1.4em;
      flex-shrink: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolBild {
  readonly name = input.required<SymbolName>();
  protected readonly zeichnung = computed<Zeichnung>(() => SYMBOLE[this.name()]);
}
