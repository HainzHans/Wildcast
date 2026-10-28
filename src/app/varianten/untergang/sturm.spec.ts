import { zufallMitStartwert } from '../../core/zufall';
import {
  ABWUERFE,
  abwurfWaehlen,
  rundenBisAbwurf,
  sturmRunde,
  sturmSchaden,
  sturmStarten,
  sturmVerlauf,
  SturmStand,
} from './sturm';

const spieler = [
  { id: 1, name: 'Jo', leben: 30 },
  { id: 2, name: 'Flo', leben: 12 },
  { id: 3, name: 'Mia', leben: 20 },
];

describe('Untergang', () => {
  it('beginnt in der eingestellten Runde und wird je nach Stärke schneller schlimmer', () => {
    expect(sturmVerlauf({ abRunde: 3, staerke: 'sanft' }, 7)).toEqual([1, 1, 1, 2, 2, 2, 3]);
    expect(sturmVerlauf({ abRunde: 3, staerke: 'normal' }, 6)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(sturmVerlauf({ abRunde: 3, staerke: 'hart' }, 4)).toEqual([1, 2, 3, 4]);
    expect(sturmSchaden({ abRunde: 3, staerke: 'hart' }, 2)).toBe(0);
  });

  it('trifft alle Lebenden, aber nicht die Geschützten', () => {
    const stand = { ...sturmStarten({ abRunde: 2, staerke: 'normal' }), geschuetzt: [3] };
    const r = sturmRunde(stand, [...spieler, { id: 4, name: 'Tot', leben: 0 }], 4, Math.random);
    expect(r.spieler.map((p) => p.leben)).toEqual([28, 10, 20, 0]);
    expect(r.stand.geschuetzt).toEqual([]);
    expect(r.stand.zuletzt).toEqual({ runde: 4, schaden: 2 });
  });

  it('lässt vor dem Start alles, wie es ist', () => {
    const stand = sturmStarten({ abRunde: 3, staerke: 'normal' });
    const r = sturmRunde(stand, spieler, 2, Math.random);
    expect(r.spieler).toBe(spieler);
    expect(r.stand).toBe(stand);
  });

  it('wirft alle drei Sturmrunden Versorgung ab, die Schwächsten wählen zuerst', () => {
    const stand = sturmStarten({ abRunde: 3, staerke: 'normal' });
    expect([3, 4, 5, 6, 7, 8].map((r) => rundenBisAbwurf(stand, r))).toEqual([2, 1, 0, 2, 1, 0]);
    expect(sturmRunde(stand, spieler, 4, zufallMitStartwert(1)).stand.abwurf).toBeNull();

    const r = sturmRunde(stand, spieler, 5, zufallMitStartwert(1));
    expect(r.stand.abwurf?.reihenfolge).toEqual([2, 3, 1]);
    expect(r.stand.abwurf?.angebote.length).toBe(3);
  });

  it('trägt Leben und Schutz aus dem Abwurf ein und schließt ihn, wenn alle gewählt haben', () => {
    let stand: SturmStand = {
      ...sturmStarten({ abRunde: 3, staerke: 'normal' }),
      abwurf: { angebote: ['vorraete', 'schutzkuppel', 'feldpost'], reihenfolge: [2, 1] },
    };
    let r = abwurfWaehlen(stand, spieler, 'vorraete');
    expect(r.spieler.find((p) => p.id === 2)?.leben).toBe(18);
    expect(r.stand.abwurf).toEqual({ angebote: ['schutzkuppel', 'feldpost'], reihenfolge: [1] });

    stand = r.stand;
    r = abwurfWaehlen(stand, r.spieler, 'schutzkuppel');
    expect(r.stand.geschuetzt).toEqual([1]);
    expect(r.stand.abwurf).toBeNull();
  });

  it('haben eindeutige Abwürfe', () => {
    expect(new Set(ABWUERFE.map((a) => a.id)).size).toBe(ABWUERFE.length);
  });
});
