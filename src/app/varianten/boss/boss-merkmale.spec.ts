import { zufallMitStartwert } from '../../core/zufall';
import { bossZug } from './boss-logik';
import { merkmalAnzeige } from './boss-merkmale';
import { BossDefinition, BossZug } from './boss-modell';
import {
  bossLage,
  bossStarten,
  BossStand,
  bossTreffen,
  bossZugEintragen,
  eiZerschlagen,
  nebelVertreiben,
  paktEntscheiden,
} from './boss-stand';
import { BOSSE } from './bosse';
import { DAEMONENFUERST } from './bosse/daemonenfuerst';
import { FLAMMENKOLOSS } from './bosse/flammenkoloss';
import { GORVAK } from './bosse/gorvak';
import { KNOCHENFUERST } from './bosse/knochenfuerst';
import { NEBELKOENIGIN } from './bosse/nebelkoenigin';
import { SCHWARMKOENIGIN } from './bosse/schwarmkoenigin';
import { SPIEGELHEXE } from './bosse/spiegelhexe';
import { STURMDRACHE } from './bosse/sturmdrache';
import { WELTENFRESSER } from './bosse/weltenfresser';
import { ZEITWEBER } from './bosse/zeitweber';

const spieler = [
  { id: 1, name: 'Jo', leben: 40 },
  { id: 2, name: 'Flo', leben: 40 },
];

function start(boss: BossDefinition): BossStand {
  return bossStarten(boss, zufallMitStartwert(1));
}

/** Ein ganzer Boss-Zug wie am Tisch: auswürfeln und eintragen. */
function bossRunde(
  boss: BossDefinition,
  stand: BossStand,
  antworten: Record<string, string> = {},
  seed = 2,
): { stand: BossStand; zug: BossZug } {
  const zug = bossZug(boss, bossLage(stand, spieler, antworten), zufallMitStartwert(seed));
  return { stand: bossZugEintragen(stand, zug, spieler, antworten), zug };
}

