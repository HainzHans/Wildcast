import { Directive, OnDestroy, output } from '@angular/core';

/** Gedrückt halten zählt weiter: erst nach dieser Pause, dann in diesem Takt. */
const HALTEN_START = 450;
const HALTEN_TAKT = 90;

/**
 * Für +/−-Knöpfe: Tippen löst einmal aus, Gedrückthalten löst im Takt weiter aus.
 * Maus und Finger laufen über pointerdown; die Tastatur (Enter/Leertaste) über click.
 */
@Directive({
  selector: '[appHalteKnopf]',
  host: {
    '(pointerdown)': 'druecken($event)',
    '(pointerup)': 'loslassen()',
    '(pointerleave)': 'loslassen()',
    '(pointercancel)': 'loslassen()',
    '(contextmenu)': '$event.preventDefault()',
    '(click)': 'tastatur($event)',
    style: 'user-select: none; -webkit-user-select: none; -webkit-touch-callout: none',
  },
})
export class HalteKnopf implements OnDestroy {
  readonly halte = output<void>();

  private start?: ReturnType<typeof setTimeout>;
  private takt?: ReturnType<typeof setInterval>;

  protected druecken(ereignis: PointerEvent): void {
    if (ereignis.button !== 0) return;
    this.loslassen();
    this.halte.emit();
    this.start = setTimeout(() => {
      this.takt = setInterval(() => this.halte.emit(), HALTEN_TAKT);
    }, HALTEN_START);
  }

  protected loslassen(): void {
    clearTimeout(this.start);
    clearInterval(this.takt);
  }

  protected tastatur(ereignis: MouseEvent): void {
    if (ereignis.detail === 0) this.halte.emit();
  }

  ngOnDestroy(): void {
    this.loslassen();
  }
}
