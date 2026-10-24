import { kombinieren, variantenName } from './varianten';

describe('Varianten kombinieren', () => {
  it('übernimmt eine einzelne Variante unverändert', () => {
    const k = kombinieren(['mana-wuerfel'])!;
    expect(k.name).toBe('Mana-Würfel');
    expect(k.spieler).toEqual({ min: 2, max: 4, standard: 2 });
    expect(k.werkzeuge).toEqual(['leben', 'effekt-wuerfel']);
  });

  it('lehnt unbekannte, noch nicht spielbare oder leere Auswahl ab', () => {
    expect(kombinieren([])).toBeNull();
    expect(kombinieren(['gibt-es-nicht'])).toBeNull();
    expect(kombinieren(['mana-wuerfel', 'boss'])).toBeNull();
  });

  it('nennt laufende Partien nach allen Varianten', () => {
    expect(variantenName(['mana-wuerfel', 'boss'])).toBe('Mana-Würfel + Bosskampf');
  });
});
