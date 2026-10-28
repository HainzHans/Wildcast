/** Normal: kleine, faire Regeländerungen. Chaos: große Ausschläge. Verrückt: seltsame Mechaniken. */
export type WeltArt = 'normal' | 'chaos' | 'verrueckt';

/** Was beim Einrichten gewählt wird: eine Art oder alle gemischt. */
export type WeltAuswahl = WeltArt | 'alle';

/**
 * Lebensänderung beim Erscheinen, die die App selbst einträgt: eine feste Zahl für jeden,
 * alle auf den Durchschnitt, oder die Lebenspunkte wandern einen Platz nach links.
 */
export type WeltLeben = number | 'durchschnitt' | 'weiterreichen';

export interface Welt {
  id: string;
  name: string;
  art: WeltArt;
  /** Ein Satz Stimmung, kursiv über der Regel. */
  stimmung: string;
  /** Gilt für alle, bis die nächste Welt erscheint. */
  regel: string;
  /** Passiert einmal, sobald die Welt erscheint. */
  erscheinen?: { text: string; leben?: WeltLeben };
  /** Nur mit mindestens so vielen Spielern sinnvoll. */
  abSpielern?: number;
}

export const WELT_ARTEN: Record<WeltAuswahl, { name: string; text: string }> = {
  normal: {
    name: 'Normal',
    text: 'Kleine, faire Regeländerungen, die jede Partie etwas anders machen.',
  },
  chaos: { name: 'Chaos', text: 'Große Ausschläge: Schaden, Mana und Kreaturen für alle.' },
  verrueckt: { name: 'Verrückt', text: 'Seltsame Regeln: Tauschen, Umdrehen, offene Hände.' },
  alle: { name: 'Alle', text: 'Normale, chaotische und verrückte Welten gemischt.' },
};

