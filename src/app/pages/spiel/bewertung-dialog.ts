import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Bewertungen, NOTIZ_MAX, partieBewertbar } from '../../core/bewertung';
import { Spielstand } from '../../core/spiel/modell';
import { SymbolBild } from '../../shared/ui/symbol';

/**
 * Am Ende der Partie: die Spielvariante mit 1–5 Sternen und auf Wunsch einer Notiz bewerten.
 * Effekte, Segen … wurden schon unterwegs bewertet und gehen jetzt mit. Alles ist freiwillig.
 */
@Component({
  selector: 'app-bewertung-dialog',
  imports: [SymbolBild],
  template: `
    @if (partie(); as p) {
      <p class="einleitung">Wie hat euch die Partie gefallen?</p>
      <p class="name">{{ p.name }}</p>

      <div class="sterne" role="radiogroup" [attr.aria-label]="'Bewertung für ' + p.name">
        @for (n of fuenf; track n) {
          <button
            type="button"
            role="radio"
            class="stern"
            [class.an]="sterne() >= n"
            [attr.aria-checked]="sterne() === n"
            [attr.aria-label]="n + (n === 1 ? ' Stern' : ' Sterne')"
            (click)="sterne.set(sterne() === n ? 0 : n)"
          >
            <app-symbol [name]="sterne() >= n ? 'stern-voll' : 'stern'" />
          </button>
        }
      </div>

      <textarea
        rows="3"
        [attr.maxlength]="notizMax"
        placeholder="Optional: Was war gut, was nicht?"
        aria-label="Notiz zur Partie"
        [value]="notiz()"
        (input)="notiz.set($any($event.target).value)"
      ></textarea>

      @if (unterwegs()) {
        <p class="hinweis">
          Dazu {{ unterwegs() === 1 ? 'kommt 1 Bewertung' : 'kommen ' + unterwegs() + ' Bewertungen' }}
          aus der Partie.
        </p>
      }

      <div class="aktion">
        <button type="button" class="knopf knopf--haupt" (click)="beenden()">
          {{
            sterne() || notiz().trim() || unterwegs()
              ? 'Speichern und beenden'
              : 'Ohne Bewertung beenden'
          }}
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.8rem;
      justify-items: center;
      text-align: center;
    }
    p {
      margin: 0;
    }
    .einleitung,
    .hinweis {
      font-size: 0.92rem;
      color: var(--text-leise);
    }
    .name {
      font-family: var(--schrift-anzeige);
      font-size: 1.5rem;
      font-weight: 800;
    }
    .sterne {
      display: flex;
    }
    .stern {
      display: grid;
      place-items: center;
      width: 3.2rem;
      height: 3.2rem;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--feld-rand);
      font-size: 1.6rem;
      transition: transform 80ms;
    }
    .stern:active {
      transform: scale(0.88);
    }
    .stern.an {
      color: var(--messing);
    }
    textarea {
      width: 100%;
      min-height: 5rem;
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      color: var(--text);
      font: inherit;
      resize: vertical;
    }
    .aktion {
      width: 100%;
      display: grid;
    }
    .aktion .knopf {
      min-height: 3.4rem;
      border-radius: 1rem;
      font-size: 1.05rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BewertungDialog {
  private readonly bewertungen = inject(Bewertungen);

  readonly stand = input.required<Spielstand>();
  readonly fertig = output<void>();

  protected readonly fuenf = [1, 2, 3, 4, 5];
  protected readonly notizMax = NOTIZ_MAX;
  protected readonly sterne = signal(0);
  protected readonly notiz = signal('');

  protected readonly partie = computed(() => partieBewertbar(this.stand()));
  /** Sterne, die schon während der Partie vergeben wurden. */
  protected readonly unterwegs = computed(
    () => Object.keys(this.stand().bewertungen ?? {}).length,
  );

  protected beenden(): void {
    const p = this.partie();
    this.bewertungen.speichern(
      this.stand(),
      p ? { ...p, sterne: this.sterne() || undefined, notiz: this.notiz() } : undefined,
    );
    this.fertig.emit();
  }
}
