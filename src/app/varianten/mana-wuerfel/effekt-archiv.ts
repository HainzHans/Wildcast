import { computed, Injectable, signal } from '@angular/core';

import { Art, Form } from '../../core/spiel/modell';
import { lesen, schreiben } from '../../core/speicher';
import { supabase } from '../../core/supabase';
import { EFFEKT_POOL } from './effekt-pool';
import { EffektVorlage } from './wuerfel';

const SCHLUESSEL = 'wildcast.archiv.v1';
/** PostgREST liefert höchstens so viele Zeilen pro Anfrage. */
const SEITE = 1000;

interface Zeile {
  id: string;
  art: Art;
  form: Form;
  mana_min: number;
  mana_max: number;
  name: string;
  spruch: string;
  text: string;
}

interface Zwischenspeicher {
  vorlagen: EffektVorlage[];
  zeit: string;
}

export type ArchivStatus = 'bereit' | 'laedt' | 'fehler';

/**
 * Das Effekt-Archiv aus Supabase. Es wird beim Start geladen und lokal zwischengespeichert,
 * damit am Spieltisch auch ohne Netz gewürfelt werden kann. Solange nichts geladen ist,
 * würfelt die App mit dem eingebauten Pool.
 */
@Injectable({ providedIn: 'root' })
export class EffektArchiv {
  private readonly gespeichert = lesen<Zwischenspeicher>(SCHLUESSEL);
  private readonly vorlagen = signal<EffektVorlage[]>(this.gespeichert?.vorlagen ?? []);

  readonly status = signal<ArchivStatus>('bereit');
  readonly aktualisiert = signal<string | null>(this.gespeichert?.zeit ?? null);
  readonly anzahl = computed(() => this.vorlagen().length);
  readonly pool = computed(() => (this.vorlagen().length ? this.vorlagen() : EFFEKT_POOL));

  async aktualisieren(): Promise<void> {
    if (this.status() === 'laedt') return;
    this.status.set('laedt');
    try {
      const db = await supabase();
      const zeilen: Zeile[] = [];
      for (let von = 0; ; von += SEITE) {
        const { data, error } = await db
          .from('effekte')
          .select('id, art, form, mana_min, mana_max, name, spruch, text')
          .order('id')
          .range(von, von + SEITE - 1);
        if (error) throw error;
        zeilen.push(...(data as Zeile[]));
        if (data.length < SEITE) break;
      }
      if (!zeilen.length) throw new Error('Archiv ist leer');

      const vorlagen = zeilen.map((z): EffektVorlage => ({
        id: z.id,
        art: z.art,
        form: z.form,
        mana: [z.mana_min, z.mana_max],
        name: z.name,
        spruch: z.spruch,
        text: z.text,
      }));
      const zeit = new Date().toISOString();
      this.vorlagen.set(vorlagen);
      this.aktualisiert.set(zeit);
      schreiben(SCHLUESSEL, { vorlagen, zeit } satisfies Zwischenspeicher);
      this.status.set('bereit');
    } catch {
      // Offline oder Supabase nicht erreichbar: weiter mit dem, was schon da ist.
      this.status.set('fehler');
    }
  }
}
