import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SymbolBild, SymbolName } from './symbol';

const TABS: { pfad: string; name: string; symbol: SymbolName }[] = [
  { pfad: '/', name: 'Spielen', symbol: 'spielen' },
  { pfad: '/varianten', name: 'Varianten', symbol: 'varianten' },
  { pfad: '/einstellungen', name: 'Einstellungen', symbol: 'einstellungen' },
];

/** Tab-Leiste am unteren Rand, wie in Apps aus dem Store. */
@Component({
  selector: 'app-tab-leiste',
  imports: [RouterLink, RouterLinkActive, SymbolBild],
  template: `
    <nav class="leiste" aria-label="Hauptnavigation">
      @for (t of tabs; track t.pfad) {
        <a
          class="tab"
          [routerLink]="t.pfad"
          routerLinkActive="aktiv"
          [routerLinkActiveOptions]="{ exact: true }"
          #rla="routerLinkActive"
          [attr.aria-current]="rla.isActive ? 'page' : null"
        >
          <span class="symbol"><app-symbol [name]="t.symbol" /></span>
          <span class="name">{{ t.name }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host {
      position: fixed;
      inset: auto 0 0;
      z-index: 6;
    }
    .leiste {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      padding: 0.35rem 0.5rem max(0.4rem, env(safe-area-inset-bottom));
      background: color-mix(in srgb, var(--filz-tief) 92%, transparent);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-top: 1px solid color-mix(in srgb, var(--feld-rand) 60%, transparent);
    }
    .tab {
      display: grid;
      justify-items: center;
      gap: 0.1rem;
      padding: 0.2rem 0;
      color: var(--text-leise);
      text-decoration: none;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .symbol {
      display: grid;
      place-items: center;
      width: 3.5rem;
      height: 1.9rem;
      border-radius: 99px;
      font-size: 1.05rem;
      transition: background 150ms;
    }
    .aktiv {
      color: var(--text);
    }
    .aktiv .symbol {
      background: color-mix(in srgb, var(--messing) 28%, transparent);
      color: var(--messing);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLeiste {
  protected readonly tabs = TABS;
}
