import { Variante, VarianteId, Werkzeug } from '../core/spiel/modell';

/**
 * Alle Spielvarianten. Eine neue Variante beschreibt hier, für wie viele Spieler sie gedacht ist
 * und welche Werkzeuge der Spieltisch einblendet.
 */
export const VARIANTEN: Variante[] = [
  {
    id: 'mana-wuerfel',
    name: 'Mana-Würfel',
    untertitel: 'Bezahle Mana, würfle einen Effekt – und hoffe auf das Beste.',
    spieler: { min: 2, max: 4, standard: 2 },
    startLeben: 40,
    regeln: [
      'Nur die Manamenge zählt, die Farbe ist egal.',
      'Effekte wirkst du jederzeit wie einen Spontanzauber. Sie gehen auf den Stapel, und Gegner können antworten – auch mit eigenen Effekten.',
      'Würfel 1 entscheidet die Art: positiv (65 %), negativ für dich (31,5 %) oder Chaos für alle (3,5 %).',
      'Würfel 2 entscheidet die Form: normal, verrückt, Kreatur oder Artefakt (als Spielstein), Verzauberung (zerstörbar) oder Emblem (bleibt für immer).',
      'Je mehr Mana, desto stärker der Effekt – in beide Richtungen.',
    ],
    werkzeuge: ['leben', 'effekt-wuerfel'],
    verfuegbar: true,
  },
  {
    id: 'boss',
    name: 'Bosskampf',
    untertitel: 'Zwei Spieler gegen einen Boss, der mit jeder Runde stärker wird.',
    spieler: { min: 2, max: 2, standard: 2 },
    startLeben: 40,
    regeln: [
      'Zehn Bosse von Level 1 bis 10, jeder mit eigenen Dienern, Fähigkeiten und Spezialangriff. Je höher das Level, desto mehr Leben und desto härter die Angriffe.',
      'Jeder Boss hat in jeder Partie eine andere Laune (z. B. jähzornig oder listig) und beherrscht nur einen Teil seiner Aktionen. Er spielt sich dadurch jedes Mal anders, bleibt aber gleich stark.',
      'Beim Einrichten wählt ihr den Boss-Verstand: Mit „Instinkt“ handelt er aus Stimmung und Laune, als „Taktiker“ oder „Gerissen“ rechnet er seine Züge zwei Runden voraus und wird deutlich gefährlicher.',
      'Ihr macht eure Züge, dann startet ihr den Boss-Zug. Danach beginnt die nächste Runde.',
      'Im Boss-Zug stellt der Boss bis zu zwei Fragen zur Lage am Tisch. Je nach Antwort und Verlauf entscheidet er, ob er angreift, aufräumt, Diener ruft oder sich heilt.',
      'Der Boss beschwört jede Runde einen neuen Diener, solange er weniger als sechs hat. Hat er höchstens einen, kommt ein weiterer dazu. Aktionen können zusätzliche Diener rufen.',
      'Seine Diener sind Spielsteine auf eurer Seite des Tischs und greifen jeden Boss-Zug an.',
      'Der Boss legt auch Artefakte und Verzauberungen, höchstens zwei gleichzeitig. Sie wirken in jedem Boss-Zug, bis ihr sie zerstört.',
      'Zerstören per Spruch: Alles, was ein Artefakt oder eine Verzauberung zerstört, ins Exil schickt oder auf die Hand zurückbringt, entfernt die Karte sofort („Zerstören“).',
      'Angreifen wie eine Belagerung: Jede Karte hat eine Verteidigung. Beim Deklarieren der Angreifer sagt ihr für jede Kreatur, ob sie den Boss oder eine seiner Karten angreift.',
      'Diener dürfen diese Angreifer wie gewohnt blocken. Ungeblockter Kampfschaden senkt die Verteidigung der Karte (mit „−“ eintragen) statt die Leben des Bosses. Überzähliger Schaden verfällt. Bei 0 ist die Karte zerstört.',
      'Sprüche, die Schaden an „jedes Ziel“ zufügen, dürfen auch eine Karte des Bosses treffen – wie einen Planeswalker oder eine Belagerung.',
      'Phasen bei 60 % und 30 % der Leben. An jeder Phasengrenze verfällt der restliche Schaden dieses Zugs (Phasen-Schild).',
      'In Phase 3 handelt der Boss zweimal pro Zug. Seinen Spezialangriff setzt er einmal pro Kampf ein und kündigt ihn eine Runde vorher an.',
      'Der Boss kennt euer Spielfeld nicht: Seine Aktionen nennen relative Ziele wie „die Kreatur mit der höchsten Stärke“. Fehlt ein Ziel, gibt es eine Ersatzstrafe.',
    ],
    werkzeuge: ['leben', 'boss'],
    verfuegbar: true,
  },
  {
    id: 'welten',
    name: 'Weltenwandel',
    untertitel: 'Alle paar Runden eine neue Welt – mit einer Regel, die für alle gilt.',
    spieler: { min: 2, max: 4, standard: 3 },
    startLeben: 40,
    regeln: [
      'Zu Beginn erscheint die erste Welt. Ihre Regel gilt für alle Spieler, bis die nächste Welt erscheint.',
      'Eine Runde ist vorbei, wenn jeder Spieler einmal dran war. Dann tippt ihr auf „Runde beenden“.',
      'Nach der beim Einrichten gewählten Rundenzahl verschwindet die alte Welt und eine neue erscheint. Die alte Regel endet sofort.',
      'Manche Welten lösen beim Erscheinen einmalig etwas aus. Lebensänderungen trägt die App selbst ein.',
      'Normale Welten ändern die Regeln ein wenig, Chaos-Welten bringen große Ausschläge, verrückte Welten seltsame Mechaniken. Ihr wählt eine Art oder alle gemischt.',
      'Keine Welt kommt zweimal, bevor nicht alle gewählten Welten dran waren.',
      '„Links“ ist der nächste Spieler in Zugreihenfolge.',
      'Im Bosskampf beendet der Boss-Zug die Runde. Die Welten gelten dort nur für die Spieler, nicht für den Boss.',
    ],
    werkzeuge: ['leben', 'welt'],
    verfuegbar: true,
  },
  {
    id: 'untergang',
    name: 'Untergang',
    untertitel: 'Ein Sturm zieht auf und trifft jede Runde härter – nur wer durchhält, gewinnt.',
    spieler: { min: 2, max: 4, standard: 3 },
    startLeben: 40,
    regeln: [
      'Eine Runde ist vorbei, wenn jeder Spieler einmal dran war. Dann tippt ihr auf „Runde beenden“.',
      'Ab der eingestellten Runde verliert zu Beginn jeder Runde jeder Spieler Leben durch den Sturm. Die App zieht sie selbst ab.',
      'Der Sturm wird stärker: sanft alle drei Runden um 1, normal alle zwei Runden, hart jede Runde.',
      'Alle drei Sturmrunden fällt ein Versorgungsabwurf. Wer die wenigsten Leben hat, wählt zuerst, dann der Nächste.',
      'Abwürfe wirken sofort, wenn sie gewählt werden. Leben und die Schutzkuppel trägt die App ein.',
      'Wer bei 0 Leben ist, ist raus. Der Letzte, der steht, gewinnt.',
    ],
    werkzeuge: ['leben', 'sturm'],
    verfuegbar: true,
  },
  {
    id: 'segen',
    name: 'Segen-Draft',
    untertitel: 'Vor dem ersten Zug wählt jeder geheim seine Segen – und gibt den Rest weiter.',
    spieler: { min: 2, max: 4, standard: 3 },
    startLeben: 40,
    regeln: [
      'Vor der Partie wird das Gerät herumgereicht. Jeder sieht ein Päckchen mit Segen, nimmt einen und gibt den Rest an den Spieler links weiter.',
      'Das geht so oft, bis jeder seine Segen hat. Der letzte Segen jedes Päckchens verfällt.',
      'Während des Drafts sieht nur der Wählende sein Päckchen. Danach liegen alle Segen offen.',
      'Segen gelten die ganze Partie. Einmalige Segen setzt du jederzeit ein, wenn du einen Spontanzauber wirken könntest, und hakst sie danach ab.',
      'Pakte sind stärker als normale Segen, haben aber einen Haken. Beim Einrichten lassen sie sich abschalten.',
      'Startleben aus Segen und Pakten trägt die App selbst ein.',
    ],
    werkzeuge: ['leben', 'segen'],
    verfuegbar: true,
  },
  {
    id: 'basar',
    name: 'Basar',
    untertitel: 'In der Mitte liegt ein Markt. Wer Mana übrig hat, kauft sich einen Vorteil.',
    spieler: { min: 2, max: 4, standard: 3 },
    startLeben: 40,
    regeln: [
      'Im Basar liegen Angebote mit einem Preis in beliebigem Mana.',
      'Einmal in jedem deiner Züge darfst du in deiner Hauptphase bei leerem Stapel ein Angebot kaufen. Es ist kein Zauberspruch und kann nicht neutralisiert werden.',
      'Ein gekauftes Angebot wirkt sofort und wird durch ein neues ersetzt.',
      'Eine Runde ist vorbei, wenn jeder Spieler einmal dran war. Dann tippt ihr auf „Runde beenden“: Das älteste Angebot verschwindet und ein neues kommt dazu.',
      'Je länger die Partie dauert, desto teurer und stärker werden die Angebote.',
      'Leben aus Angeboten trägt die App selbst ein.',
    ],
    werkzeuge: ['leben', 'basar'],
    verfuegbar: true,
  },
];

