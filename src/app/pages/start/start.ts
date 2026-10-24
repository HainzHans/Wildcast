import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-start',
  template: `
    <section class="start">
      <h1>Wildcast</h1>
      <p>Das Projekt läuft. Hier geht's los.</p>
    </section>
  `,
  styles: `
    .start {
      min-height: 100dvh;
      display: grid;
      place-content: center;
      text-align: center;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Start {}
