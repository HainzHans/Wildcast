import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { rundenBisAbwurf, sturmSchaden, SturmStand } from './sturm';

/** Schmales Band am Spieltisch: was der Sturm diese Runde angerichtet hat und was noch kommt. */
@Component({
  selector: 'app-sturm-band',
  template: `
    <div class="band" [class.ruhig]="!info().aktiv" aria-live="polite">
      <span class="kopf">
        <span class="name">Sturm</span>
        <span class="abwurf">{{ info().abwurf }}</span>
      </span>
      <span class="text">{{ info().text }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex: 1 1 100%;
      min-width: 0;
    }
    .band {
      display: grid;
      gap: 0.15rem;
      padding: 0.45rem 0.8rem 0.5rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      border-left: 5px solid var(--negativ);
      background: var(--feld);
    }
    .band.ruhig {
      border-left-color: var(--feld-rand);
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
    .abwurf {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--messing);
      white-space: nowrap;
    }
    .text {
      font-size: 0.88rem;
      line-height: 1.3;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SturmBand {
  readonly stand = input.required<SturmStand>();
  readonly runde = input.required<number>();

  protected readonly info = computed(() => {
    const s = this.stand();
    const runde = this.runde();
    const jetzt = sturmSchaden(s, runde);
    const naechste = sturmSchaden(s, runde + 1);
    const bisAbwurf = rundenBisAbwurf(s, runde + 1) + 1;
    const geschuetzt = s.geschuetzt.length ? ' · Schutzkuppel aktiv' : '';
    if (!jetzt) {
      const bis = s.abRunde - runde;
      return {
        aktiv: false,
        text: `Noch ruhig. Der Sturm trifft ${bis === 1 ? 'ab der nächsten Runde' : `in ${bis} Runden`} mit −${naechste || 1} für alle.`,
        abwurf: '',
      };
    }
    return {
      aktiv: true,
      text: `Diese Runde: −${jetzt} für alle. Nächste Runde: −${naechste}.${geschuetzt}`,
      abwurf: bisAbwurf === 1 ? 'Abwurf nächste Runde' : `Abwurf in ${bisAbwurf} Runden`,
    };
  });
}
