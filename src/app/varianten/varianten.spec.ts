import { kombinieren, variantenName } from './varianten';

describe('Varianten kombinieren', () => {
  it('übernimmt eine einzelne Variante unverändert', () => {
    const k = kombinieren(['mana-wuerfel'])!;
    expect(k.name).toBe('Mana-Würfel');
    expect(k.spieler).toEqual({ min: 2, max: 4, standard: 2 });
    expect(k.werkzeuge).toEqual(['leben', 'effekt-wuerfel']);
  });

  it('lehnt unbekannte oder leere Auswahl ab', () => {
    expect(kombinieren([])).toBeNull();
    expect(kombinieren(['gibt-es-nicht'])).toBeNull();
  });

  it('kombiniert Mana-Würfel und Bosskampf zu einer Partie für zwei Spieler', () => {
    const k = kombinieren(['mana-wuerfel', 'boss'])!;
    expect(k.name).toBe('Mana-Würfel + Bosskampf');
    expect(k.spieler).toEqual({ min: 2, max: 2, standard: 2 });
    expect(k.werkzeuge).toEqual(['leben', 'effekt-wuerfel', 'boss']);
  });

  it('nennt laufende Partien nach allen Varianten', () => {
    expect(variantenName(['mana-wuerfel', 'boss'])).toBe('Mana-Würfel + Bosskampf');
  });

  it('spielt das normale Spiel nur allein', () => {
    expect(kombinieren(['normal'])?.spieler).toEqual({ min: 2, max: 4, standard: 4 });
    expect(kombinieren(['normal', 'boss'])).toBeNull();
  });
});
