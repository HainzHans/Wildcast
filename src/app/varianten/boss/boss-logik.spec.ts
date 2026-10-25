import { zufallMitStartwert } from '../../core/zufall';
import {
  bossZug,
  dienerNachschub,
  fragenFuerZug,
  heilen,
  phase,
  schadenAmBoss,
  stimmung,
  waehleAktion,
  zielSpieler,
} from './boss-logik';
import { Lage } from './boss-modell';
import { STURMDRACHE } from './bosse/sturmdrache';

function lage(aenderung: Partial<Lage> = {}): Lage {
  return {
    runde: 3,
    leben: 160,
    maxLeben: 160,
    lebenVorher: 160,
    diener: 2,
    spieler: [
      { id: 1, name: 'Jo', leben: 40 },
      { id: 2, name: 'Flo', leben: 35 },
    ],
    antworten: {},
    letzteAktionen: [],
    verlauf: [],
    letzteFragen: [],
    letzteSprueche: [],
    spezialAngekuendigt: false,
    ...aenderung,
  };
}

describe('Boss-Logik', () => {
  describe('Phasen und Schild', () => {
    it('wechselt bei 60 % und 30 % der Leben die Phase', () => {
      expect(phase(160, 160)).toBe(1);
      expect(phase(97, 160)).toBe(1);
      expect(phase(96, 160)).toBe(2);
      expect(phase(48, 160)).toBe(3);
    });

    it('stoppt Schaden an der Phasengrenze und lässt den Rest verfallen', () => {
      const nach = schadenAmBoss({ leben: 120, maxLeben: 160, schild: false, schutz: 0 }, 50);
      expect(nach.leben).toBe(96);
      expect(nach.schild).toBe(true);
      expect(nach.verfallen).toBe(26);
    });

    it('lässt bei aktivem Schild jeden weiteren Schaden verfallen', () => {
      const nach = schadenAmBoss({ leben: 96, maxLeben: 160, schild: true, schutz: 0 }, 20);
      expect(nach.leben).toBe(96);
      expect(nach.verfallen).toBe(20);
    });

    it('verbraucht zuerst den Schutz', () => {
      const nach = schadenAmBoss({ leben: 150, maxLeben: 160, schild: false, schutz: 10 }, 15);
      expect(nach.leben).toBe(145);
      expect(nach.schutz).toBe(0);
    });

    it('kann in Phase 3 bis auf 0 fallen', () => {
      const nach = schadenAmBoss({ leben: 20, maxLeben: 160, schild: false, schutz: 0 }, 50);
      expect(nach.leben).toBe(0);
    });

    it('heilt nie über die Grenze der aktuellen Phase hinaus', () => {
      expect(heilen(90, 160, 12)).toBe(96);
      expect(heilen(140, 160, 30)).toBe(160);
    });
  });

  it('wächst mit den Runden und schickt Nachschub, wenn kaum Diener übrig sind', () => {
    expect(dienerNachschub(1, 1)).toBe(1);
    expect(dienerNachschub(2, 1)).toBe(3);
    expect(dienerNachschub(3, 4)).toBe(2);
    expect(dienerNachschub(5, 0)).toBe(5);
  });

  describe('Stimmung', () => {
    it('wird wütend nach großem Verlust', () => {
      expect(stimmung(lage({ lebenVorher: 160, leben: 120 }))).toBe('wuetend');
    });

    it('fühlt sich bedroht, wenn die Spieler viele Kreaturen haben', () => {
      expect(stimmung(lage({ antworten: { kreaturen: '10+' } }))).toBe('bedroht');
    });

    it('setzt nach, wenn ein Spieler schwächelt', () => {
      const spieler = [
        { id: 1, name: 'Jo', leben: 40 },
        { id: 2, name: 'Flo', leben: 8 },
      ];
      expect(stimmung(lage({ spieler }))).toBe('ueberlegen');
    });

    it('wird verzweifelt mit wenig Leben und kaum Dienern', () => {
      expect(stimmung(lage({ leben: 40, lebenVorher: 45, diener: 0 }))).toBe('verzweifelt');
    });

    it('lauert, wenn nichts Besonderes los ist', () => {
      expect(stimmung(lage({ antworten: { kreaturen: '3-5' } }))).toBe('lauernd');
    });
  });

  describe('Aktionswahl', () => {
    it('wiederholt die letzte Aktion nie direkt', () => {
      const zufall = zufallMitStartwert(4);
      for (let i = 0; i < 200; i++) {
        const a = waehleAktion(
          STURMDRACHE,
          lage({ letzteAktionen: ['blitzschlag'] }),
          'wuetend',
          zufall,
        );
        expect(a.id).not.toBe('blitzschlag');
      }
    });

    it('greift bedroht vor allem zu Kontrolle', () => {
      const zufall = zufallMitStartwert(9);
      const l = lage({ leben: 90, antworten: { kreaturen: '10+', grosseKreatur: 'ja' } });
      let kontrolle = 0;
      for (let i = 0; i < 1000; i++) {
        if (waehleAktion(STURMDRACHE, l, 'bedroht', zufall).schlagworte.includes('kontrolle'))
          kontrolle++;
      }
      expect(kontrolle / 1000).toBeGreaterThan(0.7);
    });

    it('heilt nicht mit vollen Leben', () => {
      const zufall = zufallMitStartwert(2);
      for (let i = 0; i < 300; i++) {
        expect(waehleAktion(STURMDRACHE, lage(), 'verzweifelt', zufall).id).not.toBe('auge');
      }
    });
  });

  it('stellt ein oder zwei verschiedene Fragen', () => {
    const zufall = zufallMitStartwert(1);
    const anzahlen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const fragen = fragenFuerZug(STURMDRACHE, lage(), zufall);
      anzahlen.add(fragen.length);
      expect(new Set(fragen.map((f) => f.id)).size).toBe(fragen.length);
    }
    expect([...anzahlen].sort()).toEqual([1, 2]);
  });

  it('fragt selten dasselbe wie im vorigen Zug', () => {
    const zufall = zufallMitStartwert(12);
    let wiederholt = 0;
    for (let i = 0; i < 500; i++) {
      const fragen = fragenFuerZug(STURMDRACHE, lage({ letzteFragen: ['kreaturen'] }), zufall, 1);
      if (fragen[0].id === 'kreaturen') wiederholt++;
    }
    expect(wiederholt / 500).toBeLessThan(0.15);
  });

  it('stellt über mehrere Züge viele verschiedene Fragen', () => {
    const zufall = zufallMitStartwert(21);
    const gestellt = new Set<string>();
    for (let i = 0; i < 40; i++) {
      for (const f of fragenFuerZug(STURMDRACHE, lage(), zufall)) gestellt.add(f.id);
    }
    expect(gestellt.size).toBeGreaterThanOrEqual(6);
  });

  it('nimmt Aktionen aus den letzten Zügen deutlich seltener', () => {
    const zufall = zufallMitStartwert(14);
    const zaehle = (verlauf: string[]) => {
      let blitz = 0;
      for (let i = 0; i < 2000; i++) {
        if (waehleAktion(STURMDRACHE, lage({ verlauf }), 'lauernd', zufall).id === 'blitzschlag')
          blitz++;
      }
      return blitz;
    };
    expect(zaehle(['blitzschlag'])).toBeLessThan(zaehle([]) * 0.6);
  });

  it('wiederholt keine Aktion aus dem vorigen Zug, auch in Phase 3 nicht', () => {
    const zufall = zufallMitStartwert(15);
    for (let i = 0; i < 300; i++) {
      const a = waehleAktion(
        STURMDRACHE,
        lage({ letzteAktionen: ['hagel', 'brutruf'] }),
        'wuetend',
        zufall,
      );
      expect(['hagel', 'brutruf']).not.toContain(a.id);
    }
  });

  it('nimmt einen Spruch, der zuletzt nicht kam', () => {
    const alle = STURMDRACHE.sprueche.lauernd;
    const zug = bossZug(STURMDRACHE, lage({ letzteSprueche: alle.slice(1) }), () => 0.99);
    expect(zug.spruchVorlage).toBe(alle[0]);
  });

  it('bietet bei der Handkarten-Frage die Spieler als Antworten an', () => {
    const zufall = zufallMitStartwert(3);
    for (let i = 0; i < 50; i++) {
      const frage = fragenFuerZug(STURMDRACHE, lage(), zufall).find((f) => f.id === 'handkarten');
      if (frage) {
        expect(frage.antworten.map((a) => a.label)).toEqual(['Jo', 'Flo', 'Gleich viele']);
        return;
      }
    }
    throw new Error('Handkarten-Frage kam nie vor');
  });

  it('löst relative Ziele über die Leben auf, bei Gleichstand per Würfel', () => {
    expect(zielSpieler(lage(), 'meisteLeben', () => 0)).toEqual([1]);
    expect(zielSpieler(lage(), 'wenigsteLeben', () => 0)).toEqual([2]);
    const gleich = lage({
      spieler: [
        { id: 1, name: 'Jo', leben: 30 },
        { id: 2, name: 'Flo', leben: 30 },
      ],
    });
    expect(zielSpieler(gleich, 'meisteLeben', () => 0.99)).toEqual([2]);
  });

  it('rächt sich an dem Spieler, den die Antwort nennt', () => {
    expect(zielSpieler(lage({ antworten: { rache: '2' } }), 'rache', () => 0)).toEqual([2]);
    expect(zielSpieler(lage({ antworten: { rache: 'niemand' } }), 'rache', () => 0)).toEqual([1]);
  });

  describe('Boss-Zug', () => {
    it('macht in Phase 1 eine Aktion und beschwört Diener', () => {
      const zug = bossZug(STURMDRACHE, lage({ runde: 1, diener: 1 }), zufallMitStartwert(5));
      expect(zug.phase).toBe(1);
      expect(zug.aktionen.length).toBe(1);
      expect(zug.neueDiener.length).toBeGreaterThanOrEqual(1);
      expect(zug.angriffsziel).not.toBeNull();
      expect(zug.spruch.length).toBeGreaterThan(0);
    });

    it('kündigt in Phase 3 den Spezialangriff an und führt ihn im nächsten Zug aus', () => {
      const zufall = zufallMitStartwert(6);
      const ersterZug = bossZug(STURMDRACHE, lage({ leben: 40, lebenVorher: 45 }), zufall);
      expect(ersterZug.aktionen.length).toBe(2);
      expect(ersterZug.ankuendigung).not.toBeNull();
      expect(ersterZug.aktionen.map((a) => a.id)).not.toContain('weltensturm');

      const zweiterZug = bossZug(
        STURMDRACHE,
        lage({ leben: 40, lebenVorher: 40, spezialAngekuendigt: ersterZug.spezialAngekuendigt }),
        zufall,
      );
      expect(zweiterZug.aktionen.map((a) => a.id)).toContain('weltensturm');
      expect(zweiterZug.aktionen.length).toBe(2);
      expect(zweiterZug.lebenAenderungen.filter((l) => l.um === -10).length).toBe(2);
    });

    it('macht in einem Zug nie dieselbe Aktion zweimal', () => {
      const zufall = zufallMitStartwert(8);
      for (let i = 0; i < 100; i++) {
        const zug = bossZug(STURMDRACHE, lage({ leben: 40, lebenVorher: 40 }), zufall);
        expect(new Set(zug.aktionen.map((a) => a.id)).size).toBe(zug.aktionen.length);
      }
    });

    it('nennt im wütenden Spruch den Verlust', () => {
      const zug = bossZug(
        STURMDRACHE,
        lage({ leben: 110, lebenVorher: 150 }),
        () => 0, // erster Spruch
      );
      expect(zug.stimmung).toBe('wuetend');
      expect(zug.spruch).toContain('40');
    });
  });
});
