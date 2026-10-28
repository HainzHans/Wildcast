import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

/**
 * Knopf, der zweimal getippt werden muss. Am geteilten Spieltisch schützt das
 * vor versehentlichem Beenden oder Zerstören.
 */
@Component({
  selector: 'app-bestaetigen-knopf',
  template: `
    <button
      type="button"
      class="knopf"
      [class.scharf]="scharf()"
      [attr.aria-live]="'polite'"
      (click)="tippen()"
    >
      {{ scharf() ? frage() : label() }}
    </button>
  `,
  styles: `
    /* Für Gefährliches wie „Partie beenden“: breit und in Warnfarbe */
    :host(.gefahr) {
      display: grid;
    }
    :host(.gefahr) .knopf {
      min-height: 3.2rem;
      border-radius: 1rem;
      color: var(--negativ);
    }
    .scharf {
      background: var(--negativ);
      border-color: transparent;
      color: #fff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BestaetigenKnopf implements OnDestroy {
  readonly label = input.required<string>();
  readonly frage = input('Wirklich?');
  readonly bestaetigt = output<void>();

  protected readonly scharf = signal(false);
  private zeitgeber?: ReturnType<typeof setTimeout>;

  protected tippen(): void {
    clearTimeout(this.zeitgeber);
    if (this.scharf()) {
      this.scharf.set(false);
      this.bestaetigt.emit();
      return;
    }
    this.scharf.set(true);
    this.zeitgeber = setTimeout(() => this.scharf.set(false), 3000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.zeitgeber);
  }
}
