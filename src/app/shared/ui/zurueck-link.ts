import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Zurück dorthin, wo man herkam (Menü oder Variantenliste).
 * Wer direkt auf der Seite gelandet ist, kommt ins Hauptmenü.
 */
@Component({
  selector: 'app-zurueck-link',
  template: `<button type="button" class="zurueck" (click)="zurueck()">← Zurück</button>`,
  styles: `
    .zurueck {
      border: 0;
      background: none;
      color: var(--text-leise);
      font-weight: 600;
      padding: 0.6rem 0;
      min-height: var(--tippflaeche);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZurueckLink {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected zurueck(): void {
    // Angular nummeriert Navigationen im History-State; 1 heißt: Einstieg auf dieser Seite.
    const nr = (this.location.getState() as { navigationId?: number } | null)?.navigationId ?? 1;
    if (nr > 1) this.location.back();
    else void this.router.navigateByUrl('/');
  }
}
