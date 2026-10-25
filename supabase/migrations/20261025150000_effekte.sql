-- Effekt-Archiv für den Mana-Würfel.
-- Die App liest nur; geschrieben wird über Migrationen bzw. Seed-Dateien in supabase/effekte/.

create table public.effekte (
  id uuid primary key default gen_random_uuid(),
  art text not null check (art in ('positiv', 'negativ', 'chaos')),
  form text not null check (form in ('normal', 'verrueckt', 'verzauberung', 'emblem')),
  -- Kuratierte Vorlagen decken einen Bereich ab und skalieren über Platzhalter wie {m};
  -- generierte Effekte gelten für genau eine Manamenge (mana_min = mana_max).
  mana_min smallint not null check (mana_min >= 1),
  mana_max smallint not null check (mana_max >= mana_min),
  name text not null,
  spruch text not null,
  text text not null,
  quelle text not null default 'kuratiert' check (quelle in ('kuratiert', 'generiert', 'ki')),
  -- Herkunft, z. B. die Seed-Datei, aus der ein Effekt stammt.
  charge text,
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now(),
  unique (name, art, form, mana_min, mana_max)
);

create index effekte_suche_idx on public.effekte (art, form, mana_min, mana_max) where aktiv;

alter table public.effekte enable row level security;

-- Jeder darf aktive Effekte lesen, niemand darf über die API schreiben.
create policy "Aktive Effekte sind öffentlich lesbar"
  on public.effekte for select
  to anon, authenticated
  using (aktiv);
