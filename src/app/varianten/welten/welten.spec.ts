import { zufallMitStartwert } from '../../core/zufall';
import {
  lebenBeimErscheinen,
  rundeBeenden,
  rundenBisWechsel,
  weltenFuer,
  weltenStarten,
  WeltStand,
} from './welt-stand';
import { WELTEN, weltMitId } from './welten';

const spieler = [
  { id: 1, name: 'Jo', leben: 40 },
  { id: 2, name: 'Flo', leben: 30 },
  { id: 3, name: 'Mia', leben: 21 },
];

function runden(stand: WeltStand, n: number, anzahl = 3): WeltStand {
  const zufall = zufallMitStartwert(5);
  for (let i = 0; i < n; i++) stand = rundeBeenden(stand, anzahl, zufall).stand;
  return stand;
}

describe('Welten', () => {
  it('haben eindeutige Kennungen und von jeder Art genug', () => {
    expect(new Set(WELTEN.map((w) => w.id)).size).toBe(WELTEN.length);
    for (const art of ['normal', 'chaos', 'verrueckt'] as const) {
      expect(WELTEN.filter((w) => w.art === art).length).toBeGreaterThanOrEqual(12);
    }
  });

  it('kennen nur die gewählte Art und passende Spielerzahlen', () => {
    expect(weltenFuer('chaos', 4).every((w) => w.art === 'chaos')).toBe(true);
    expect(weltenFuer('alle', 4).length).toBe(WELTEN.length);
    expect(weltenFuer('verrueckt', 2).some((w) => w.id === 'rueckwaertsfluss')).toBe(false);
  });

  it('starten mit einer Welt der gewählten Art in Runde 1', () => {
    const stand = weltenStarten({ auswahl: 'normal', intervall: 3 }, 3, zufallMitStartwert(1));
    expect(weltMitId(stand.aktuell)?.art).toBe('normal');
    expect(stand.runde).toBe(1);
    expect(rundenBisWechsel(stand)).toBe(3);
  });

  it('wechseln genau nach der eingestellten Rundenzahl', () => {
    const zufall = zufallMitStartwert(2);
    let stand = weltenStarten({ auswahl: 'alle', intervall: 3 }, 3, zufall);
    const erste = stand.aktuell;
    for (let i = 0; i < 2; i++) {
      const r = rundeBeenden(stand, 3, zufall);
      expect(r.neu).toBeNull();
      stand = r.stand;
    }
    expect(rundenBisWechsel(stand)).toBe(1);
    const r = rundeBeenden(stand, 3, zufall);
    expect(r.neu).not.toBeNull();
    expect(r.stand.aktuell).not.toBe(erste);
    expect(r.stand.runde).toBe(4);
    expect(r.stand.seitRunde).toBe(4);
  });

  it('wiederholen keine Welt, bis alle dran waren, und mischen dann neu', () => {
    let stand = weltenStarten({ auswahl: 'chaos', intervall: 1 }, 3, zufallMitStartwert(3));
    const anzahl = weltenFuer('chaos', 3).length;
    stand = runden(stand, anzahl - 1);
    const ids = stand.verlauf.map((v) => v.id);
    expect(new Set(ids).size).toBe(anzahl);

    stand = runden(stand, 30);
    const folge = stand.verlauf.map((v) => v.id);
    expect(folge.every((id, i) => i === 0 || id !== folge[i - 1])).toBe(true);
  });

  it('tragen Lebensänderungen beim Erscheinen ein', () => {
    const aschefeld = weltMitId('aschefeld')!;
    expect(lebenBeimErscheinen(aschefeld, spieler).map((p) => p.leben)).toEqual([45, 35, 26]);

    const waage = weltMitId('waage-der-goetter')!;
    expect(lebenBeimErscheinen(waage, spieler).map((p) => p.leben)).toEqual([31, 31, 31]);

    const spiegel = weltMitId('spiegelwelt')!;
    expect(lebenBeimErscheinen(spiegel, spieler).map((p) => p.leben)).toEqual([21, 40, 30]);

    const ohne = weltMitId('blutmond')!;
    expect(lebenBeimErscheinen(ohne, spieler)).toBe(spieler);
  });
});
