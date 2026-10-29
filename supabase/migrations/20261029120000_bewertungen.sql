-- Bewertungen vom Spielende: Boss, Welten, Effekte, Segen … mit 1–5 Sternen und/oder Notiz.
-- Die App schreibt nur; gelesen wird im Supabase-Dashboard bzw. per SQL.

create table public.bewertungen (
  id uuid primary key default gen_random_uuid(),
  -- Alle Zeilen einer Partie teilen sich diese Kennung.
  partie uuid not null,
  art text not null check (art in ('partie', 'boss', 'welt', 'effekt', 'segen', 'angebot', 'abwurf')),
  -- Kennung des Bosses, der Welt, der Effekt-Vorlage …
  ref text not null check (char_length(ref) <= 200),
  name text not null check (char_length(name) <= 200),
  sterne smallint check (sterne between 1 and 5),
  notiz text check (char_length(notiz) <= 500),
  varianten text[] not null,
  spieler smallint check (spieler between 1 and 8),
  runden smallint,
  erstellt_am timestamptz not null default now(),
  check (sterne is not null or notiz is not null)
);

create index bewertungen_ref_idx on public.bewertungen (art, ref);

alter table public.bewertungen enable row level security;

-- Jeder darf Bewertungen abgeben, niemand darf sie über die API lesen oder ändern.
create policy "Bewertungen dürfen abgegeben werden"
  on public.bewertungen for insert
  to anon, authenticated
  with check (true);
