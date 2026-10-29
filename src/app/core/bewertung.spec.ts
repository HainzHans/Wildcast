import { bewertbares } from './bewertung';
import { Spielstand } from './spiel/modell';

const basis: Spielstand = {
  varianten: ['normal'],
  gestartet: '2026-10-29T12:00:00Z',
  spieler: [
    { id: 1, name: 'Jo', leben: 40 },
    { id: 2, name: 'Flo', leben: 40 },
  ],
  effekte: [],
};

describe('Bewertung am Spielende', () => {
  it('hat beim normalen Spiel nichts zu bewerten', () => {
    expect(bewertbares(basis)).toEqual([]);
  });

  it('listet Partie und jeden gewürfelten Effekt nur einmal', () => {
    const effekt = {
      nr: 1,
      vorlage: 'v1',
      mana: 3,
      art: 'positiv' as const,
      form: 'normal' as const,
      name: 'Glück',
      text: 'Ziehe eine Karte.',
      spruch: '',
      spielerId: 1,
      zeit: '',
    };
    const liste = bewertbares({
      ...basis,
      varianten: ['mana-wuerfel'],
      effekte: [effekt, { ...effekt, nr: 2 }],
    });
    expect(liste.map((b) => b.art)).toEqual(['partie', 'effekt']);
    expect(liste[0].name).toBe('Mana-Würfel');
  });
});