export function varianteMitId(id: string | undefined): Variante | undefined {
  return VARIANTEN.find((v) => v.id === id);
}

/** Eine oder mehrere Varianten, die gemeinsam in einer Partie laufen. */
export interface Kombination {
  ids: VarianteId[];
  varianten: Variante[];
  name: string;
  untertitel: string;
  spieler: Variante['spieler'];
  startLeben: number;
  werkzeuge: Werkzeug[];
}

/**
 * Legt Varianten zusammen: Die Spielerzahl muss für alle passen, Werkzeuge werden vereint.
 * Liefert `null`, wenn eine Variante fehlt, noch nicht spielbar ist oder die Spielerzahlen
 * sich nicht überschneiden.
 */
export function kombinieren(ids: readonly string[]): Kombination | null {
  const varianten = [...new Set(ids)].map(varianteMitId);
  if (!varianten.length || varianten.some((v) => !v?.verfuegbar)) return null;
  const liste = varianten as Variante[];

  const min = Math.max(...liste.map((v) => v.spieler.min));
  const max = Math.min(...liste.map((v) => v.spieler.max));
  if (min > max) return null;
  const standard = Math.min(Math.max(liste[0].spieler.standard, min), max);

  return {
    ids: liste.map((v) => v.id),
    varianten: liste,
    name: liste.map((v) => v.name).join(' + '),
    untertitel: liste.length === 1 ? liste[0].untertitel : 'Mehrere Varianten in einer Partie.',
    spieler: { min, max, standard },
    startLeben: Math.max(...liste.map((v) => v.startLeben)),
    werkzeuge: [...new Set(liste.flatMap((v) => v.werkzeuge))],
  };
}

/** Anzeigename für eine laufende Partie, z. B. „Mana-Würfel + Bosskampf“. */
export function variantenName(ids: readonly VarianteId[]): string {
  return ids.map((id) => varianteMitId(id)?.name ?? id).join(' + ');
}
