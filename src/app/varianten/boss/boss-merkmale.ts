import { Zufall } from '../../core/zufall';
import {
  BossDefinition,
  DienerVorlage,
  FrageId,
  Lage,
  Merkmal,
  MerkmalStand,
  MerkmalZug,
} from './boss-modell';

/**
 * Die Merkmale der Bosse: was jeder anders macht als alle anderen. Reine Funktionen wie die
 * übrige Boss-Logik – der Stand liegt im Spielstand, die App zeigt ihn an.
 */

function phaseVon(leben: number, max: number): 1 | 2 | 3 {
  if (leben <= Math.floor(max * 0.3)) return 3;
  if (leben <= Math.floor(max * 0.6)) return 2;
  return 1;
}

export function merkmalStarten(boss: BossDefinition): MerkmalStand | undefined {
  const m = boss.merkmal;
  if (!m) return undefined;
  switch (m.art) {
    case 'koerper':
      return {
        wert: m.weltende ?? 0,
        teile: verteilen(
          boss.leben,
          m.teile.map((t) => t.anteil),
        ).map((leben, i) => ({
          id: m.teile[i].id,
          leben,
          max: leben,
        })),
        wiederkehr: null,
      };
    case 'flug':
      return { wert: 0, zustand: 'himmel', zuege: m.himmel };
    case 'brut':
      return { wert: 0, eier: [], naechstesEi: 1 };
    case 'zeitschleife':
      return { wert: 0, verlauf: [] };
    case 'pakte':
      return { wert: 0, offen: [], stufen: 0 };
    default:
      return { wert: 0 };
  }
}

/** Teilt Leben nach Anteilen auf, sodass die Summe genau stimmt. */
function verteilen(gesamt: number, anteile: number[]): number[] {
  const summe = anteile.reduce((s, a) => s + a, 0);
  const teile = anteile.map((a) => Math.floor((gesamt * a) / summe));
  teile[teile.length - 1] += gesamt - teile.reduce((s, t) => s + t, 0);
  return teile;
}

/** Eine Frage, die der Boss wegen seines Merkmals in diesem Zug stellen muss. */
export function pflichtFrage(boss: BossDefinition, lage: Lage): FrageId | null {
  const m = boss.merkmal;
  if (m?.art === 'totenarmee') return 'gestorben';
  if (m?.art === 'hunger' && (lage.merkmal?.wert ?? 0) + 1 >= m.max) return 'beute';
  return null;
}

/**
 * Schaden, der wegen des Merkmals anders ankommt: im Nebel halbiert, ausgehungert doppelt,
 * beim gelandeten Drachen doppelt.
 */
export function schadenNachMerkmal(
  boss: BossDefinition,
  m: MerkmalStand | undefined,
  schaden: number,
): number {
  const regel = boss.merkmal;
  if (!regel || !m || schaden <= 0) return schaden;
  if (regel.art === 'nebel' && m.wert >= regel.halbierenAb) return Math.ceil(schaden / 2);
  if (regel.art === 'hunger' && m.zustand === 'ausgehungert') return schaden * 2;
  if (regel.art === 'flug' && m.zustand === 'boden') return schaden * 2;
  return schaden;
}

export interface MerkmalErgebnis {
  zug: MerkmalZug;
  lebenAenderungen: { spielerId: number; um: number }[];
  heilung: number;
  schutz: number;
  diener: DienerVorlage[];
  dienerBonus: { staerke: number; widerstand: number };
  /** So oft handelt der Boss zusätzlich (z. B. solange Morwens Spiegelbild steht). */
  extraAktionen: number;
  ankuendigung: string | null;
}

