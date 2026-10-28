import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';

import { SymbolBild } from './symbol';

/**
 * Bottom Sheet für Dialoge am Spieltisch: fährt von unten herein wie in einer nativen App.
 * Gedreht öffnet es sich von der anderen Tischseite, damit der Spieler gegenüber es lesen kann.
 */
@Component({
  selector: 'app-ueberlagerung',
  imports: [SymbolBild],
  host: { '[class.oben]': 'gedrehtJetzt()' },
  template: `
    <div class="hintergrund" (click)="schliessen.emit()"></div>
    <div
      #rahmen
      class="rahmen"
      [class.gedreht]="gedrehtJetzt()"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="titel()"
      tabindex="-1"
      (keydown.escape)="schliessen.emit()"
    >
      <div class="griff" aria-hidden="true"></div>
      <div class="leiste">
        <button
          type="button"
          class="symbol"
          aria-label="Zum anderen Spieler drehen"
          (click)="gedrehtJetzt.set(!gedrehtJetzt())"
        >
          <app-symbol name="drehen" />
        </button>
        <p class="titel">{{ titel() }}</p>
        <button type="button" class="symbol" aria-label="Schließen" (click)="schliessen.emit()">
          <app-symbol name="schliessen" />
        </button>
      </div>
      <div class="inhalt">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: grid;
      align-items: end;
      justify-items: center;
    }
    :host(.oben) {
      align-items: start;
    }
    .hintergrund {
      position: absolute;
      inset: 0;
      background: rgb(4 14 12 / 0.55);
      animation: einblenden 180ms ease-out;
    }
    .rahmen {
      position: relative;
      width: min(100%, 34rem);
      max-height: calc(100dvh - 2.5rem - env(safe-area-inset-top));
      display: grid;
      grid-template-rows: auto auto 1fr;
      padding-bottom: env(safe-area-inset-bottom);
      background: var(--filz-tief);
      border-radius: 1.4rem 1.4rem 0 0;
      box-shadow: 0 -0.5rem 2rem rgb(0 0 0 / 0.35);
      outline: none;
      animation: hochfahren 260ms cubic-bezier(0.2, 0.9, 0.3, 1);
    }
    .rahmen.gedreht {
      transform: rotate(180deg);
      animation-name: herunterfahren;
    }
    .griff {
      justify-self: center;
      width: 2.5rem;
      height: 0.3rem;
      margin-top: 0.5rem;
      border-radius: 99px;
      background: var(--feld-rand);
    }
    .leiste {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.4rem 0.3rem;
    }
    .titel {
      flex: 1;
      margin: 0;
      text-align: center;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-leise);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .symbol {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--text-leise);
      font-size: 1rem;
    }
    .symbol:active {
      background: var(--feld);
    }
    .inhalt {
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0 1rem 1.1rem;
    }
    @keyframes einblenden {
      from {
        opacity: 0;
      }
    }
    @keyframes hochfahren {
      from {
        transform: translateY(100%);
      }
    }
    @keyframes herunterfahren {
      from {
        transform: rotate(180deg) translateY(100%);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ueberlagerung {
  readonly titel = input.required<string>();
  readonly gedreht = input(false);
  readonly schliessen = output<void>();

  protected readonly gedrehtJetzt = linkedSignal(() => this.gedreht());
  private readonly rahmen = viewChild.required<ElementRef<HTMLElement>>('rahmen');

  constructor() {
    afterNextRender(() => this.rahmen().nativeElement.focus());
  }
}
