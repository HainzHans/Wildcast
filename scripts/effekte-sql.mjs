// Wandelt eine Seed-Datei aus supabase/effekte/ in ein INSERT für die Tabelle `effekte` um.
// Aufruf: node scripts/effekte-sql.mjs supabase/effekte/01-runde.json [quelle]
// Doppelte Effekte (gleicher Name, Art, Form, Manabereich) werden übersprungen.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const [datei, quelle = 'generiert'] = process.argv.slice(2);
if (!datei) {
  console.error('Aufruf: node scripts/effekte-sql.mjs <seed.json> [kuratiert|generiert]');
  process.exit(1);
}

const effekte = JSON.parse(readFileSync(datei, 'utf8'));
const charge = basename(datei, '.json');
const text = (s) => `'${String(s).replaceAll("'", "''")}'`;

const zeilen = effekte.map((e) =>
  [
    text(e.art),
    text(e.form),
    e.mana_min,
    e.mana_max ?? e.mana_min,
    text(e.name),
    text(e.spruch),
    text(e.text),
    text(quelle),
    text(charge),
  ].join(', '),
);

console.log(
  `insert into public.effekte (art, form, mana_min, mana_max, name, spruch, text, quelle, charge) values\n(` +
    zeilen.join('),\n(') +
    ')\non conflict (name, art, form, mana_min, mana_max) do nothing;',
);
