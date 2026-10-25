import { BossDefinition } from '../boss-modell';

/**
 * Level 4 aus dem Briefing, der erste Boss mit den neuen Balancing-Regeln
 * (Wachstum, Nachschub, Phasen-Schild). Startet mit wenigen Dienern und wird mit jeder Runde stärker.
 */
export const STURMDRACHE: BossDefinition = {
  id: 'sturmdrache',
  name: 'Sturmdrache',
  level: 4,
  leben: 160,
  passiv:
    'Rückenwind: Alle Diener des Sturmdrachen haben Flugfähigkeit. Kreaturen der Spieler mit Flugfähigkeit erhalten −1/−0, solange sie den Sturmdrachen angreifen.',
  startDiener: 1,
  diener: [
    { name: 'Sturmfalke', staerke: 1, widerstand: 1, faehigkeit: 'Flugfähigkeit, Eile' },
    {
      name: 'Blitzwyrm',
      staerke: 2,
      widerstand: 2,
      faehigkeit: 'Flugfähigkeit. Wenn er stirbt, verliert jeder Spieler 1 Leben.',
    },
    { name: 'Donnergreif', staerke: 3, widerstand: 3, faehigkeit: 'Flugfähigkeit, Wachsamkeit' },
    {
      name: 'Wolkenwächter',
      staerke: 1,
      widerstand: 4,
      faehigkeit: 'Flugfähigkeit. Greift nicht an, blockt aber immer, falls möglich.',
    },
  ],

  fragen: [
    {
      id: 'kreaturen',
      text: 'Ich sehe Schatten unter mir … Wie viele Kreaturen kontrolliert ihr zusammen?',
      antworten: [
        { wert: '0-2', label: '0–2' },
        { wert: '3-5', label: '3–5' },
        { wert: '6-9', label: '6–9' },
        { wert: '10+', label: '10 oder mehr' },
      ],
    },
    {
      id: 'grosseKreatur',
      text: 'Wer wagt es, sich mir entgegenzustellen? Habt ihr eine Kreatur mit Stärke 6 oder mehr?',
      antworten: [
        { wert: 'ja', label: 'Ja' },
        { wert: 'nein', label: 'Nein' },
      ],
    },
    {
      id: 'flieger',
      text: 'Wer teilt meinen Himmel? Habt ihr Kreaturen mit Flugfähigkeit?',
      antworten: [
        { wert: 'ja', label: 'Ja' },
        { wert: 'nein', label: 'Nein' },
      ],
    },
    {
      id: 'bleibende',
      text: 'Euer Spielzeug glitzert im Blitzlicht. Wie viele Artefakte und Verzauberungen besitzt ihr zusammen?',
      antworten: [
        { wert: 'wenige', label: '0–1' },
        { wert: 'einige', label: '2–4' },
        { wert: 'viele', label: '5 oder mehr' },
      ],
    },
    {
      id: 'handkarten',
      text: 'Ich höre Karten rascheln. Wer von euch hält mehr in der Hand?',
      antworten: [{ wert: 'gleich', label: 'Gleich viele' }],
    },
  ],

  aktionen: [
    {
      id: 'blitzschlag',
      name: 'Blitzschlag',
      schlagworte: ['angriff'],
      gewicht: 3,
      text: 'Ein Blitz fährt in den Spieler mit den meisten Leben: Er verliert 6 Leben.',
      folgen: { leben: { ziel: 'meisteLeben', um: -6 } },
    },
    {
      id: 'kettenblitz',
      name: 'Kettenblitz',
      schlagworte: ['angriff'],
      gewicht: 2,
      text: 'Der Blitz springt von Ziel zu Ziel: Jeder Spieler verliert 3 Leben, und jede Kreatur der Spieler erhält 1 Schaden.',
      bevorzugt: { kreaturen: ['6-9', '10+'] },
      folgen: { leben: { ziel: 'alle', um: -3 } },
    },
    {
      id: 'sturzflug',
      name: 'Sturzflug',
      schlagworte: ['angriff'],
      gewicht: 2,
      phasen: [2, 3],
      text: 'Der Drache stürzt sich auf den Spieler mit den wenigsten Leben. Er verliert 8 Leben, es sei denn, er opfert eine Kreatur mit Stärke 4 oder mehr.',
    },
    {
      id: 'orkanboe',
      name: 'Orkanböe',
      schlagworte: ['kontrolle'],
      gewicht: 2,
      text: 'Bringt die Kreatur der Spieler mit der höchsten Stärke auf die Hand ihres Besitzers zurück. Haben die Spieler keine Kreatur, verliert jeder Spieler 3 Leben.',
      bevorzugt: { grosseKreatur: ['ja'] },
    },
    {
      id: 'donnerschlag',
      name: 'Donnerschlag',
      schlagworte: ['kontrolle'],
      gewicht: 2,
      phasen: [2, 3],
      text: 'Zerstört die zwei Kreaturen der Spieler mit der höchsten Stärke. Für jede fehlende Kreatur verliert der Spieler mit den meisten Leben 4 Leben.',
      bevorzugt: { grosseKreatur: ['ja'], kreaturen: ['6-9', '10+'] },
    },
    {
      id: 'sturmfront',
      name: 'Sturmfront',
      schlagworte: ['kontrolle'],
      gewicht: 2,
      text: 'Alle Kreaturen der Spieler erhalten −2/−2 bis zum Ende ihres nächsten Zuges.',
      bevorzugt: { kreaturen: ['6-9', '10+'] },
    },
    {
      id: 'windschere',
      name: 'Windschere',
      schlagworte: ['kontrolle'],
      gewicht: 1,
      text: 'Zerstört alle Kreaturen der Spieler mit Flugfähigkeit. Hat niemand fliegende Kreaturen, verliert jeder Spieler 2 Leben.',
      bevorzugt: { flieger: ['ja'] },
    },
    {
      id: 'entwurzeln',
      name: 'Entwurzeln',
      schlagworte: ['kontrolle'],
      gewicht: 1,
      text: 'Jeder Spieler opfert ein Artefakt oder eine Verzauberung. Wer keine hat, verliert stattdessen 3 Leben.',
      bevorzugt: { bleibende: ['einige', 'viele'] },
    },
    {
      id: 'statik',
      name: 'Statisches Rauschen',
      schlagworte: ['kontrolle'],
      gewicht: 1,
      text: 'Der Spieler mit den meisten Handkarten wirft zwei Karten ab. Haben beide gleich viele, wirft jeder eine Karte ab.',
      bevorzugt: { handkarten: ['1', '2', '3', '4'] },
    },
    {
      id: 'brutruf',
      name: 'Ruf der Brut',
      schlagworte: ['beschwoerung'],
      gewicht: 2,
      text: 'Ein Schrei hallt durch die Wolken: Zwei weitere Diener schließen sich dem Drachen an.',
      folgen: { diener: 2 },
    },
    {
      id: 'schwingen',
      name: 'Schwingen des Sturms',
      schlagworte: ['beschwoerung', 'angriff'],
      gewicht: 2,
      text: 'Ein weiterer Diener erscheint. Alle Diener erhalten +1/+1 bis zum nächsten Boss-Zug.',
      folgen: { diener: 1 },
    },
    {
      id: 'auge',
      name: 'Auge des Sturms',
      schlagworte: ['heilung'],
      gewicht: 1,
      text: 'Im Zentrum des Sturms kehrt Ruhe ein: Der Drache erhält 12 Leben.',
      folgen: { heilung: 12 },
    },
    {
      id: 'sturmpanzer',
      name: 'Sturmpanzer',
      schlagworte: ['heilung'],
      gewicht: 1,
      text: 'Wirbelnde Winde umgeben den Drachen: Bis zu seinem nächsten Zug verhindert er die ersten 10 Schaden.',
      folgen: { schutz: 10 },
    },
  ],

  spezial: {
    id: 'weltensturm',
    name: 'Weltensturm',
    schlagworte: ['angriff'],
    gewicht: 0,
    text: 'Der Himmel bricht auf: Jeder Spieler verliert 10 Leben, und alle Kreaturen der Spieler mit Stärke 3 oder weniger werden zerstört.',
    folgen: { leben: { ziel: 'alle', um: -10 } },
  },
  ankuendigung:
    'Der Himmel färbt sich schwarz, Blitze zucken ohne Unterlass. Im nächsten Zug entfesselt der Sturmdrache den Weltensturm!',

  sprueche: {
    wuetend: [
      'Ihr habt mir {verlust} Leben geraubt. Dafür bezahlt ihr – mit Zinsen!',
      '{verlust} Leben?! Niemand verletzt den {boss} und lebt lange genug, um davon zu erzählen.',
      'Ihr wollt Krieg? Dann bekommt ihr Gewitter.',
    ],
    bedroht: [
      'Eure Armee wird zu groß. Zeit, das Feld zu lichten.',
      'So viele Kreaturen … Der Wind wird sie schon sortieren.',
      'Ihr glaubt, Masse schlägt Macht? Ich zeige euch das Gegenteil.',
    ],
    ueberlegen: [
      'Ich rieche Schwäche. {schwaechster}, du wackelst schon.',
      'Das Ende ist nah. Für einige von euch näher als für andere.',
      'Noch ein Windstoß, und ihr fallt wie Laub.',
    ],
    verzweifelt: [
      'Ihr … seid stärker, als ich dachte. Zu mir, meine Kinder!',
      'Der Sturm zieht sich zusammen. Und er kommt wieder.',
      'Ich falle nicht. Nicht heute. Nicht gegen euch.',
    ],
    lauernd: [
      'Der Wind dreht sich. Ihr spürt es, oder?',
      'Ich kreise über euch. Geduldig. Hungrig.',
      'Genießt die Ruhe. Sie ist das Letzte, was ihr von mir bekommt.',
    ],
  },
};
