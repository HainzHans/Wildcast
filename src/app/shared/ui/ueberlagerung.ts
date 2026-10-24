import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
  afterNextRender,
} from '@angular/core';

/**
 * Vollbild-Ebene für Dialoge am Spieltisch. Sie öffnet sich zum auslösenden Spieler hin
 * gedreht und lässt sich umdrehen, damit die anderen mitlesen können.
 */
@Component({
  selector: 'app-ueberlagerung',
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
      <div class="leiste">
        <button type="button" class="symbol" (click)="gedrehtJetzt.set(!gedrehtJetzt())">
          <span aria-hidden="true">⟲</span> Drehen
        </button>
        <button type="button" class="symbol" (click)="schliessen.emit()">
          <span aria-hidden="true">✕</span> <span class="sr-only">Schließen</span>
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
      place-items: center;
      padding: 0.75rem;
    }
    .hintergrund {
      position: absolute;
      inset: 0;
      background: rgb(4 14 12 / 0.6);
      animation: einblenden 160ms ease-out;
    }
    .rahmen {
      position: relative;
      width: min(100%, 30rem);
      max-height: calc(100dvh - 1.5rem);
      display: grid;
      grid-template-rows: auto 1fr;
      background: var(--filz-tief);
      border-radius: var(--radius);
      box-shadow: var(--schatten);
      outline: none;
      animation: auftauchen 200ms ease-out;
      transition: transform 250ms ease;
    }
    .rahmen.gedreht {
      transform: rotate(180deg);
    }
    .leiste {
      display: flex;
      justify-content: space-between;
      padding: 0.4rem;
    }
    .symbol {
      min-height: 2.75rem;
      min-width: 2.75rem;
      padding: 0.4rem 0.8rem;
      border: 0;
      border-radius: var(--radius-klein);
      background: transparent;
      color: var(--text-leise);
      font-weight: 600;
    }
    .inhalt {
      overflow-y: auto;
      padding: 0 1rem 1rem;
    }
    @keyframes einblenden {
      from {
        opacity: 0;
      }
    }
    @keyframes auftauchen {
      from {
        opacity: 0;
        scale: 0.96;
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
