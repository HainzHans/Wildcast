import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { EFFEKT_POOL } from '../../varianten/mana-wuerfel/effekt-pool';
import { wuerfleEffekt } from '../../varianten/mana-wuerfel/wuerfel';
import { lesen, schreiben } from '../speicher';
import { ZUFALL } from '../zufall';
import { Effekt, Spielstand, VarianteId } from './modell';

const SCHLUESSEL = 'wildcast.spiel.v1';
const MAX_VERLAUF = 100;
/** So viele zuletzt gewürfelte Vorlagen werden möglichst nicht wiederholt. */
const KEINE_WIEDERHOLUNG = 8;

/**
 * Hält die laufende Partie auf diesem einen Gerät. Jede Änderung legt den vorherigen Stand
 * im Verlauf ab, damit am geteilten Tisch ein Danebentippen rückgängig gemacht werden kann.
 */
@Injectable({ providedIn: 'root' })
export class SpielStore {
  private readonly zufall = inject(ZUFALL);

  private readonly _stand = signal<Spielstand | null>(lesen<Spielstand>(SCHLUESSEL));
  private readonly verlauf = signal<Spielstand[]>([]);

  readonly stand = this._stand.asReadonly();
  readonly kannRueckgaengig = computed(() => this.verlauf().length > 0);

  constructor() {
    effect(() => schreiben(SCHLUESSEL, this._stand()));
  }

  starten(variante: VarianteId, namen: string[], startLeben: number): void {
    this.verlauf.set([]);
    this._stand.set({
      variante,
      gestartet: new Date().toISOString(),
      spieler: namen.map((name, i) => ({ id: i + 1, name, leben: startLeben })),
      effekte: [],
    });
  }

  beenden(): void {
    this.verlauf.set([]);
    this._stand.set(null);
  }

  aendereLeben(spielerId: number, um: number): void {
    this.aendern((s) => ({
      ...s,
      spieler: s.spieler.map((p) => (p.id === spielerId ? { ...p, leben: p.leben + um } : p)),
    }));
  }

  /** Würfelt einen Effekt für den zahlenden Spieler und legt ihn ins Protokoll. */
  wirken(spielerId: number, mana: number): Effekt | null {
    const s = this._stand();
    if (!s) return null;
    const zuletzt = s.effekte.slice(-KEINE_WIEDERHOLUNG).map((e) => e.vorlage);
    const effekt: Effekt = {
      ...wuerfleEffekt(EFFEKT_POOL, mana, this.zufall, zuletzt),
      nr: s.effekte.length + 1,
      spielerId,
      zeit: new Date().toISOString(),
    };
    this.aendern((alt) => ({ ...alt, effekte: [...alt.effekte, effekt] }));
    return effekt;
  }

  zerstoeren(nr: number): void {
    this.aendern((s) => ({
      ...s,
      effekte: s.effekte.map((e) => (e.nr === nr ? { ...e, zerstoert: true } : e)),
    }));
  }

  rueckgaengig(): void {
    const verlauf = this.verlauf();
    if (!verlauf.length) return;
    this._stand.set(verlauf[verlauf.length - 1]);
    this.verlauf.set(verlauf.slice(0, -1));
  }

  private aendern(neu: (s: Spielstand) => Spielstand): void {
    const s = this._stand();
    if (!s) return;
    this.verlauf.update((v) => [...v.slice(-(MAX_VERLAUF - 1)), s]);
    this._stand.set(neu(s));
  }
}
