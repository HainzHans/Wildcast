import { partieBewertbar } from './bewertung';
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
  it('fragt beim normalen Spiel nicht nach', () => {
    expect(partieBewertbar(basis)).toBeNull();
  });

  it('bewertet am Ende nur die Spielvariante', () => {
    const p = partieBewertbar({ ...basis, varianten: ['segen', 'mana-wuerfel'] });
    expect(p?.art).toBe('partie');
    expect(p?.ref).toBe('mana-wuerfel+segen');
  });
});
