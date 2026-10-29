import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { Bewertungen } from './core/bewertung';
import { Einstellungen } from './core/einstellungen';
import { TabLeiste } from './shared/ui/tab-leiste';

/** Seiten mit Tab-Leiste; Einrichten und Spieltisch bekommen den ganzen Bildschirm. */
const MIT_TABS = ['/', '/varianten', '/einstellungen'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TabLeiste],
  template: `
    <main id="inhalt" tabindex="-1" [class.mit-tabs]="mitTabs()">
      <router-outlet />
    </main>
    @if (mitTabs()) {
      <app-tab-leiste />
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    main {
      min-height: 100dvh;
      outline: none;
    }
    /* Platz für die Tab-Leiste, damit nichts dahinter verschwindet */
    .mit-tabs {
      padding-bottom: calc(4.2rem + env(safe-area-inset-bottom));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Früh laden, damit das gewählte Farbschema schon beim Start greift.
  private readonly einstellungen = inject(Einstellungen);
  private readonly router = inject(Router);
  // Schickt Bewertungen nach, die offline am Tisch abgegeben wurden.
  private readonly bewertungen = inject(Bewertungen);

  protected readonly mitTabs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => MIT_TABS.includes(this.router.url.split(/[?#]/)[0])),
    ),
    { initialValue: false },
  );
}
