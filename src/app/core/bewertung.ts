import { Injectable } from '@angular/core';

import { variantenName } from '../varianten/varianten';
import { lesen, schreiben } from './speicher';
import { Spielstand } from './spiel/modell';
import { supabase } from './supabase';

const SCHLUESSEL = 'wildcast.bewertungen.v1';
export const NOTIZ_MAX = 500;

export type BewertungsArt = 'partie' | 'boss' | 'welt' | 'effekt' | 'segen' | 'angebot' | 'abwurf';

/** Etwas aus der Partie, das sich bewerten lässt. */
export interface Bewertbar {
  art: BewertungsArt;
  /** Kennung des Bosses, der Welt, der Effekt-Vorlage … */
  ref: string;
  name: string;
  text?: string;
}

export interface Bewertung extends Bewertbar {
  sterne?: number;
  notiz?: string;
}

/** Eine gespeicherte Partie-Bewertung; `gesendet` wird true, sobald Supabase sie hat. */
interface Eintrag {
  partie: string;
  zeit: string;
  varianten: string[];
  spieler: number;
  runden: number | null;
  bewertungen: Bewertung[];
  gesendet: boolean;
}

export const bewertungsSchluessel = (art: BewertungsArt, ref: string) => `${art}:${ref}`;

/** Am Ende wird nur noch die Spielvariante selbst bewertet. Das normale Spiel fragt nicht. */
export function partieBewertbar(s: Spielstand): Bewertbar | null {
  if (s.varianten.every((v) => v === 'normal')) return null;
  return {
    art: 'partie',
    ref: [...s.varianten].sort().join('+'),
    name: variantenName(s.varianten),
    text: 'Wie hat euch die Partie insgesamt gefallen?',
  };
}

/**
 * Bewertungen einer Partie: die Sterne, die unterwegs für Effekte, Segen … vergeben wurden, plus
 * die Bewertung der Spielvariante am Ende. Sie liegen zuerst auf dem Gerät und gehen nach Supabase, sobald
 * Netz da ist – nicht Gesendetes wird beim nächsten Start der App nachgeschickt.
 */
@Injectable({ providedIn: 'root' })
export class Bewertungen {
  constructor() {
    void this.nachsenden();
  }

  speichern(s: Spielstand, partie?: Bewertung): void {
    const benutzt = [...Object.values(s.bewertungen ?? {}), ...(partie ? [partie] : [])]
      .map((b) => ({ ...b, notiz: b.notiz?.trim().slice(0, NOTIZ_MAX) || undefined }))
      .filter((b) => b.sterne || b.notiz);
    if (!benutzt.length) return;
    const eintrag: Eintrag = {
      partie: crypto.randomUUID(),
      zeit: new Date().toISOString(),
      varianten: s.varianten,
      spieler: s.spieler.length,
      runden: s.boss?.runde ?? s.runde ?? null,
      bewertungen: benutzt,
      gesendet: false,
    };
    schreiben(SCHLUESSEL, [...this.alle(), eintrag]);
    void this.nachsenden();
  }

  private alle(): Eintrag[] {
    return lesen<Eintrag[]>(SCHLUESSEL) ?? [];
  }

  private async nachsenden(): Promise<void> {
    const offen = this.alle().filter((e) => !e.gesendet);
    if (!offen.length) return;
    try {
      const db = await supabase();
      for (const e of offen) {
        const { error } = await db.from('bewertungen').insert(
          e.bewertungen.map((b) => ({
            partie: e.partie,
            art: b.art,
            ref: b.ref,
            name: b.name,
            sterne: b.sterne ?? null,
            notiz: b.notiz ?? null,
            varianten: e.varianten,
            spieler: e.spieler,
            runden: e.runden,
            erstellt_am: e.zeit,
          })),
        );
        if (error) return;
        schreiben(
          SCHLUESSEL,
          this.alle().map((x) => (x.partie === e.partie ? { ...x, gesendet: true } : x)),
        );
      }
    } catch {
      // Offline: beim nächsten Mal.
    }
  }
}
