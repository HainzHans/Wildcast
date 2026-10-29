import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  Bewertbar,
  Bewertungen,
  bewertbares,
  GRUPPEN,
  NOTIZ_MAX,
} from '../../core/bewertung';
import { Spielstand } from '../../core/spiel/modell';
import { SymbolBild } from '../../shared/ui/symbol';

/** Was am Tisch eingetragen wurde, je „art:ref“. */
type Eingaben = Record<string, { sterne?: number; notiz?: string; notizOffen?: boolean }>;

const schluessel = (b: Bewertbar) => `${b.art}:${b.ref}`;

/**
 * Am Ende der Partie: Boss, Welten, Effekte … mit 1–5 Sternen und auf Wunsch einer Notiz
 * bewerten. Alles ist freiwillig; ohne Eingabe wird einfach beendet.
 */
@Component({
  selector: 'app-bewertung-dialog',
  imports: [SymbolBild],
  template: `
    <p class="einleitung">
      Was hat euch gefallen, was nicht? Alles ist freiwillig – tippt nur an, wozu ihr etwas sagen
      wollt.
    </p>

    @for (g of gruppen(); track g.art) {
      <section class="gruppe">
        <h3>{{ g.titel }}</h3>
        <ul class="liste">
          @for (b of g.punkte; track b.ref) {
            @let e = eingaben()[b.key];
            <li class="punkt">
              <p class="name">{{ b.name }}</p>
              @if (b.text) {
                <p class="text">{{ b.text }}</p>
              }
              <div class="zeile">
                <div class="sterne" role="radiogroup" [attr.aria-label]="'Bewertung für ' + b.name">
                  @for (n of fuenf; track n) {
                    <button
                      type="button"
                      role="radio"
                      class="stern"
                      [class.an]="(e?.sterne ?? 0) >= n"
                      [attr.aria-checked]="e?.sterne === n"
                      [attr.aria-label]="n + (n === 1 ? ' Stern' : ' Sterne')"
                      (click)="sterneSetzen(b.key, n)"
                    >
                      <app-symbol [name]="(e?.sterne ?? 0) >= n ? 'stern-voll' : 'stern'" />
                    </button>
                  }
                </div>
                <button
                  type="button"
                  class="notiz-knopf"
                  [class.an]="e?.notizOffen || e?.notiz"
                  [attr.aria-expanded]="!!e?.notizOffen"
                  [attr.aria-label]="'Notiz zu ' + b.name"
                  (click)="notizUmschalten(b.key)"
                >
                  <app-symbol name="notiz" />
                </button>
              </div>
              @if (e?.notizOffen) {
                <textarea
                  rows="2"
                  [attr.maxlength]="notizMax"
                  placeholder="Optional: was war gut, was nicht?"
                  [attr.aria-label]="'Notiz zu ' + b.name"
                  [value]="e?.notiz ?? ''"
                  (input)="notizSetzen(b.key, $any($event.target).value)"
                ></textarea>
              }
            </li>
          }
        </ul>
      </section>
    }

    <div class="aktion">
      <button type="button" class="knopf knopf--haupt" (click)="beenden()">
        {{ anzahl() ? 'Speichern und beenden' : 'Ohne Bewertung beenden' }}
      </button>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.1rem;
    }
    p {
      margin: 0;
    }
    .einleitung {
      font-size: 0.92rem;
      color: var(--text-leise);
      text-align: center;
    }
    h3 {
      margin: 0 0 0.45rem;
      font-family: var(--schrift-text);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .liste {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .punkt {
      display: grid;
      gap: 0.3rem;
      padding: 0.75rem 0.8rem 0.6rem 1rem;
      border-radius: 1rem;
      background: var(--feld);
    }
    .name {
      font-weight: 700;
    }
    .text {
      font-size: 0.84rem;
      line-height: 1.35;
      color: var(--text-leise);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .zeile {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .sterne {
      display: flex;
      margin-left: -0.45rem;
    }
    .stern,
    .notiz-knopf {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--feld-rand);
      font-size: 1.15rem;
      transition: transform 80ms;
    }
    .stern:active,
    .notiz-knopf:active {
      transform: scale(0.88);
    }
    .stern.an {
      color: var(--messing);
    }
    .notiz-knopf {
      color: var(--text-leise);
    }
    .notiz-knopf.an {
      color: var(--messing);
    }
    textarea {
      width: 100%;
      min-height: 4.5rem;
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--feld-rand);
      background: var(--filz-tief);
      color: var(--text);
      font: inherit;
      resize: vertical;
    }
    .aktion {
      position: sticky;
      bottom: 0;
      padding-top: 0.6rem;
      background: linear-gradient(transparent, var(--filz-tief) 35%);
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
  protected readonly eingaben = signal<Eingaben>({});

  private readonly punkte = computed(() =>
    bewertbares(this.stand()).map((b) => ({ ...b, key: schluessel(b) })),
  );
  protected readonly gruppen = computed(() =>
    GRUPPEN.map((g) => ({ ...g, punkte: this.punkte().filter((p) => p.art === g.art) })).filter(
      (g) => g.punkte.length,
    ),
  );
  /** Wie viele Punkte schon Sterne oder eine Notiz haben. */
  protected readonly anzahl = computed(
    () => Object.values(this.eingaben()).filter((e) => e.sterne || e.notiz?.trim()).length,
  );

  /** Denselben Stern nochmal antippen nimmt die Bewertung zurück. */
  protected sterneSetzen(key: string, n: number): void {
    this.eingaben.update((alle) => ({
      ...alle,
      [key]: { ...alle[key], sterne: alle[key]?.sterne === n ? undefined : n },
    }));
  }

  protected notizUmschalten(key: string): void {
    this.eingaben.update((alle) => ({
      ...alle,
      [key]: { ...alle[key], notizOffen: !alle[key]?.notizOffen },
    }));
  }

  protected notizSetzen(key: string, notiz: string): void {
    this.eingaben.update((alle) => ({ ...alle, [key]: { ...alle[key], notiz } }));
  }

  protected beenden(): void {
    const e = this.eingaben();
    this.bewertungen.speichern(
      this.stand(),
      this.punkte().map(({ key, ...b }) => ({ ...b, sterne: e[key]?.sterne, notiz: e[key]?.notiz })),
    );
    this.fertig.emit();
  }
}