describe('Boss-Merkmale', () => {
  it('jeder Boss hat ein eigenes Merkmal mit Erklärung', () => {
    const arten = new Set(BOSSE.map((b) => b.merkmal?.name));
    expect(arten.size).toBe(10);
    for (const b of BOSSE) {
      expect(b.merkmal?.text.length, b.id).toBeGreaterThan(40);
      expect(merkmalAnzeige(b, start(b).merkmal, b.leben), b.id).not.toBeNull();
    }
  });

  describe('Spiegelhexe: zwei Gestalten', () => {
    it('teilt die Leben auf und trifft die gewählte Gestalt', () => {
      const stand = start(SPIEGELHEXE);
      expect(stand.merkmal?.teile?.map((t) => t.leben)).toEqual([60, 40]);
      const nach = bossTreffen(stand, 10, SPIEGELHEXE, 'spiegelbild').stand;
      expect(nach.leben).toBe(90);
      expect(nach.merkmal?.teile?.find((t) => t.id === 'spiegelbild')?.leben).toBe(30);
    });

    it('handelt zweimal, solange das Spiegelbild steht', () => {
      expect(bossRunde(SPIEGELHEXE, start(SPIEGELHEXE)).zug.aktionen.length).toBe(2);
    });

    it('holt eine gefallene Gestalt nach zwei Zügen zurück, Überschuss verfällt', () => {
      const r = bossTreffen(start(SPIEGELHEXE), 45, SPIEGELHEXE, 'spiegelbild');
      expect(r.verfallen).toBe(5);
      expect(r.stand.merkmal?.wiederkehr).toEqual({ id: 'spiegelbild', zuege: 2 });
      let stand = bossRunde(SPIEGELHEXE, r.stand).stand;
      expect(stand.merkmal?.wiederkehr?.zuege).toBe(1);
      stand = bossRunde(SPIEGELHEXE, stand).stand;
      expect(stand.merkmal?.teile?.find((t) => t.id === 'spiegelbild')?.leben).toBe(20);
      expect(stand.leben).toBe(80);
    });

    it('ist besiegt, wenn beide Gestalten fallen', () => {
      let stand = bossTreffen(start(SPIEGELHEXE), 40, SPIEGELHEXE, 'spiegelbild').stand;
      stand = { ...stand, schild: false };
      stand = bossTreffen(stand, 25, SPIEGELHEXE, 'morwen').stand;
      expect(stand.leben).toBeGreaterThan(0);
      stand = {
        ...stand,
        leben: 5,
        merkmal: {
          ...stand.merkmal!,
          teile: [
            { id: 'morwen', leben: 5, max: 60 },
            { id: 'spiegelbild', leben: 0, max: 40 },
          ],
        },
      };
      expect(bossTreffen(stand, 5, SPIEGELHEXE, 'morwen').stand.leben).toBe(0);
    });
  });

  it('Nebelkönigin: Nebel wächst, halbiert ab 3 den Schaden und lässt sich vertreiben', () => {
    let stand = start(NEBELKOENIGIN);
    for (let i = 0; i < 3; i++) stand = bossRunde(NEBELKOENIGIN, stand).stand;
    expect(stand.merkmal?.wert).toBe(3);
    expect(bossTreffen(stand, 10, NEBELKOENIGIN).wirkung).toBe(5);
    stand = nebelVertreiben(stand);
    expect(bossTreffen(stand, 10, NEBELKOENIGIN).wirkung).toBe(10);
  });

  it('Gorvak: frisst bei voller Leiste – oder ist ausgehungert und erleidet doppelten Schaden', () => {
    let stand: BossStand = { ...start(GORVAK), diener: [], leben: 100 };
    stand = bossRunde(GORVAK, stand).stand;
    const voll = { ...stand, diener: [] };
    const satt = bossRunde(GORVAK, voll, { beute: 'ja' });
    expect(satt.zug.merkmal?.wirkungen[0]).toMatch(/Zerstöre/);
    expect(satt.zug.heilung).toBeGreaterThanOrEqual(20);
    const hungrig = bossRunde(GORVAK, voll, { beute: 'nein' }).stand;
    expect(hungrig.merkmal?.zustand).toBe('ausgehungert');
    expect(bossTreffen({ ...hungrig, schutz: 0 }, 5, GORVAK).wirkung).toBe(10);
  });

  it('Sturmdrache: landet im Wechsel, verbrennt Kreaturen und erleidet am Boden doppelten Schaden', () => {
    let r = bossRunde(STURMDRACHE, start(STURMDRACHE));
    expect(r.stand.merkmal?.zustand).toBe('boden');
    expect(r.zug.merkmal?.wirkungen[0]).toMatch(/Feueratem/);
    expect(bossTreffen({ ...r.stand, schutz: 0 }, 5, STURMDRACHE).wirkung).toBe(10);
    r = bossRunde(STURMDRACHE, r.stand);
    expect(r.stand.merkmal?.zustand).toBe('himmel');
  });

  it('Knochenfürst: eure Toten stehen als Skelette für ihn auf, höchstens zwei', () => {
    const r = bossRunde(KNOCHENFUERST, start(KNOCHENFUERST), { gestorben: '3' });
    expect(
      r.zug.neueDiener.filter((d) => d.name === 'Skelettkrieger').length,
    ).toBeGreaterThanOrEqual(2);
    expect(r.zug.merkmal?.texte[0]).toMatch(/2 eurer Toten/);
  });

  it('Schwarmkönigin: legt Eier, die nach zwei Zügen schlüpfen, und schützt sich mit dem Schwarm', () => {
    let stand = start(SCHWARMKOENIGIN);
    stand = bossRunde(SCHWARMKOENIGIN, stand).stand;
    expect(stand.merkmal?.eier?.length).toBe(1);
    const zerschlagen = eiZerschlagen(stand, stand.merkmal!.eier![0].nr);
    expect(zerschlagen.merkmal?.eier?.length).toBe(0);
    stand = bossRunde(SCHWARMKOENIGIN, stand).stand;
    const r = bossRunde(SCHWARMKOENIGIN, stand);
    expect(r.zug.merkmal?.texte.join(' ')).toMatch(/schlüpft/);
    expect(r.zug.schutz).toBeGreaterThan(0);
  });

  it('Flammenkoloss: Hitze steigt, Schaden kühlt, bei 10 bricht er aus', () => {
    let stand = start(FLAMMENKOLOSS);
    stand = bossRunde(FLAMMENKOLOSS, stand).stand;
    expect(stand.merkmal?.wert).toBe(2);
    const gekuehlt = bossRunde(FLAMMENKOLOSS, { ...stand, lebenVorher: stand.leben + 10 }).stand;
    expect(gekuehlt.merkmal?.wert).toBe(2);
    const heiss = { ...stand, merkmal: { wert: 10 } };
    const r = bossRunde(FLAMMENKOLOSS, heiss);
    expect(r.zug.merkmal?.wirkungen[0]).toMatch(/Ausbruch/);
    expect(r.stand.merkmal?.wert).toBe(0);
  });

  it('Zeitweber: spult jeden dritten Zug zurück, außer die Schleife reißt', () => {
    let stand = start(ZEITWEBER);
    stand = bossRunde(ZEITWEBER, stand).stand;
    stand = { ...bossRunde(ZEITWEBER, { ...stand, leben: 220, lebenVorher: 240 }).stand };
    const zurueck = bossRunde(ZEITWEBER, { ...stand, leben: 210, lebenVorher: 220 });
    expect(zurueck.zug.merkmal?.texte[0]).toMatch(/spult/);
    expect(zurueck.zug.heilung).toBe(30);
    const riss = bossRunde(ZEITWEBER, { ...stand, leben: 180, lebenVorher: 220 });
    expect(riss.zug.merkmal?.texte[0]).toMatch(/reißt/);
  });

  it('Dämonenfürst: bietet Pakte an, Annehmen gibt ihm Seelen und stärkt seine Diener', () => {
    let stand = bossRunde(DAEMONENFUERST, { ...start(DAEMONENFUERST), leben: 200 }).stand;
    expect(stand.merkmal?.offen?.length).toBe(2);
    const diener = stand.diener.map((d) => d.staerke);
    let r = paktEntscheiden(stand, 1, true, DAEMONENFUERST);
    expect(r.stand.merkmal?.wert).toBe(1);
    expect(r.stand.leben).toBe(212);
    r = paktEntscheiden(r.stand, 2, true, DAEMONENFUERST);
    expect(r.stand.diener.map((d) => d.staerke)).toEqual(diener.map((s) => s + 1));
    stand = paktEntscheiden(bossRunde(DAEMONENFUERST, stand).stand, 1, false, DAEMONENFUERST).stand;
    expect(stand.merkmal?.offen?.map((o) => o.spielerId)).toEqual([2]);
  });

  it('Weltenfresser: nur der Kopf zählt, der Kern heilt, das Weltende kommt', () => {
    const stand = start(WELTENFRESSER);
    // Klauen und Kern stehen noch, der Kopf ist fast hin: Fällt er, ist der Boss besiegt.
    const teile = stand.merkmal!.teile!.map((t) => (t.id === 'kopf' ? { ...t, leben: 10 } : t));
    const leben = teile.reduce((s, t) => s + t.leben, 0);
    const nach = bossTreffen(
      { ...stand, leben, merkmal: { ...stand.merkmal!, teile } },
      10,
      WELTENFRESSER,
      'kopf',
    ).stand;
    expect(nach.leben).toBe(0);

    const kern = bossRunde(WELTENFRESSER, { ...stand, leben: 200 });
    expect(kern.zug.merkmal?.texte.join(' ')).toMatch(/Kern/);

    const r = bossRunde(WELTENFRESSER, { ...stand, merkmal: { ...stand.merkmal!, wert: 1 } });
    expect(r.zug.lebenAenderungen.some((l) => l.um <= -999)).toBe(true);
  });
});