/** Was das Merkmal in einem Boss-Zug tut. Läuft vor seinen Aktionen. */
export function merkmalZug(
  boss: BossDefinition,
  lage: Lage,
  zufall: Zufall,
): MerkmalErgebnis | null {
  const regel = boss.merkmal;
  if (!regel) return null;
  const alt = lage.merkmal ?? merkmalStarten(boss)!;
  const e: MerkmalErgebnis = {
    zug: { stand: { ...alt }, texte: [], wirkungen: [], wiederbelebung: 0, dienerFressen: 0 },
    lebenAenderungen: [],
    heilung: 0,
    schutz: 0,
    diener: [],
    dienerBonus: { staerke: 0, widerstand: 0 },
    extraAktionen: 0,
    ankuendigung: null,
  };
  const s = e.zug.stand;
  const alleVerlieren = (menge: number) => {
    for (const sp of lage.spieler) e.lebenAenderungen.push({ spielerId: sp.id, um: -menge });
  };
  const vorlage = (name: string): DienerVorlage =>
    boss.diener.find((d) => d.name === name) ?? boss.diener[0];

  switch (regel.art) {
    case 'koerper': {
      const teile = (alt.teile ?? []).map((t) => ({ ...t }));
      s.teile = teile;
      const kehrt = alt.wiederkehr;
      if (kehrt) {
        const zuege = kehrt.zuege - 1;
        const teil = teile.find((t) => t.id === kehrt.id);
        const lebt = teile.some((t) => t.id !== kehrt.id && t.leben > 0);
        if (teil && lebt && zuege <= 0 && regel.wiederkehr) {
          teil.leben = Math.round(teil.max * regel.wiederkehr.anteil);
          e.zug.wiederbelebung = teil.leben;
          s.wiederkehr = null;
          e.zug.texte.push(`${teilName(regel, teil.id)} kehrt zurück (${teil.leben} Leben)!`);
        } else {
          s.wiederkehr = { id: kehrt.id, zuege };
          if (zuege === 1) {
            e.ankuendigung = `${teilName(regel, kehrt.id)} kehrt im nächsten Zug zurück – besiegt die andere Gestalt vorher!`;
          }
        }
      }
      for (const t of regel.teile) {
        const lebt = (teile.find((x) => x.id === t.id)?.leben ?? 0) > 0;
        if (!lebt) continue;
        if (t.extraAktion) e.extraAktionen++;
        if (t.heilung) {
          e.heilung += t.heilung;
          e.zug.texte.push(`${t.name}: Der Boss erhält ${t.heilung} Leben.`);
        }
        if (t.schaden) {
          alleVerlieren(t.schaden);
          e.zug.texte.push(`${t.name}: Jeder Spieler verliert ${t.schaden} Leben.`);
        }
      }
      if (regel.weltende) {
        s.wert = alt.wert - 1;
        if (s.wert <= 0) {
          alleVerlieren(999);
          e.zug.texte.push('Das Weltende ist gekommen. Alles Leben erlischt.');
        } else if (s.wert <= 3) {
          e.ankuendigung ??= `Weltende in ${s.wert} ${s.wert === 1 ? 'Zug' : 'Zügen'}!`;
        }
      }
      break;
    }

    case 'nebel': {
      s.wert = alt.wert + 1;
      if (s.wert >= regel.max) {
        alleVerlieren(regel.hinterhalt);
        e.zug.texte.push(
          `Hinterhalt aus dem Nebel: Jeder Spieler verliert ${regel.hinterhalt} Leben.`,
        );
        s.wert = 0;
      } else {
        e.zug.texte.push(`Der Nebel wird dichter (${s.wert}/${regel.max}).`);
        if (s.wert === regel.max - 1) {
          e.ankuendigung = 'Im nächsten Zug folgt ein Hinterhalt aus dem Nebel – vertreibt ihn!';
        }
      }
      break;
    }

    case 'hunger': {
      s.wert = Math.min(regel.max, alt.wert + 1);
      if (s.wert >= regel.max) {
        if (lage.antworten.beute === 'ja') {
          e.zug.wirkungen.push(
            'Gorvak frisst die Kreatur der Spieler mit der höchsten Stärke: Zerstöre sie.',
          );
        } else if (lage.diener > 0) {
          e.zug.dienerFressen = 1;
          e.zug.texte.push('Gorvak frisst seinen stärksten Diener.');
        }
        if (lage.antworten.beute === 'ja' || lage.diener > 0) {
          e.heilung += regel.heilung;
          e.zug.texte.push(`Satt: Er erhält ${regel.heilung} Leben.`);
          s.wert = 0;
          s.zustand = 'satt';
        } else {
          s.zustand = 'ausgehungert';
          e.zug.texte.push(
            'Nichts zu fressen! Gorvak ist ausgehungert und erleidet doppelten Schaden, bis er wieder frisst.',
          );
        }
      } else {
        s.zustand = 'satt';
        if (s.wert === regel.max - 1) {
          e.ankuendigung =
            'Gorvak wird hungrig: Im nächsten Zug frisst er eure stärkste Kreatur (Stärke 4+) – oder einen eigenen Diener.';
        }
      }
      break;
    }

    case 'flug': {
      if (alt.zustand === 'boden') {
        s.zustand = 'himmel';
        s.zuege = regel.himmel;
        e.zug.texte.push('Der Drache steigt wieder in den Himmel auf.');
      } else {
        s.zuege = (alt.zuege ?? regel.himmel) - 1;
        if (s.zuege <= 0) {
          s.zustand = 'boden';
          e.zug.texte.push('Der Drache landet!');
          e.zug.wirkungen.push(
            `Feueratem: Jede Kreatur der Spieler erhält ${regel.feueratem} Schaden.`,
          );
        } else if (s.zuege === 1) {
          e.ankuendigung =
            'Der Drache setzt zur Landung an – in der nächsten Runde ist er am Boden.';
        }
      }
      break;
    }

    case 'totenarmee': {
      const n = Math.min(regel.max, Number.parseInt(lage.antworten.gestorben ?? '0', 10) || 0);
      for (let i = 0; i < n; i++) e.diener.push(vorlage(regel.dienerName));
      if (n) e.zug.texte.push(`${n} eurer Toten ${n === 1 ? 'erhebt' : 'erheben'} sich für ihn.`);
      break;
    }

    case 'brut': {
      const eier = alt.eier ?? [];
      const geschluepft = eier.filter((ei) => ei.countdown <= 1);
      for (let i = 0; i < geschluepft.length * regel.drohnen; i++) {
        e.diener.push(vorlage(regel.dienerName));
      }
      let nr = alt.naechstesEi ?? 1;
      const neu = Array.from({ length: phaseVon(lage.leben, lage.maxLeben) === 3 ? 2 : 1 }, () => ({
        nr: nr++,
        countdown: regel.schluepfen,
      }));
      s.eier = [
        ...eier
          .filter((ei) => ei.countdown > 1)
          .map((ei) => ({ ...ei, countdown: ei.countdown - 1 })),
        ...neu,
      ];
      s.naechstesEi = nr;
      if (geschluepft.length) {
        e.zug.texte.push(
          `${geschluepft.length === 1 ? 'Ein Ei schlüpft' : `${geschluepft.length} Eier schlüpfen`}: ${geschluepft.length * regel.drohnen} Drohnen.`,
        );
      }
      e.zug.texte.push(`Sie legt ${neu.length === 1 ? 'ein Ei' : `${neu.length} Eier`}.`);
      const schild = Math.min(regel.schildMax, lage.diener + e.diener.length);
      if (schild) {
        e.schutz += schild;
        e.zug.texte.push(`Schwarmschild: Sie verhindert die nächsten ${schild} Schaden.`);
      }
      break;
    }

    case 'hitze': {
      const erlitten = Math.max(0, lage.lebenVorher - lage.leben);
      const kuehlung = Math.floor(erlitten / regel.schadenProKuehlung);
      let wert = Math.max(0, alt.wert - kuehlung);
      if (kuehlung) e.zug.texte.push(`Euer Angriff kühlt ihn um ${kuehlung} ab.`);
      if (wert >= regel.ausbruchAb) {
        alleVerlieren(regel.ausbruch);
        e.zug.texte.push(`Ausbruch! Jeder Spieler verliert ${regel.ausbruch} Leben.`);
        e.zug.wirkungen.push(`Ausbruch: Jede Kreatur erhält ${regel.ausbruch} Schaden.`);
        wert = 0;
      } else {
        wert = Math.min(regel.ausbruchAb, wert + regel.proZug);
        e.zug.texte.push(`Seine Hitze steigt (${wert}/${regel.ausbruchAb}).`);
        if (wert >= regel.ausbruchAb) {
          e.ankuendigung = `Ausbruch im nächsten Zug! Kühlt ihn ab: je ${regel.schadenProKuehlung} Schaden −1 Hitze.`;
        }
      }
      s.wert = wert;
      break;
    }

    case 'zeitschleife': {
      const verlauf = [...(alt.verlauf ?? []), lage.leben].slice(-(regel.zurueck + 2));
      s.verlauf = verlauf;
      s.wert = alt.wert + 1;
      const schwelle = Math.ceil(lage.maxLeben * regel.reissenAnteil);
      if (s.wert % regel.alle === 0) {
        const erlitten = Math.max(0, lage.lebenVorher - lage.leben);
        const ziel = verlauf[verlauf.length - 1 - regel.zurueck];
        if (erlitten >= schwelle) {
          e.zug.texte.push(
            `Die Zeitschleife reißt! ${erlitten} Schaden lassen sich nicht zurückdrehen.`,
          );
        } else if (ziel !== undefined && ziel > lage.leben) {
          e.heilung += ziel - lage.leben;
          e.zug.texte.push(`Er spult die Zeit zurück: Seine Leben springen auf ${ziel}.`);
        }
      } else if ((s.wert + 1) % regel.alle === 0) {
        e.ankuendigung = `Im nächsten Zug spult er zurück – macht in einer Runde ${schwelle} Schaden, um die Schleife zu reißen!`;
      }
      break;
    }

    case 'pakte': {
      const gemischt = [...regel.pakte].sort(() => zufall() - 0.5);
      s.offen = lage.spieler
        .filter((sp) => sp.leben > 0)
        .map((sp, i) => ({ spielerId: sp.id, pakt: gemischt[i % gemischt.length].id }));
      if (s.offen.length) e.zug.texte.push('Er bietet euch einen Pakt an …');
      break;
    }
  }
  return e;
}

