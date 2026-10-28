import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { SymbolBild } from './symbol';

/**
 * Kopfleiste wie in einer nativen App: klebt oben, reicht unter die Statusleiste und hat
 * links optional einen Zurück-Knopf. Rechts ist Platz für eigene Knöpfe.
 */
@Component({
  selector: 'app-seitenkopf',
  imports: [SymbolBild],
  template: `
    <header class="kopf" [class.gross]="gross()">
      <div class="leiste">
        @if (zurueck()) {
          <button type="button" class="zurueck" aria-label="Zurück" (click)="zurueckGehen()">
            <app-symbol name="zurueck" />
          </button>
        }
        <h1 class="titel">{{ titel() }}</h1>
        <div class="rechts"><ng-content /></div>
      </div>
      @if (untertitel()) {
        <p class="untertitel">{{ untertitel() }}</p>
      }
      @if (fortschritt() !== null) {
        <div class="fortschritt" role="progressbar" [attr.aria-valuenow]="fortschritt()! * 100">
          <span [style.width.%]="fortschritt()! * 100"></span>
        </div>
      }
    </header>
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .kopf {
      padding: max(0.5rem, env(safe-area-inset-top)) 1rem 0.6rem;
      background: color-mix(in srgb, var(--filz) 88%, transparent);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid color-mix(in srgb, var(--feld-rand) 50%, transparent);
    }
    .leiste {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      min-height: 2.75rem;
    }
    .zurueck {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      margin-left: -0.6rem;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--messing);
      font-size: 1.15rem;
    }
    .zurueck:active {
      background: var(--feld);
    }
    .titel {
      flex: 1;
      min-width: 0;
      font-size: 1.25rem;
      font-weight: 800;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .gross .titel {
      font-size: 2rem;
      letter-spacing: -0.01em;
    }
    .rechts {
      display: flex;
      gap: 0.25rem;
    }
    .rechts:empty {
      display: none;
    }
    .kopf:has(.fortschritt) {
      padding-bottom: 0;
    }
    .fortschritt {
      height: 3px;
      margin: 0.55rem -1rem 0;
      background: var(--filz-tief);
    }
    .fortschritt span {
      display: block;
      height: 100%;
      background: var(--messing);
      transition: width 250ms ease;
    }
    .untertitel {
      margin: 0.1rem 0 0;
      font-size: 0.85rem;
      color: var(--text-leise);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Seitenkopf {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly titel = input.required<string>();
  readonly untertitel = input('');
  /** Großer Titel wie auf den Hauptseiten einer App. */
  readonly gross = input(false);
  readonly zurueck = input(false);
  /** Fortschritt eines Ablaufs von 0 bis 1 als dünner Balken unten an der Leiste. */
  readonly fortschritt = input<number | null>(null);
  /** Wer eigenes Zurück-Verhalten braucht (z. B. im Einrichten-Ablauf), hört hierauf. */
  readonly zurueckGeklickt = output<void>();
  /** Ohne eigenen Listener geht es in der Historie zurück oder auf die Startseite. */
  readonly eigenesZurueck = input(false);

  protected zurueckGehen(): void {
    if (this.eigenesZurueck()) {
      this.zurueckGeklickt.emit();
      return;
    }
    // Angular nummeriert Navigationen im History-State; 1 heißt: Einstieg auf dieser Seite.
    const nr = (this.location.getState() as { navigationId?: number } | null)?.navigationId ?? 1;
    if (nr > 1) this.location.back();
    else void this.router.navigateByUrl('/');
  }
}
