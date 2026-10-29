import { Injectable } from '@angular/core';

import { PLANERSTUFEN } from '../varianten/boss/boss-planer';
import { bossMitId } from '../varianten/boss/bosse';
import { angebotMitId } from '../varianten/basar/basar';
import { segenMitId } from '../varianten/segen/segen';
import { abwurfMitId } from '../varianten/untergang/sturm';
import { variantenName } from '../varianten/varianten';
import { weltMitId } from '../varianten/welten/welten';
import { lesen, schreiben } from './speicher';
import { Spielstand } from './spiel/modell';
import { supabase } from './supabase';

const SCHLUESSEL = 'wildcast.bewertungen.v1';
export const NOTIZ_MAX = 500;

export type BewertungsArt = 'partie' | 'boss' | 'welt' | 'effekt' | 'segen' | 'angebot' | 'abwurf';

/** Etwas aus der Partie, das sich am Ende bewerten lässt. */
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

export const GRUPPEN: { art: BewertungsArt; titel: string }[] = [
  { art: 'partie', titel: 'Die Partie' },
  { art: 'boss', titel: 'Boss' },
  { art: 'welt', titel: 'Welten' },
  { art: 'effekt', titel: 'Effekte' },
  { art: 'segen', titel: 'Segen' },
  { art: 'angebot', titel: 'Basar' },
  { art: 'abwurf', titel: 'Versorgungsabwürfe' },
];

function einmal<T extends { ref: string }>(liste: T[]): T[] {
  return liste.filter((x, i) => liste.findIndex((y) => y.ref === x.ref) === i);
}

/** Alles, was in dieser Partie vorkam und bewertet werden kann. Das normale Spiel hat nichts. */
export function bewertbares(s: Spielstand): Bewertbar[] {
  if (s.varianten.every((v) => v === 'normal')) return [];
  const liste: Bewertbar[] = [
    {
      art: 'partie',
      ref: [...s.varianten].sort().join('+'),
      name: variantenName(s.varianten),
      text: 'Wie hat euch die Partie insgesamt gefallen?',
    },
  ];
  if (s.boss) {
    const b = bossMitId(s.boss.bossId);
    liste.push({
      art: 'boss',
      ref: b.id,
      name: b.name,
      text: `Level ${b.level} · ${PLANERSTUFEN[s.boss.planer ?? 'instinkt'].name}${
        b.merkmal ? ` · ${b.merkmal.name}` : ''
      }`,
    });
  }
  for (const v of einmal((s.welt?.verlauf ?? []).map((v) => ({ ...v, ref: v.id })))) {
    const w = weltMitId(v.id);
    if (w) liste.push({ art: 'welt', ref: w.id, name: w.name, text: w.regel });
  }
  liste.push(
    ...einmal(
      s.effekte.map((e) => ({ art: 'effekt' as const, ref: e.vorlage, name: e.name, text: e.text })),
    ),
  );
  const segen = Object.values(s.segen?.gewaehlt ?? {}).flat();
  for (const id of new Set(segen)) {
    const x = segenMitId(id);
    if (x) liste.push({ art: 'segen', ref: x.id, name: x.name, text: x.text });
  }
  for (const id of new Set((s.basar?.gekauft ?? []).map((g) => g.id))) {
    const a = angebotMitId(id);
    if (a) liste.push({ art: 'angebot', ref: a.id, name: a.name, text: a.text });
  }
  for (const id of new Set(s.sturm?.gewaehlt ?? [])) {
    const a = abwurfMitId(id);
    if (a) liste.push({ art: 'abwurf', ref: a.id, name: a.name, text: a.text });
  }
  return liste;
}

/**
 * Bewertungen vom Spielende. Sie liegen zuerst auf dem Gerät und gehen nach Supabase, sobald
 * Netz da ist – nicht Gesendetes wird beim nächsten Start der App nachgeschickt.
 */
@Injectable({ providedIn: 'root' })
export class Bewertungen {
  constructor() {
    void this.nachsenden();
  }

  speichern(s: Spielstand, bewertungen: Bewertung[]): void {
    const benutzt = bewertungen
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
