import { BOSSE } from '../../src/app/varianten/boss/bosse';
// Prüft, ob die Zahlen im Aktionstext zu den hinterlegten Folgen passen.
for (const b of BOSSE)
  for (const a of [...b.aktionen, b.spezial]) {
    const f = a.folgen;
    if (f?.leben && !a.text.includes(`${-f.leben.um} Leben`))
      console.log(`L${b.level} ${a.id}: Leben ${f.leben.um} – ${a.text}`);
    if (f?.heilung && !a.text.includes(`${f.heilung} Leben`))
      console.log(`L${b.level} ${a.id}: Heilung ${f.heilung} – ${a.text}`);
    if (f?.schutz && !a.text.includes(`${f.schutz} Schaden`))
      console.log(`L${b.level} ${a.id}: Schutz ${f.schutz} – ${a.text}`);
  }
console.log('fertig');
