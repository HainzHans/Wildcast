import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Welt } from './welten';

/** Schmales Band am Spieltisch: welche Welt gilt und wann die nächste kommt. Tippen öffnet sie. */
@Component({
  selector: 'app-welt-band',
  template: `
    <button type="button" class="band" [attr.data-art]="welt().art" (click)="oeffnen.emit()">
      <span class="kopf">
        <span class="name">{{ welt().name }}</span>
        <span class="wechsel">{{ hinweis() }}</span>
      </span>
      <span class="regel">{{ welt().regel }}</span>
    </button>
  `,
  styles: `
    :host {
      display: block;
      flex: 1 1 100%;
      min-width: 0;
    }
    .band {
      --farbe: var(--positiv);
      width: 100%;
      display: grid;
      gap: 0.15rem;
      padding: 0.45rem 0.8rem 0.5rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      border-left: 5px solid var(--farbe);
      background: var(--feld);
      color: var(--text);
      text-align: start;
      font: inherit;
    }
    .band[data-art='chaos'] {
      --farbe: var(--negativ);
    }
    .band[data-art='verrueckt'] {
      --farbe: var(--chaos);
    }
    .kopf {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.1rem 0.6rem;
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-size: 1.05rem;
      font-weight: 800;
    }
    .wechsel {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--messing);
      white-space: nowrap;
    }
    .regel {
      font-size: 0.88rem;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeltBand {
  readonly welt = input.required<Welt>();
  readonly hinweis = input.required<string>();
  readonly oeffnen = output<void>();
}
