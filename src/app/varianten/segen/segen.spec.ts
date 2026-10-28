import { zufallMitStartwert } from '../../core/zufall';
import {
  aktuelleAuswahl,
  SEGEN,
  segenMitId,
  segenPool,
  segenStarten,
  segenUmschalten,
  segenWaehlen,
  SegenStand,
} from './segen';

const spieler = [
  { id: 1, name: 'Jo', leben: 40 },
  { id: 2, name: 'Flo', leben: 40 },
  { id: 3, name: 'Mia', leben: 40 },
  { id: 4, name: 'Ben', leben: 40 },
];

/** Jeder nimmt immer den ersten Segen im Päckchen. */
function durchdraften(stand: SegenStand, liste = spieler) {
  let s = stand;
  let p = liste;
  while (!s.fertig) {
    const r = segenWaehlen(s, p, aktuelleAuswahl(s)[0].id);
    s = r.stand;
    p = r.spieler;
  }
  return { stand: s, spieler: p };
}

describe('Segen-Draft', () => {
  it('hat genug Segen für vier Spieler, auch ohne Pakte', () => {
    expect(new Set(SEGEN.map((s) => s.id)).size).toBe(SEGEN.length);
    expect(segenPool(false).every((s) => !s.pakt)).toBe(true);
    expect(segenPool(false).length).toBeGreaterThanOrEqual(4 * 4);
  });

  it('gibt jedem ein Päckchen mit einem Segen mehr, als er am Ende hat', () => {
    const stand = segenStarten({ anzahl: 3, pakte: true }, spieler, zufallMitStartwert(1));
    expect(stand.paeckchen.map((p) => p.length)).toEqual([4, 4, 4, 4]);
    expect(new Set(stand.paeckchen.flat()).size).toBe(16);
  });

  it('reicht die Päckchen nach links weiter', () => {
    let stand = segenStarten({ anzahl: 3, pakte: true }, spieler, zufallMitStartwert(2));
    const ersteVonBen = stand.paeckchen[3];
    for (let i = 0; i < 4; i++)
      stand = segenWaehlen(stand, spieler, aktuelleAuswahl(stand)[0].id).stand;
    // Zweiter Schritt: Jo hält jetzt das Päckchen, das bei Ben angefangen hat.
    expect(stand.schritt).toBe(1);
    expect(aktuelleAuswahl(stand).map((s) => s.id)).toEqual(ersteVonBen.slice(1));
  });

  it('endet, wenn jeder genug Segen hat, und keiner hat doppelte', () => {
    const { stand } = durchdraften(
      segenStarten({ anzahl: 2, pakte: false }, spieler, zufallMitStartwert(3)),
    );
    expect(stand.fertig).toBe(true);
    for (const p of spieler) expect(stand.gewaehlt[p.id].length).toBe(2);
    expect(new Set(Object.values(stand.gewaehlt).flat()).size).toBe(8);
    expect(aktuelleAuswahl(stand)).toEqual([]);
  });

  it('trägt Startleben beim Wählen ein', () => {
    const stand: SegenStand = {
      anzahl: 1,
      paeckchen: [
        ['blutpakt', 'ruhm'],
        ['lebenskraft', 'kronjuwel'],
      ],
      schritt: 0,
      waehler: 0,
      gewaehlt: { 1: [], 2: [] },
      benutzt: [],
      fertig: false,
    };
    const zwei = spieler.slice(0, 2);
    let r = segenWaehlen(stand, zwei, 'blutpakt');
    r = segenWaehlen(r.stand, r.spieler, 'lebenskraft');
    expect(r.spieler.map((p) => p.leben)).toEqual([32, 45]);
    expect(r.stand.fertig).toBe(true);
  });

  it('hakt einmalige Segen ab und wieder an', () => {
    let stand = segenStarten({ anzahl: 2, pakte: true }, spieler, zufallMitStartwert(4));
    stand = segenUmschalten(stand, 2, 'ruhm');
    expect(stand.benutzt).toEqual(['2:ruhm']);
    expect(segenUmschalten(stand, 2, 'ruhm').benutzt).toEqual([]);
    expect(segenMitId('ruhm')?.einmalig).toBe(true);
  });
});