export const WELTEN: Welt[] = [
  // ── Normal ───────────────────────────────────────────────────────
  {
    id: 'blutmond',
    name: 'Blutmond',
    art: 'normal',
    stimmung: 'Der rote Mond weckt die Kampfeslust.',
    regel: 'Alle Kreaturen erhalten +1/+0.',
  },
  {
    id: 'rastlose-winde',
    name: 'Rastlose Winde',
    art: 'normal',
    stimmung: 'Niemand bleibt hier lange stehen.',
    regel: 'Alle Kreaturen haben Eile.',
  },
  {
    id: 'steinwacht',
    name: 'Steinwacht',
    art: 'normal',
    stimmung: 'Die Erde selbst stellt sich schützend vor ihre Kinder.',
    regel: 'Alle Kreaturen erhalten +0/+2.',
  },
  {
    id: 'aetherflut',
    name: 'Ätherflut',
    art: 'normal',
    stimmung: 'Die Luft knistert vor roher Magie.',
    regel: 'Spontanzauber und Hexereien kosten {1} weniger.',
  },
  {
    id: 'schmiedefeuer',
    name: 'Schmiedefeuer',
    art: 'normal',
    stimmung: 'In jeder Gasse glüht eine Esse.',
    regel: 'Artefakt- und Verzauberungszauber kosten {1} weniger.',
  },
  {
    id: 'fruchtbare-auen',
    name: 'Fruchtbare Auen',
    art: 'normal',
    stimmung: 'Wo du hintrittst, sprießt neues Land.',
    regel: 'Jeder Spieler darf in jedem seiner Züge ein zusätzliches Land spielen.',
  },
  {
    id: 'manaquellen',
    name: 'Manaquellen',
    art: 'normal',
    stimmung: 'Unter dem Boden pulsiert eine uralte Kraft.',
    regel: 'Zu Beginn der ersten Hauptphase seines Zugs erhält jeder Spieler {C}.',
  },
  {
    id: 'gelehrtenturm',
    name: 'Gelehrtenturm',
    art: 'normal',
    stimmung: 'Zehntausend Bücher, und keins davon ist langweilig.',
    regel:
      'Im Ziehsegment zieht jeder Spieler eine zusätzliche Karte und wirft danach eine Karte ab.',
  },
  {
    id: 'ewiger-fruehling',
    name: 'Ewiger Frühling',
    art: 'normal',
    stimmung: 'Hier heilt jede Wunde ein bisschen schneller.',
    regel: 'Zu Beginn seines Zugs erhält jeder Spieler 2 Leben.',
  },
  {
    id: 'aschefeld',
    name: 'Aschefeld',
    art: 'normal',
    stimmung: 'Die Luft brennt in den Lungen.',
    regel: 'Zu Beginn seines Zugs verliert jeder Spieler 1 Leben.',
    erscheinen: { text: 'Jeder Spieler erhält 5 Leben.', leben: 5 },
  },
  {
    id: 'thron-der-helden',
    name: 'Thron der Helden',
    art: 'normal',
    stimmung: 'Die Helden kehren schneller zurück, als ihre Feinde lieb ist.',
    regel: 'Die Kommandeurssteuer beträgt nur {1} für jedes frühere Wirken aus der Kommandozone.',
  },
  {
    id: 'ehrenkodex',
    name: 'Ehrenkodex',
    art: 'normal',
    stimmung: 'Wer zuerst zuschlägt, wird besungen.',
    regel: 'Angreifende Kreaturen erhalten +1/+1.',
  },
  {
    id: 'nebelmoor',
    name: 'Nebelmoor',
    art: 'normal',
    stimmung: 'Im Nebel stolpern die Großen über ihre eigenen Füße.',
    regel: 'Kreaturen mit Stärke 4 oder mehr können nicht blocken.',
  },
  {
    id: 'stille-graeber',
    name: 'Stille Gräber',
    art: 'normal',
    stimmung: 'Jeder Abschied hinterlässt ein wenig Wärme.',
    regel: 'Immer wenn eine Kreatur stirbt, erhält ihr Besitzer 1 Leben.',
  },
  {
    id: 'klarer-himmel',
    name: 'Klarer Himmel',
    art: 'normal',
    stimmung: 'Unter diesem Himmel lässt sich nichts verbergen.',
    regel:
      'Jeder Spieler spielt mit der obersten Karte seiner Bibliothek offen und darf Länder von dort spielen.',
  },

  // ── Chaos ────────────────────────────────────────────────────────
  {
    id: 'weltenbrand',
    name: 'Weltenbrand',
    art: 'chaos',
    stimmung: 'Der Himmel steht in Flammen.',
    regel: 'Zu Beginn seines Zugs fügt jeder Spieler jedem Gegner 1 Schaden zu.',
    erscheinen: { text: 'Weltenbrand fügt jeder Kreatur 3 Schaden zu.' },
  },
  {
    id: 'manasturm',
    name: 'Manasturm',
    art: 'chaos',
    stimmung: 'Die Länder geben mehr, als sie sollten.',
    regel:
      'Immer wenn ein Spieler ein Land für Mana tappt, erhält er ein zusätzliches Mana derselben Art.',
  },
  {
    id: 'wilde-magie',
    name: 'Wilde Magie',
    art: 'chaos',
    stimmung: 'Magie ist billig hier – aber sie beißt.',
    regel:
      'Zaubersprüche kosten {2} weniger. Immer wenn ein Spieler einen Zauberspruch wirkt, verliert er 1 Leben.',
  },
  {
    id: 'launisches-schicksal',
    name: 'Launisches Schicksal',
    art: 'chaos',
    stimmung: 'Die Götter werfen Münzen.',
    regel:
      'Immer wenn ein Spieler einen Zauberspruch wirkt, wirft er eine Münze. Kopf: Er kopiert den Zauberspruch. Zahl: Er verliert 2 Leben.',
  },
  {
    id: 'blutrausch',
    name: 'Blutrausch',
    art: 'chaos',
    stimmung: 'Keine Gnade, kein Zögern, kein Zurück.',
    regel:
      'Alle Kreaturen erhalten +2/+0 und Trampelschaden und greifen in jedem Kampf an, falls möglich.',
  },
  {
    id: 'vampirnacht',
    name: 'Vampirnacht',
    art: 'chaos',
    stimmung: 'Jeder Biss ist tödlich, und jeder Biss nährt.',
    regel: 'Alle Kreaturen haben Lebensverknüpfung und Todesberührung.',
  },
  {
    id: 'totentanz',
    name: 'Totentanz',
    art: 'chaos',
    stimmung: 'Die Toten wollen einfach nicht liegen bleiben.',
    regel:
      'Immer wenn eine Kreatur, die kein Spielstein ist, stirbt, erzeugt ihr Besitzer einen 2/2 schwarzen Zombie-Kreaturenspielstein.',
  },
  {
    id: 'drachenhimmel',
    name: 'Drachenhimmel',
    art: 'chaos',
    stimmung: 'Der Himmel verdunkelt sich unter tausend Schwingen.',
    regel: 'Kreaturen mit Flugfähigkeit erhalten +1/+0.',
    erscheinen: {
      text: 'Jeder Spieler erzeugt einen 4/4 roten Drachen-Kreaturenspielstein mit Flugfähigkeit.',
    },
  },
  {
    id: 'bebende-lande',
    name: 'Bebende Lande',
    art: 'chaos',
    stimmung: 'Nur wer fliegt, steht noch sicher.',
    regel: 'Kreaturen ohne Flugfähigkeit erhalten −1/−0.',
    erscheinen: {
      text: 'Jede Kreatur ohne Flugfähigkeit erhält 2 Schaden. Jeder Spieler verliert 2 Leben.',
      leben: -2,
    },
  },
  {
    id: 'feuersbrunst',
    name: 'Feuersbrunst',
    art: 'chaos',
    stimmung: 'Große Magie entzündet alles um sich herum.',
    regel:
      'Immer wenn ein Spieler einen Zauberspruch mit Manawert 5 oder mehr wirkt, fügt er jeder anderen Kreatur und jedem Gegner 2 Schaden zu.',
  },
  {
    id: 'aufruhr',
    name: 'Aufruhr',
    art: 'chaos',
    stimmung: 'Das Volk erhebt sich gegen die Mächtigen.',
    regel:
      'Der Spieler mit den meisten Leben kann keine Leben erhalten. Kreaturen, die ihn angreifen, erhalten +1/+0.',
  },
  {
    id: 'ausgehungert',
    name: 'Ausgehungert',
    art: 'chaos',
    stimmung: 'Die Vorräte sind aufgebraucht.',
    regel:
      'Zu Beginn seines Versorgungssegments opfert jeder Spieler eine Kreatur oder verliert 3 Leben.',
  },
  {
    id: 'sturmflut',
    name: 'Sturmflut',
    art: 'chaos',
    stimmung: 'Die Welle reißt alle Pläne mit sich.',
    regel:
      'Jeder Spieler zieht im Ziehsegment eine zusätzliche Karte. Am Ende seines Zugs wirft er bis auf drei Handkarten ab.',
    erscheinen: {
      text: 'Jeder Spieler mischt seine Hand in seine Bibliothek und zieht ebenso viele Karten.',
    },
  },
  {
    id: 'schicksalswuerfel',
    name: 'Schicksalswürfel',
    art: 'chaos',
    stimmung: 'Jeder Zug endet mit einem Wurf ins Ungewisse.',
    regel:
      'Am Ende seines Zugs wirft jeder Spieler einen W6. Bei 1 verliert er 3 Leben, bei 6 zieht er zwei Karten.',
  },

  // ── Verrückt ─────────────────────────────────────────────────────
  {
    id: 'spiegelwelt',
    name: 'Spiegelwelt',
    art: 'verrueckt',
    stimmung: 'Du blickst in den Spiegel – und jemand anderes blickt zurück.',
    regel: 'Kein Spieler kann in einem Zug mehr als 5 Leben erhalten.',
    erscheinen: {
      text: 'Die Lebenspunkte wandern einen Platz nach links: Jeder übernimmt die Lebenspunkte des Spielers zu seiner Rechten.',
      leben: 'weiterreichen',
    },
  },
  {
    id: 'waage-der-goetter',
    name: 'Waage der Götter',
    art: 'verrueckt',
    stimmung: 'Die Götter dulden keine Ungleichheit.',
    regel: 'Immer wenn ein Spieler Leben erhält, erhält jeder andere Spieler 1 Leben.',
    erscheinen: {
      text: 'Alle Lebenspunkte werden auf den Durchschnitt gesetzt (aufgerundet).',
      leben: 'durchschnitt',
    },
  },
  {
    id: 'kopfstand',
    name: 'Kopfstand',
    art: 'verrueckt',
    stimmung: 'Oben ist unten, und Mauern schlagen zurück.',
    regel: 'Jede Kreatur fügt Kampfschaden in Höhe ihrer Widerstandskraft statt ihrer Stärke zu.',
  },
  {
    id: 'winzlingsreich',
    name: 'Winzlingsreich',
    art: 'verrueckt',
    stimmung: 'Hier ist jeder gleich klein.',
    regel: 'Alle Kreaturen haben die Grundwerte 2/2. Marken und Effekte wirken weiter.',
  },
  {
    id: 'riesenland',
    name: 'Riesenland',
    art: 'verrueckt',
    stimmung: 'Die Kleinsten wachsen hier über sich hinaus.',
    regel: 'Kreaturen mit Manawert 2 oder weniger erhalten +2/+2.',
  },
  {
    id: 'belebte-welt',
    name: 'Belebte Welt',
    art: 'verrueckt',
    stimmung: 'Selbst die Werkzeuge haben genug vom Stillstehen.',
    regel:
      'Jedes Artefakt, das weder Kreatur noch Ausrüstung ist, ist zusätzlich eine 2/2-Artefaktkreatur.',
  },
  {
    id: 'glaeserne-welt',
    name: 'Gläserne Welt',
    art: 'verrueckt',
    stimmung: 'Hier gibt es keine Geheimnisse.',
    regel: 'Alle Spieler spielen mit offener Hand.',
  },
  {
    id: 'tauschboerse',
    name: 'Tauschbörse',
    art: 'verrueckt',
    stimmung: 'Alles ist verhandelbar, nichts bleibt, wo es ist.',
    regel:
      'Am Ende seines Zugs gibt jeder Spieler eine Karte aus seiner Hand an den Spieler links.',
    erscheinen: { text: 'Jeder Spieler gibt eine Karte aus seiner Hand an den Spieler links.' },
  },
  {
    id: 'wandernde-seelen',
    name: 'Wandernde Seelen',
    art: 'verrueckt',
    stimmung: 'Die Toten suchen sich einen neuen Herrn.',
    regel:
      'Stirbt eine Kreatur, die kein Spielstein ist, bringt der Spieler links von ihrem Besitzer sie unter seiner Kontrolle zurück ins Spiel. Verlässt sie das Spielfeld erneut, kommt sie ins Exil.',
  },
  {
    id: 'friedhofsmarkt',
    name: 'Friedhofsmarkt',
    art: 'verrueckt',
    stimmung: 'Gebraucht, aber gut erhalten.',
    regel:
      'Jeder Spieler darf Kreaturenkarten aus seinem Friedhof wirken. Sie kosten {2} mehr und kommen ins Exil, wenn sie das Spielfeld verlassen.',
  },
  {
    id: 'zaehe-zeit',
    name: 'Zähe Zeit',
    art: 'verrueckt',
    stimmung: 'Jeder Augenblick dehnt sich wie Honig.',
    regel:
      'Jeder Spieler kann pro Zug höchstens einen Zauberspruch wirken, aber jeder Zauberspruch kostet {2} weniger.',
  },
  {
    id: 'kroenung',
    name: 'Krönung',
    art: 'verrueckt',
    stimmung: 'Der Schwächste trägt plötzlich die Krone.',
    regel:
      'Der Monarch zieht am Ende seines Zugs eine Karte. Fügt eine Kreatur ihm Kampfschaden zu, wird ihr Beherrscher Monarch.',
    erscheinen: { text: 'Der Spieler mit den wenigsten Leben wird Monarch.' },
  },
  {
    id: 'rueckwaertsfluss',
    name: 'Rückwärtsfluss',
    art: 'verrueckt',
    stimmung: 'Die Zeit fließt plötzlich andersherum.',
    regel: 'Die Zugreihenfolge läuft ab sofort in die andere Richtung.',
    abSpielern: 3,
  },
];

export function weltMitId(id: string): Welt | undefined {
  return WELTEN.find((w) => w.id === id);
}