function teilName(regel: Merkmal & { art: 'koerper' }, id: string): string {
  return regel.teile.find((t) => t.id === id)?.name ?? id;
}

/** Für die Anzeige auf der Boss-Karte: alles Wichtige auf einen Blick. */
export interface MerkmalAnzeige {
  name: string;
  text: string;
  leiste?: { name: string; wert: number; max: number; gefahr: boolean; hinweis: string };
  zustand?: { text: string; gefahr: boolean };
  teile?: {
    id: string;
    name: string;
    leben: number;
    max: number;
    wirkung: string;
    haupt: boolean;
    wiederkehr: number | null;
  }[];
  eier?: { nr: number; countdown: number }[];
  /** Ein Knopf für die Spieler, z. B. „Nebel vertreiben“. */
  aktion?: string;
  /** Die genauen Leben bleiben verborgen (Nebel). */
  lebenVerborgen?: boolean;
}

export function merkmalAnzeige(
  boss: BossDefinition,
  m: MerkmalStand | undefined,
  maxLeben: number,
): MerkmalAnzeige | null {
  const regel = boss.merkmal;
  if (!regel || !m) return null;
  const basis = { name: regel.name, text: regel.text };
  switch (regel.art) {
    case 'koerper':
      return {
        ...basis,
        teile: regel.teile.map((t) => {
          const x = m.teile?.find((y) => y.id === t.id);
          return {
            id: t.id,
            name: t.name,
            leben: x?.leben ?? 0,
            max: x?.max ?? 0,
            wirkung: t.wirkung,
            haupt: !!t.haupt,
            wiederkehr: m.wiederkehr?.id === t.id ? m.wiederkehr.zuege : null,
          };
        }),
        leiste: regel.weltende
          ? {
              name: 'Weltende',
              wert: m.wert,
              max: regel.weltende,
              gefahr: m.wert <= 3,
              hinweis: `noch ${m.wert} Boss-Züge`,
            }
          : undefined,
      };
    case 'nebel':
      return {
        ...basis,
        leiste: {
          name: 'Nebel',
          wert: m.wert,
          max: regel.max,
          gefahr: m.wert >= regel.halbierenAb,
          hinweis:
            m.wert >= regel.halbierenAb
              ? 'Schaden an ihr wird halbiert'
              : 'Bei 3 halbiert sich euer Schaden',
        },
        aktion: m.wert > 0 ? 'Nebel vertreiben' : undefined,
        lebenVerborgen: m.wert >= regel.halbierenAb,
      };
    case 'hunger':
      return {
        ...basis,
        leiste: {
          name: 'Hunger',
          wert: m.wert,
          max: regel.max,
          gefahr: m.wert >= regel.max - 1,
          hinweis:
            m.wert >= regel.max - 1 ? 'frisst im nächsten Zug' : 'frisst, wenn die Leiste voll ist',
        },
        zustand:
          m.zustand === 'ausgehungert'
            ? { text: 'Ausgehungert: erleidet doppelten Schaden', gefahr: false }
            : undefined,
      };
    case 'flug':
      return {
        ...basis,
        zustand:
          m.zustand === 'boden'
            ? { text: 'Am Boden – er erleidet doppelten Schaden', gefahr: false }
            : {
                text:
                  (m.zuege ?? 0) <= 1
                    ? 'Am Himmel – landet im nächsten Zug'
                    : 'Am Himmel – Kampfschaden ohne Flugfähigkeit halbiert',
                gefahr: true,
              },
      };
    case 'totenarmee':
      return { ...basis };
    case 'brut':
      return { ...basis, eier: m.eier ?? [] };
    case 'hitze':
      return {
        ...basis,
        leiste: {
          name: 'Hitze',
          wert: m.wert,
          max: regel.ausbruchAb,
          gefahr: m.wert >= regel.ausbruchAb - regel.proZug,
          hinweis: `je ${regel.schadenProKuehlung} Schaden in einer Runde −1`,
        },
      };
    case 'zeitschleife': {
      const bis = regel.alle - (m.wert % regel.alle);
      return {
        ...basis,
        zustand: {
          text:
            bis === 1
              ? `Spult im nächsten Zug zurück – ${Math.ceil(maxLeben * regel.reissenAnteil)} Schaden in einer Runde reißen die Schleife`
              : `Spult in ${bis} Zügen zurück`,
          gefahr: bis === 1,
        },
      };
    }
    case 'pakte':
      return {
        ...basis,
        leiste: {
          name: 'Seelen',
          wert: m.wert,
          max: Math.max(regel.stufe * 3, m.wert),
          gefahr: m.wert >= regel.stufe * 2,
          hinweis: `je ${regel.stufe} Seelen werden seine Diener stärker`,
        },
      };
  }
}
