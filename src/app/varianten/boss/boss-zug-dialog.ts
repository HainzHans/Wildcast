import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { SpielStore } from '../../core/spiel/spiel-store';
import { SterneBewertung } from '../../shared/ui/sterne-bewertung';
import { Ueberlagerung } from '../../shared/ui/ueberlagerung';
import { Antworten, BossZug, Frage, Stimmung } from './boss-modell';
import { bossMitId } from './bosse';

export const STIMMUNG_NAME: Record<Stimmung, string> = {
  wuetend: 'Wütend',
  bedroht: 'Bedroht',
  ueberlegen: 'Überlegen',
  verzweifelt: 'Verzweifelt',
  lauernd: 'Lauernd',
};

/** Spannungspause, bevor der Boss seinen Zug enthüllt. */
const DENKZEIT = 1100;

/**
 * Der Boss-Zug als Gespräch: Der Boss stellt seine Fragen, denkt kurz nach und verkündet dann,
 * was er tut. Das Ergebnis wird sofort eingetragen.
 */
@Component({
  selector: 'app-boss-zug-dialog',
  imports: [Ueberlagerung, SterneBewertung],
  template: `
    <app-ueberlagerung [titel]="bossName() + ' ist am Zug'" (schliessen)="fertig.emit()">
      @switch (schritt()) {
        @case ('frage') {
          @if (aktuelleFrage(); as f) {
            <div class="frage">
              <p class="ueber">
                {{ bossName() }} fragt · {{ frageNr() + 1 }} von {{ fragen().length }}
              </p>
              <h2 class="frage-text">{{ f.text }}</h2>
              <div class="antworten" [class.viele]="f.antworten.length > 3">
                @for (a of f.antworten; track a.wert) {
                  <button type="button" class="antwort" (click)="antworten(f.id, a.wert)">
                    {{ a.label }}
                  </button>
                }
              </div>
            </div>
          }
        }
        @case ('denkt') {
          <div class="denkt" aria-live="polite">
            <div class="auge" aria-hidden="true"></div>
            <p>{{ bossName() }} überlegt …</p>
          </div>
        }
        @case ('ergebnis') {
          @if (zug(); as z) {
            <div class="ergebnis">
              <p class="stimmung" [attr.data-stimmung]="z.stimmung">
                {{ stimmungName(z.stimmung) }} · Phase {{ z.phase }}
              </p>
              <p class="boss-stimme">„{{ z.spruch }}“</p>

              @for (a of z.aktionen; track a.id) {
                <article class="aktion" [class.spezial]="a.id === spezialId()">
                  <h3>{{ a.name }}</h3>
                  <p>{{ a.text }}</p>
                </article>
              }

              @if (neuesRelikt(); as r) {
                <article class="aktion relikt">
                  <p class="relikt-typ">
                    Neu auf dem Feld · {{ r.typ === 'artefakt' ? 'Artefakt' : 'Verzauberung' }} ·
                    Verteidigung {{ r.verteidigung }}
                  </p>
                  <h3>{{ r.name }}</h3>
                  <p>{{ r.text }}</p>
                </article>
              }

              @if (z.merkmal; as m) {
                @if (m.texte.length || m.wirkungen.length) {
                  <article class="aktion merkmal">
                    <h3>{{ merkmalName() }}</h3>
                    @for (t of m.texte; track $index) {
                      <p>{{ t }}</p>
                    }
                    @for (t of m.wirkungen; track $index) {
                      <p class="wirkung">{{ t }}</p>
                    }
                  </article>
                }
              }

              @for (o of pakte(); track o.spielerId) {
                <article class="aktion pakt">
                  <p class="relikt-typ">Pakt für {{ o.spieler }}</p>
                  <h3>{{ o.name }}</h3>
                  <p>{{ o.text }} Dafür bekommt Azgaroth deine Seele.</p>
                  <div class="pakt-knoepfe">
                    <button
                      type="button"
                      class="knopf"
                      (click)="store.paktEntscheiden(o.spielerId, false)"
                    >
                      Ablehnen
                    </button>
                    <button
                      type="button"
                      class="knopf knopf--haupt"
                      (click)="store.paktEntscheiden(o.spielerId, true)"
                    >
                      Annehmen
                    </button>
                  </div>
                </article>
              }

              @if (z.ankuendigung) {
                <p class="warnung">⚠ {{ z.ankuendigung }}</p>
              }

              <ul class="folgen">
                @for (l of lebenText(); track $index) {
                  <li>{{ l }}</li>
                }
                @if (z.rundenEffekt) {
                  <li>{{ z.rundenEffekt }}</li>
                }
                @for (r of z.reliktEffekte; track $index) {
                  <li>{{ r }}</li>
                }
                @if (z.dienerOpfern) {
                  <li>
                    Der Boss opfert
                    {{
                      z.dienerOpfern === 1
                        ? 'seinen schwächsten Diener'
                        : 'seine ' + z.dienerOpfern + ' schwächsten Diener'
                    }}.
                  </li>
                }
                @if (z.dienerBonus.staerke || z.dienerBonus.widerstand) {
                  <li>
                    Alle Diener erhalten dauerhaft +{{ z.dienerBonus.staerke }}/+{{
                      z.dienerBonus.widerstand
                    }}.
                  </li>
                }
                @if (z.heilung) {
                  <li>Der Boss heilt sich um {{ z.heilung }}.</li>
                }
                @if (z.schutz) {
                  <li>Der Boss verhindert bis zu seinem nächsten Zug {{ z.schutz }} Schaden.</li>
                }
                @if (z.neueDiener.length) {
                  <li>Neue Diener: {{ dienerText() }}</li>
                }
                @if (angriffText(); as t) {
                  <li class="angriff">{{ t }}</li>
                }
              </ul>

              <app-sterne-bewertung
                art="boss"
                [ref]="bossId()"
                [name]="bossName()"
                [frage]="'Wie findet ihr ' + bossName() + '?'"
              />
              <button type="button" class="knopf knopf--haupt gross" (click)="fertig.emit()">
                Weiter – Runde {{ runde() }} beginnt
              </button>
            </div>
          }
        }
      }
    </app-ueberlagerung>
  `,
  styles: `
    .frage,
    .denkt,
    .ergebnis {
      display: grid;
      gap: 0.9rem;
    }
    .denkt {
      text-align: center;
      padding: 1rem 0;
    }
    .ueber {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    h2 {
      font-size: 1.8rem;
      font-weight: 800;
    }
    .gross {
      min-height: 3.5rem;
      font-size: 1.15rem;
    }
    .frage-text {
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1.2;
    }
    .boss-stimme {
      margin: 0;
      font-family: var(--schrift-anzeige);
      font-style: italic;
      font-size: 1.3rem;
      line-height: 1.3;
    }
    .antworten {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    .antwort {
      min-height: 3.5rem;
      border-radius: var(--radius-klein);
      border: 1px solid var(--feld-rand);
      background: var(--feld);
      font-size: 1.1rem;
      font-weight: 700;
    }
    .antwort:active {
      transform: scale(0.97);
    }
    .auge {
      justify-self: center;
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 50%;
      border: 0.45rem solid var(--negativ);
      border-top-color: transparent;
      animation: drehen 900ms linear infinite;
    }
    @keyframes drehen {
      to {
        transform: rotate(360deg);
      }
    }
    .stimmung {
      justify-self: start;
      margin: 0;
      padding: 0.2rem 0.7rem;
      border-radius: 99px;
      background: var(--negativ);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .stimmung[data-stimmung='lauernd'] {
      background: var(--feld-rand);
      color: var(--text);
    }
    .stimmung[data-stimmung='verzweifelt'] {
      background: var(--chaos);
    }
    .aktion {
      background: var(--feld);
      border-radius: var(--radius);
      border-left: 4px solid var(--negativ);
      padding: 0.8rem 1rem;
    }
    .aktion.relikt {
      border-left-color: var(--messing);
    }
    .aktion.merkmal {
      border-left-color: var(--himmel);
    }
    .aktion.merkmal p + p {
      margin-top: 0.3rem;
    }
    .aktion .wirkung {
      font-weight: 700;
    }
    .aktion.pakt {
      border-left-color: var(--chaos);
    }
    .pakt-knoepfe {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }
    .aktion .relikt-typ {
      margin-bottom: 0.2rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-leise);
    }
    .aktion.spezial {
      border-left-color: var(--chaos);
      box-shadow: 0 0 0 2px var(--chaos);
    }
    .aktion h3 {
      font-size: 1.2rem;
      font-weight: 800;
      margin-bottom: 0.3rem;
    }
    .aktion p {
      margin: 0;
    }
    .warnung {
      margin: 0;
      color: var(--negativ);
      font-weight: 700;
    }
    .folgen {
      margin: 0;
      padding-left: 1.2rem;
      display: grid;
      gap: 0.3rem;
      color: var(--text-leise);
    }
    .angriff {
      color: var(--text);
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BossZugDialog implements OnDestroy {
  protected readonly store = inject(SpielStore);
  readonly fertig = output<void>();

  private readonly boss = computed(() => this.store.stand()?.boss ?? null);
  private readonly def = computed(() => bossMitId(this.boss()?.bossId));
  protected readonly bossName = computed(() => this.def().name);
  protected readonly bossId = computed(() => this.def().id);
  protected readonly spezialId = computed(() => this.def().spezial.id);
  protected readonly runde = computed(() => this.boss()?.runde ?? 1);
  protected readonly merkmalName = computed(() => this.def().merkmal?.name ?? '');
  /** Offene Pakte des Dämonenfürsten – verschwinden, sobald jemand entschieden hat. */
  protected readonly pakte = computed(() => {
    const regel = this.def().merkmal;
    if (regel?.art !== 'pakte' || !this.zug()) return [];
    return (this.boss()?.merkmal?.offen ?? []).flatMap((o) => {
      const p = regel.pakte.find((x) => x.id === o.pakt);
      return p
        ? [{ spielerId: o.spielerId, spieler: this.namen().get(o.spielerId) ?? '', ...p }]
        : [];
    });
  });
  protected readonly neuesRelikt = computed(() => {
    const id = this.zug()?.neuesRelikt?.id;
    return this.def().relikte.find((r) => r.id === id) ?? null;
  });

  /** Einmal beim Öffnen festgelegt, damit sich die Fragen nicht mitten im Gespräch ändern. */
  protected readonly fragen = signal<Frage[]>(this.store.bossFragen());
  protected readonly schritt = signal<'frage' | 'denkt' | 'ergebnis'>('frage');
  protected readonly frageNr = signal(0);
  protected readonly aktuelleFrage = computed(() => this.fragen()[this.frageNr()] ?? null);
  private readonly gesammelt = signal<Antworten>({});
  protected readonly zug = signal<BossZug | null>(null);
  private zeitgeber?: ReturnType<typeof setTimeout>;

  private readonly namen = computed(
    () => new Map(this.store.stand()?.spieler.map((s) => [s.id, s.name]) ?? []),
  );

  /** Pro Spieler zusammengefasst – Aktionen und Runden-Effekt können denselben treffen. */
  protected readonly lebenText = computed(() => {
    const summe = new Map<number, number>();
    for (const l of this.zug()?.lebenAenderungen ?? []) {
      summe.set(l.spielerId, (summe.get(l.spielerId) ?? 0) + l.um);
    }
    return [...summe].map(
      ([id, um]) => `${this.namen().get(id)} verliert ${-um} Leben (schon eingetragen).`,
    );
  });

  /** Gleiche Diener zusammengefasst: „4× Skelettkrieger 2/2“. */
  protected readonly dienerText = computed(() => {
    const anzahl = new Map<string, number>();
    for (const d of this.zug()?.neueDiener ?? []) {
      const name = `${d.name} ${d.staerke}/${d.widerstand}`;
      anzahl.set(name, (anzahl.get(name) ?? 0) + 1);
    }
    return [...anzahl].map(([name, n]) => (n > 1 ? `${n}× ${name}` : name)).join(', ');
  });

  /** Aus dem Protokoll, weil erst beim Eintragen feststeht, wer angreifen durfte. */
  protected readonly angriffText = computed(() => {
    if (!this.zug()) return null;
    const eintrag = this.boss()?.protokoll.at(-1);
    if (!eintrag?.angreifer || !eintrag.angriffsziel) return 'Diesmal greifen keine Diener an.';
    const diener =
      eintrag.angreifer === 1 ? '1 Diener greift' : `${eintrag.angreifer} Diener greifen`;
    return `${diener} ${eintrag.angriffsziel} an. Wer angreift, wird getappt – außer mit Wachsamkeit.`;
  });

  constructor() {
    // Ohne Fragen legt der Boss sofort los.
    if (!this.fragen().length) this.ausfuehren();
  }

  protected stimmungName(s: Stimmung): string {
    return STIMMUNG_NAME[s];
  }

  protected antworten(frage: Frage['id'], wert: string): void {
    this.gesammelt.update((a) => ({ ...a, [frage]: wert }));
    if (this.frageNr() + 1 < this.fragen().length) this.frageNr.update((n) => n + 1);
    else this.ausfuehren();
  }

  private ausfuehren(): void {
    this.zug.set(this.store.bossZugAusfuehren(this.gesammelt()));
    this.schritt.set('denkt');
    this.zeitgeber = setTimeout(() => this.schritt.set('ergebnis'), DENKZEIT);
  }

  ngOnDestroy(): void {
    clearTimeout(this.zeitgeber);
  }
}
