-- Neue Formen: Kreatur und Artefakt (Effekte, die einen Spielstein erzeugen).
alter table public.effekte drop constraint effekte_form_check;
alter table public.effekte add constraint effekte_form_check
  check (form in ('normal', 'verrueckt', 'kreatur', 'artefakt', 'verzauberung', 'emblem'));

-- Bestehende Effekte, die einen Spielstein erzeugen, bekommen die passende Form.
update public.effekte set form = 'kreatur'
where name in (
  'Spontane Rekrutierung', 'Drache aus dem Nichts',
  'Wolfsrudel', 'Sturzflug', 'Drachenhort',
  'Kreaturen-Café', 'Gieriger Gremlin', 'Bibliotheksräuber', 'Würfelkobold', 'Dimensionsdieb'
);

update public.effekte set form = 'artefakt'
where name in ('Glücksautomat', 'Chrono-Kompass', 'Verfluchter Kompass');
