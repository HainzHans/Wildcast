import { ChangeDetectionStrategy, Component, computed, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Einstellungen } from '../../core/einstellungen';
import { SpielStore } from '../../core/spiel/spiel-store';
import { varianteMitId } from '../../varianten/varianten';

/** Hauptmenü im Stil eines Spiel-Titelbildschirms. */
@Component({
  selector: 'app-start',
  imports: [RouterLink],
  template: `
    <div class="titelbild">
      <header class="kopf">
        <h1>Wildcast</h1>
        <p>Chaos-Effekte &amp; Bosskämpfe für deinen Kartenspielabend</p>
      </header>

      <nav class="menue" aria-label="Hauptmenü" (keydown)="pfeiltasten($event)">
        <a class="punkt" [routerLink]="jetztSpielen().ziel">
          <span class="punkt-text">Jetzt spielen</span>
          <span class="punkt-hinweis">{{ jetztSpielen().hinweis }}</span>
        </a>
        <a class="punkt" routerLink="/varianten">
          <span class="punkt-text">Spielvarianten</span>
        </a>
        <a class="punkt" routerLink="/einstellungen">
          <span class="punkt-text">Einstellungen</span>
        </a>
      </nav>
    </div>
  `,
  styles: `
    .titelbild {
      min-height: 100dvh;
      display: grid;
      grid-template-rows: 1fr auto 1.3fr;
      justify-items: center;
      padding: 2rem 1rem;
      text-align: center;
      /* Lichtkegel über dem Spieltisch */
      background: radial-gradient(
        ellipse 70% 55% at 50% 38%,
        light-dark(#f1f5ef, #1d4a40) 0%,
        var(--filz) 60%,
        var(--filz-tief) 100%
      );
    }
    .kopf {
      align-self: end;
      margin-bottom: clamp(2.5rem, 9vh, 5rem);
    }
    h1 {
      font-size: clamp(3.5rem, min(19vw, 15vh), 8rem);
      font-weight: 900;
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      letter-spacing: -0.03em;
      line-height: 0.95;
      text-shadow: 0 0.06em 0 var(--filz-tief);
      animation: herabfallen 600ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
    }
    .kopf p {
      margin: 0.8rem 0 0;
      color: var(--text-leise);
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      animation: einblenden 500ms 250ms both;
    }
    .menue {
      display: grid;
      gap: 0.4rem;
      min-width: min(100%, 20rem);
    }
    .punkt {
      position: relative;
      display: grid;
      justify-items: center;
      padding: 0.7rem 2.5rem;
      border-radius: var(--radius);
      color: var(--text);
      text-decoration: none;
      outline: none;
      animation: einblenden 400ms both;
    }
    .punkt:nth-child(1) {
      animation-delay: 350ms;
    }
    .punkt:nth-child(2) {
      animation-delay: 430ms;
    }
    .punkt:nth-child(3) {
      animation-delay: 510ms;
    }
    .punkt-text {
      font-family: var(--schrift-anzeige);
      font-variation-settings:
        'SOFT' 100,
        'WONK' 1;
      font-size: clamp(1.6rem, 7vw, 2.1rem);
      font-weight: 700;
      transition:
        color 150ms,
        transform 150ms;
    }
    .punkt-hinweis {
      font-size: 0.8rem;
      color: var(--text-leise);
    }
    /* Auswahlmarken links und rechts wie in einem Spielmenü */
    .punkt::before,
    .punkt::after {
      content: '◆';
      position: absolute;
      top: 50%;
      color: var(--messing);
      font-size: 0.9rem;
      opacity: 0;
      transition:
        opacity 150ms,
        translate 150ms;
    }
    .punkt::before {
      left: 0.6rem;
      translate: -0.5rem -50%;
    }
    .punkt::after {
      right: 0.6rem;
      translate: 0.5rem -50%;
    }
    .punkt:hover .punkt-text,
    .punkt:focus-visible .punkt-text {
      color: var(--messing);
      transform: scale(1.06);
    }
    .punkt:hover::before,
    .punkt:hover::after,
    .punkt:focus-visible::before,
    .punkt:focus-visible::after {
      opacity: 1;
      translate: 0 -50%;
    }
    .punkt:active .punkt-text {
      transform: scale(0.97);
    }
    @keyframes herabfallen {
      from {
        opacity: 0;
        transform: translateY(-0.4em) scale(1.08);
      }
    }
    @keyframes einblenden {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Start {
  private readonly store = inject(SpielStore);
  private readonly einstellungen = inject(Einstellungen);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Läuft eine Partie, geht es dort weiter – sonst direkt zur zuletzt gespielten Variante. */
  protected readonly jetztSpielen = computed(() => {
    const s = this.store.stand();
    if (s) {
      return { ziel: '/spiel', hinweis: `Weiter: ${varianteMitId(s.variante)?.name ?? ''}` };
    }
    const v = varianteMitId(this.einstellungen.letzteVariante());
    const variante = v?.verfuegbar ? v : varianteMitId('mana-wuerfel')!;
    return { ziel: `/neu/${variante.id}`, hinweis: variante.name };
  });

  /** Pfeil hoch/runter wandert durchs Menü, wie man es von Spielen kennt. */
  protected pfeiltasten(ereignis: KeyboardEvent): void {
    if (ereignis.key !== 'ArrowDown' && ereignis.key !== 'ArrowUp') return;
    ereignis.preventDefault();
    const punkte = [...this.element.nativeElement.querySelectorAll<HTMLElement>('.punkt')];
    const jetzt = punkte.indexOf(document.activeElement as HTMLElement);
    const schritt = ereignis.key === 'ArrowDown' ? 1 : -1;
    punkte[(jetzt + schritt + punkte.length) % punkte.length]?.focus();
  }
}
