/**
 * Simuliert Bosskämpfe „2 gegen Boss“ mit der echten Boss-Logik der App (Fragen, Stimmungen,
 * Aktionen, Diener, Phasen-Schild) und vereinfachten Spielerzügen nach Commander-Regeln.
 *
 *   node scripts/simulation/start.mjs            → Tabelle über alle Bosse und Deck-Paarungen
 *   node scripts/simulation/start.mjs beispiel   → eine Partie Zug für Zug
 *   SIM_PLANER=taktiker node scripts/simulation/start.mjs   → mit vorausdenkendem Boss
 */
import { zufallMitStartwert, Zufall } from '../../src/app/core/zufall';
import { bossZug, fragenFuerZug, phase } from '../../src/app/varianten/boss/boss-logik';
import { Antworten, BossDefinition, Planerstufe } from '../../src/app/varianten/boss/boss-modell';
import {
  bossLage,
  bossStarten,
  BossStand,
  bossTreffen,
  bossZugEintragen,
  dienerBesiegen,
  eiZerschlagen,
  nebelVertreiben,
  paktEntscheiden,
  reliktTreffen,
  reliktZerstoeren,
  schildAufheben,
} from '../../src/app/varianten/boss/boss-stand';
import { BOSSE } from '../../src/app/varianten/boss/bosse';
import { DeckProfil, JACE, PRECONS, STRIXHAVEN } from './decks';

const MAX_RUNDEN = 25;
const KOMMANDEUR_IST_WALKER = new Set(['Jace', 'Lorehold']);

interface Kreatur {
  staerke: number;
  widerstand: number;
  flieger: boolean;
  getappt: boolean;
  /** Frisch gewirkt: darf in diesem Zug nicht angreifen. */
  neu: boolean;
  /** Durch eine Boss-Aktion bis zum nächsten eigenen Zug am Angreifen gehindert. */
  gebannt: boolean;
  /** Spielsteine zählen beim Knochenfürsten nicht als gestorbene Kreaturen. */
  spielstein?: boolean;
}

interface Spieler {
  id: number;
  name: string;
  deck: DeckProfil;
  leben: number;
  laender: number;
  steine: number;
  kreaturen: Kreatur[];
  bleibende: number;
  friedhof: number;
  kommandeur: boolean;
  hand: number;
  /** Die Kreatur des Kommandeurs, falls er eine ist und gerade liegt. */
  kommandeurKreatur?: Kreatur;
  /** Höchstzahl Angreifer im nächsten eigenen Zug (Nebelbank). */
  maxAngreifer?: number;
  /** Malus aus Boss-Aktionen für den nächsten eigenen Zug. */
  malusStaerke: number;
  malusMana: number;
  /** Kreaturen (keine Spielsteine), die seit dem letzten Boss-Zug gestorben sind. */
  gestorben: number;
}

export interface Ergebnis {
  sieg: boolean;
  runden: number;
  maxPhase: number;
  /** Runden, in denen die Spieler mehr als 30 % der Boss-Leben auf einmal abgezogen haben. */
  burstRunden: number;
  verfallen: number;
  lebenUebrig: number;
  toteSpieler: number;
}

type Log = (zeile: string) => void;

/** Messwerte für die Analyse: woher der Schaden kommt und wie viele Kreaturen der Boss entfernt. */
export const MESSUNG = {
  aktionsSchaden: 0,
  dienerSchaden: 0,
  kreaturenWeg: 0,
  dienerAmEnde: 0,
  partien: 0,
  relikteGelegt: 0,
  relikteZerstoert: 0,
};

/** Liegende Karte des Bosses mit diesem Text? (für Wirkungen, die nur im Text stehen) */
function reliktMitText(stand: BossStand, def: BossDefinition, muster: RegExp): boolean {
  return stand.relikte.some((l) => muster.test(def.relikte.find((r) => r.id === l.id)?.text ?? ''));
}

/**
 * Welche Karte des Bosses die Spieler gerade angehen: eine, deren Countdown bald abläuft, das
 * Phylakterium, wenn der Boss fast tot ist, sonst die mit der wenigsten restlichen
 * Verteidigung – aber nur, wenn der mögliche Schaden reicht, um sie zu zerstören.
 */
function belagerungsZiel(
  stand: BossStand,
  def: BossDefinition,
  schaden: number,
): { id: string; rest: number } | null {
  const kandidaten = stand.relikte.flatMap((l) => {
    const r = def.relikte.find((x) => x.id === l.id);
    if (!r) return [];
    const rest = r.verteidigung - l.schaden;
    const dringend =
      (l.countdown !== undefined && l.countdown <= 2) ||
      (r.unsterblich && stand.leben <= stand.maxLeben * 0.3);
    return dringend || rest <= schaden ? [{ id: r.id, rest, dringend }] : [];
  });
  kandidaten.sort((a, b) => Number(b.dringend) - Number(a.dringend) || a.rest - b.rest);
  return kandidaten[0] ?? null;
}

function zahlwort(text: string): number {
  if (/\bdrei\b/.test(text)) return 3;
  if (/\bzwei\b/.test(text)) return 2;
  return 1;
}

function lebend(spieler: Spieler[]): Spieler[] {
  return spieler.filter((s) => s.leben > 0);
}

function staerkste(spieler: Spieler[]): { s: Spieler; k: Kreatur } | null {
  let best: { s: Spieler; k: Kreatur } | null = null;
  for (const s of lebend(spieler)) {
    for (const k of s.kreaturen) if (!best || k.staerke > best.k.staerke) best = { s, k };
  }
  return best;
}

function entfernen(s: Spieler, k: Kreatur): void {
  s.kreaturen = s.kreaturen.filter((x) => x !== k);
  if (s.kommandeurKreatur === k) {
    // Der Kommandeur geht in die Kommandozone und wird später neu gewirkt.
    s.kommandeur = false;
    s.kommandeurKreatur = undefined;
  } else {
    s.friedhof++;
    if (!k.spielstein) s.gestorben++;
  }
}

function staerksteVon(s: Spieler): Kreatur | undefined {
  return [...s.kreaturen].sort((x, y) => y.staerke - x.staerke)[0];
}

function dienerFliegt(faehigkeit?: string): boolean {
  return !!faehigkeit && /flugfähigkeit/i.test(faehigkeit);
}

/** Beantwortet die Boss-Fragen so, wie es die Spieler am Tisch täten. */
function antworten(
  fragen: { id: string }[],
  spieler: Spieler[],
  schaden: Map<number, number>,
): Antworten {
  const alle = lebend(spieler);
  const kreaturen = alle.flatMap((s) => s.kreaturen);
  const a: Antworten = {};
  for (const f of fragen) {
    switch (f.id) {
      case 'kreaturen': {
        const n = kreaturen.length;
        a.kreaturen = n <= 2 ? '0-2' : n <= 5 ? '3-5' : n <= 9 ? '6-9' : '10+';
        break;
      }
      case 'grosseKreatur':
        a.grosseKreatur = kreaturen.some((k) => k.staerke >= 6) ? 'ja' : 'nein';
        break;
      case 'flieger':
        a.flieger = kreaturen.some((k) => k.flieger) ? 'ja' : 'nein';
        break;
      case 'bleibende': {
        const n = alle.reduce((x, s) => x + s.bleibende, 0);
        a.bleibende = n <= 1 ? 'wenige' : n <= 4 ? 'einige' : 'viele';
        break;
      }
      case 'friedhof': {
        const n = alle.reduce((x, s) => x + s.friedhof, 0);
        a.friedhof = n <= 2 ? 'wenige' : n <= 6 ? 'einige' : 'viele';
        break;
      }
      case 'kommandeur':
        a.kommandeur = alle.some((s) => s.kommandeur && !KOMMANDEUR_IST_WALKER.has(s.deck.kurz))
          ? 'ja'
          : 'nein';
        break;
      case 'handkarten': {
        const [x, y] = alle;
        a.handkarten = !y || x.hand === y.hand ? 'gleich' : String(x.hand > y.hand ? x.id : y.id);
        break;
      }
      case 'beute':
        a.beute = kreaturen.some((k) => k.staerke >= 4) ? 'ja' : 'nein';
        break;
      case 'gestorben': {
        const n = alle.reduce((x, s) => x + s.gestorben, 0);
        a.gestorben = String(Math.min(3, n));
        break;
      }
      case 'rache': {
        const [id, menge] = [...schaden].sort((x, y) => y[1] - x[1])[0] ?? [0, 0];
        a.rache = menge > 0 ? String(id) : 'niemand';
        break;
      }
    }
  }
  return a;
}

/** Setzt die Wirkung einer Boss-Aktion um, die nur im Text steht (Kreaturen zerstören, tappen …). */
export function textWirkung(text: string, spieler: Spieler[], log: Log): void {
  const t = text.toLowerCase();
  const alle = lebend(spieler);
  const lebenAusText = () => Number(/verliert[^.]*?(\d+) leben/.exec(t)?.[1] ?? 0);
  const jederVerliert = () => alle.forEach((s) => (s.leben -= lebenAusText()));

  // Schaden an Kommandeuren
  const kommandeurSchaden = /kommandeur[^.]*erhält (\d+) schaden/.exec(t);
  if (kommandeurSchaden) {
    const menge = Number(kommandeurSchaden[1]);
    const mitKommandeur = alle.filter((s) => s.kommandeur);
    if (!mitKommandeur.length) jederVerliert();
    const ziele = /jeder kommandeur/.test(t) ? mitKommandeur : mitKommandeur.slice(0, 1);
    for (const s of ziele) {
      if (s.kommandeurKreatur) {
        if (s.kommandeurKreatur.widerstand <= menge) entfernen(s, s.kommandeurKreatur);
      } else s.kommandeur = false; // Planeswalker verliert seine Loyalität
    }
    log('   → Ein Kommandeur wird getroffen.');
    return;
  }
  if (/kommandeur[^.]*kehrt[^.]*kommandozone/.test(t)) {
    const mitKommandeur = alle.filter((s) => s.kommandeur);
    if (!mitKommandeur.length) jederVerliert();
    for (const s of mitKommandeur) {
      if (s.kommandeurKreatur) entfernen(s, s.kommandeurKreatur);
      else s.kommandeur = false;
    }
    log('   → Die Kommandeure kehren in die Kommandozone zurück.');
    return;
  }
  // Schaden an Kreaturen
  const kreaturSchaden = /kreatur[^.]*erhält (\d+) schaden/.exec(t);
  if (kreaturSchaden) {
    const menge = Number(kreaturSchaden[1]);
    if (/höchsten stärke/.test(t)) {
      const z = staerkste(spieler);
      if (z && z.k.widerstand <= menge) entfernen(z.s, z.k);
    } else {
      const nurFlieger = /mit flugfähigkeit/.test(t);
      if (nurFlieger && !alle.some((s) => s.kreaturen.some((k) => k.flieger))) jederVerliert();
      for (const s of alle)
        s.kreaturen
          .filter((k) => (!nurFlieger || k.flieger) && k.widerstand <= menge)
          .forEach((k) => entfernen(s, k));
    }
    log(`   → ${menge} Schaden an Kreaturen der Spieler.`);
    return;
  }
  const marken = /(zwei|drei|\d+) −1\/−1-marken/.exec(t);
  if (marken) {
    const n = zahlwort(t);
    const z = staerkste(spieler);
    if (z) {
      z.k.staerke -= n;
      z.k.widerstand -= n;
      if (z.k.widerstand <= 0) entfernen(z.s, z.k);
    }
    log('   → Die stärkste Kreatur bekommt −1/−1-Marken.');
    return;
  }
  if (
    /stärkste kreatur der spieler|höchsten stärke/.test(t) &&
    /(−\d+\/−0|weder angreifen noch blocken)/.test(t)
  ) {
    const z = staerkste(spieler);
    if (z) z.k.gebannt = true;
    log('   → Die stärkste Kreatur der Spieler ist ausgeschaltet.');
    return;
  }
  if (/spiegelt die stärkste kreatur/.test(t)) {
    const z = staerkste(spieler);
    if (z) z.s.leben -= Math.min(5, z.k.staerke);
    else jederVerliert();
    log('   → Spiegelschaden.');
    return;
  }
  if (/höchstens zwei kreaturen angreifen/.test(t)) {
    for (const s of alle) s.maxAngreifer = 2;
    log('   → Höchstens zwei Angreifer pro Spieler.');
    return;
  }
  if (/kostet[^.]*mana mehr/.test(t)) {
    for (const s of alle) s.malusMana += 2;
    log('   → Sprüche kosten mehr.');
    return;
  }
  if (/bleibende karte, die kein land ist/.test(t)) {
    for (const s of alle) {
      if (s.bleibende > 0) {
        s.bleibende--;
        if (s.steine > 0) s.steine--;
      } else {
        const k = [...s.kreaturen].sort((x, y) => x.staerke - y.staerke)[0];
        if (k) entfernen(s, k);
        else s.leben -= lebenAusText();
      }
    }
    log('   → Jeder Spieler opfert eine bleibende Karte.');
    return;
  }
  if (/friedhof[^.]*ins exil|friedhofs ins exil/.test(t)) {
    for (const s of alle) {
      if (s.friedhof > 0) s.friedhof = 0;
      else s.leben -= lebenAusText();
      if (/karte aus seiner hand/.test(t)) s.hand = Math.max(0, s.hand - 1);
    }
    log('   → Friedhöfe ins Exil.');
    return;
  }

  if (
    /(zerstör|ins exil|opfer|auf die hand|kehrt)/.test(t) &&
    /kreatur/.test(t) &&
    !/kommandeur/.test(t)
  ) {
    if (/jeder spieler opfert|jeder gegner wählt|jeder spieler wählt/.test(t)) {
      for (const s of alle) {
        const kleinste = [...s.kreaturen].sort((x, y) => x.staerke - y.staerke)[0];
        if (kleinste) entfernen(s, kleinste);
        else s.leben -= lebenAusText();
      }
      log('   → Jeder Spieler verliert eine Kreatur.');
      return;
    }
    const grenze = /(manawert|stärke) (\d+) oder weniger/.exec(t);
    if (/alle kreaturen/.test(t)) {
      let n = 0;
      for (const s of alle) {
        const weg = s.kreaturen.filter((k) => !grenze || k.staerke <= Number(grenze[2]));
        weg.forEach((k) => entfernen(s, k));
        n += weg.length;
      }
      log(`   → ${n} Kreaturen der Spieler sind weg.`);
      return;
    }
    const anzahl = zahlwort(t);
    let entfernt = 0;
    for (let i = 0; i < anzahl; i++) {
      const z = staerkste(spieler);
      if (!z) break;
      entfernen(z.s, z.k);
      entfernt++;
    }
    if (entfernt < anzahl) {
      const opfer = [...alle].sort((x, y) => y.leben - x.leben)[0];
      if (opfer) opfer.leben -= lebenAusText() * (anzahl - entfernt);
    }
    log(`   → ${entfernt} starke Kreatur(en) der Spieler entfernt.`);
    return;
  }
  if (/tappe/.test(t)) {
    const grenze = /(stärke|manawert) (\d+) oder weniger/.exec(t);
    if (grenze) {
      for (const s of alle)
        s.kreaturen
          .filter((k) => k.staerke <= Number(grenze[2]))
          .forEach((k) => (k.gebannt = true));
    } else {
      for (let i = 0; i < zahlwort(t); i++) {
        const z = alle
          .flatMap((s) => s.kreaturen)
          .filter((k) => !k.gebannt)
          .sort((x, y) => y.staerke - x.staerke)[0];
        if (z) z.gebannt = true;
      }
    }
    log('   → Kreaturen der Spieler sind getappt.');
    return;
  }
  const malus = /−(\d+)\/−(\d+)/.exec(t);
  if (malus && /kreaturen der spieler|alle kreaturen der spieler/.test(t)) {
    const [, m, w] = malus.map(Number);
    for (const s of alle) {
      s.malusStaerke += m;
      const tot = s.kreaturen.filter((k) => k.widerstand <= w);
      tot.forEach((k) => entfernen(s, k));
    }
    log(`   → Alle Kreaturen der Spieler −${m}/−${w}.`);
    return;
  }
  if (/(artefakt|verzauberung)/.test(t) && /(opfer|zerstör|schmilzt|schmelz)/.test(t)) {
    for (const s of alle) {
      if (s.bleibende > 0) {
        s.bleibende--;
        if (s.steine > 0) s.steine--;
      } else s.leben -= lebenAusText();
    }
    log('   → Jeder Spieler verliert ein Artefakt oder eine Verzauberung.');
    return;
  }
  if (/(wirft|abwerfen|ablegen|mischt seine hand)/.test(t)) {
    const zwei = /zwei karten/.test(t) ? 2 : 1;
    // Bei „abwerfen oder Leben verlieren“ schonen Spieler mit kleiner Hand ihre Karten.
    const stattdessen = /oder verliert (\d+) leben/.exec(t);
    for (const s of alle) {
      if (stattdessen && s.hand <= 3 && s.leben > 15) s.leben -= Number(stattdessen[1]);
      else s.hand = Math.max(0, s.hand - zwei);
    }
    log('   → Handkarten verloren, der nächste Zug ist langsamer.');
    return;
  }
  if (/(kann|können)[^.]*nicht (angreifen|blocken)/.test(t)) {
    const z = staerkste(spieler);
    if (z) z.k.gebannt = true;
    log('   → Die stärkste Kreatur der Spieler ist ausgeschaltet.');
  }
}

/**
 * Hat der Boss mehrere Körper, wählen die Spieler ihr Ziel: den Kopf, sobald er fällt; sonst
 * zuerst, was den Boss stärker macht (Klauen, Spiegelbild), dann was ihn heilt (Kern).
 * Überzähliger Schaden geht an den nächsten Teil.
 */
function schadenVerteilen(
  stand: BossStand,
  schaden: number,
  def: BossDefinition,
): { stand: BossStand; verfallen: number } {
  const regel = def.merkmal;
  if (regel?.art !== 'koerper') {
    const { stand: nach, verfallen } = bossTreffen(stand, schaden, def);
    return { stand: nach, verfallen };
  }
  let rest = schaden;
  let verfallen = 0;
  while (rest > 0 && stand.leben > 0) {
    const teile = stand.merkmal?.teile?.filter((t) => t.leben > 0) ?? [];
    if (!teile.length) break;
    const haupt = teile.find((t) => regel.teile.find((x) => x.id === t.id)?.haupt);
    const wirkt = (id: string) => regel.teile.find((x) => x.id === id);
    const weltende = stand.merkmal?.wert ?? 99;
    // Den Kopf direkt angehen, wenn er in etwa zwei solchen Angriffen fällt.
    let ziel = haupt && haupt.leben <= rest * 2 ? haupt : undefined;
    // Was ihn öfter handeln lässt, zuerst; was nur Leben kostet, nur wenn es schnell fällt.
    ziel ??= teile.find((t) => wirkt(t.id)?.extraAktion);
    ziel ??= weltende > 6 ? teile.find((t) => wirkt(t.id)?.heilung) : undefined;
    ziel ??= teile.find((t) => wirkt(t.id)?.schaden && t.leben <= rest);
    ziel ??= haupt ?? [...teile].sort((a, b) => a.leben - b.leben)[0];
    const anteil = Math.min(rest, ziel.leben);
    const r = bossTreffen(stand, anteil, def, ziel.id);
    stand = r.stand;
    verfallen += r.verfallen;
    rest -= anteil;
    // Nur der Phasen-Schild schluckt alles Weitere; Schutz ist irgendwann aufgebraucht.
    if (stand.schild) {
      verfallen += rest;
      break;
    }
  }
  return { stand, verfallen };
}

function spielerZug(
  s: Spieler,
  partner: Spieler[],
  runde: number,
  stand: BossStand,
  def: BossDefinition,
  zufall: Zufall,
  log: Log,
): { stand: BossStand; schaden: number; verfallen: number } {
  const d = s.deck;
  // Enttappen
  s.kreaturen.forEach((k) => {
    k.getappt = false;
    k.neu = false;
  });
  // Ziehen und Land spielen (ab Zug 8 trifft man nicht mehr jedes Mal ein Land)
  s.hand += 1 + (zufall() < d.kartenziehen ? 1 : 0);
  if (s.hand > 0 && (runde <= 7 || zufall() < 0.4)) {
    s.laender++;
    s.hand--;
  }
  let mana = Math.max(0, s.laender + s.steine - s.malusMana);
  s.malusMana = 0;
  const notizen: string[] = [];
  const neueKreatur = (st: number, flieger = zufall() < d.flieger, spielstein = false) =>
    s.kreaturen.push({
      staerke: st,
      widerstand: st,
      flieger,
      getappt: false,
      neu: true,
      gebannt: false,
      spielstein,
    });

  // Kommandeur zuerst, sobald er bezahlbar ist
  if (!s.kommandeur && mana >= d.kommandeurMana) {
    s.kommandeur = true;
    mana -= d.kommandeurMana;
    if (!KOMMANDEUR_IST_WALKER.has(d.kurz)) {
      neueKreatur(d.kommandeurMana - 1, false);
      s.kommandeurKreatur = s.kreaturen[s.kreaturen.length - 1];
    }
    notizen.push('Kommandeur');
  }

  // Entfernung gegen ein Artefakt oder eine Verzauberung des Bosses
  if (stand.relikte.length && mana >= 2 && s.hand > 0 && zufall() < d.artefaktEntfernung) {
    const ziel = belagerungsZiel(stand, def, Infinity);
    if (ziel) {
      stand = reliktZerstoeren(stand, ziel.id);
      MESSUNG.relikteZerstoert++;
      mana -= 2;
      s.hand--;
      notizen.push(`zerstört ${def.relikte.find((r) => r.id === ziel.id)?.name}`);
    }
  }

  // Nebelkönigin: Wer Mana übrig hat, vertreibt dichten Nebel ({2} je Punkt).
  const nebel = def.merkmal?.art === 'nebel' ? def.merkmal : null;
  while (nebel && (stand.merkmal?.wert ?? 0) >= nebel.halbierenAb && mana >= 2) {
    stand = nebelVertreiben(stand);
    mana -= 2;
    notizen.push('vertreibt Nebel');
  }

  // Sprüche aus der Hand wirken, bis Mana oder Karten ausgehen
  let wipeGenutzt = false;
  while (mana >= 2 && s.hand > 0) {
    const r = zufall();
    const dienerMacht = stand.diener.reduce((x, k) => x + k.staerke, 0);
    const eigeneMacht = partner.reduce(
      (x, p) => x + p.kreaturen.reduce((y, k) => y + k.staerke, 0),
      0,
    );
    if (
      !wipeGenutzt &&
      mana >= 4 &&
      stand.diener.length >= 4 &&
      dienerMacht > eigeneMacht * 1.5 &&
      zufall() < d.wipe * 3
    ) {
      for (const p of partner) [...p.kreaturen].forEach((k) => entfernen(p, k));
      stand = { ...stand, diener: [] };
      mana -= 4;
      wipeGenutzt = true;
      notizen.push('Brettlöschung');
    } else if (runde <= 6 && r < d.ramp * 0.5 && mana <= 6) {
      s.steine++;
      s.bleibende++;
      mana -= 2;
      notizen.push('Ramp');
    } else if (stand.diener.length && r < d.ramp * 0.5 + d.entfernung) {
      const ziel = [...stand.diener].sort(
        (x, y) => y.staerke + y.widerstand - (x.staerke + x.widerstand),
      )[0];
      stand = dienerBesiegen(stand, ziel.nr);
      mana -= 2;
      notizen.push(`entfernt ${ziel.name}`);
    } else if (r < d.ramp * 0.5 + d.entfernung + d.kreaturAnteil) {
      const kosten = Math.min(mana, 2 + Math.floor(zufall() * 5));
      if (zufall() < d.spielsteine) {
        for (let i = 0; i < d.spielsteinAnzahl + Math.floor(kosten / 4); i++)
          neueKreatur(d.spielsteinGroesse, zufall() < d.flieger, true);
        notizen.push(`Spielsteine ${d.spielsteinGroesse}/${d.spielsteinGroesse}`);
      } else {
        const st = Math.max(1, Math.round(kosten * d.staerkeProMana));
        neueKreatur(st);
        notizen.push(`${st}/${st}`);
      }
      mana -= kosten;
    } else {
      // Kartenvorteil, Verzauberungen, Artefakte
      const kosten = Math.min(mana, 2 + Math.floor(zufall() * 3));
      mana -= kosten;
      if (zufall() < d.bleibende) s.bleibende++;
      else s.hand++;
      notizen.push('Unterstützung');
    }
    s.hand--;
  }
  s.friedhof += d.friedhof;
  // Blutaltar: Wer Leben erhalten würde, verliert es stattdessen.
  s.leben += reliktMitText(stand, def, /stattdessen gleich viele/)
    ? -d.lebensgewinn
    : d.lebensgewinn;
  if (reliktMitText(stand, def, /höchstens drei Kreaturen angreifen/)) {
    s.maxAngreifer = Math.min(s.maxAngreifer ?? Infinity, 3);
  }
  const sturm = reliktMitText(stand, def, /Diener[^.]*haben Flugfähigkeit/);

  // Angriff: einige Kreaturen bleiben als Blocker zurück
  const angreifendeDiener = stand.diener.filter((x) => !x.greiftNichtAn).length;
  const amHimmel = def.merkmal?.art === 'flug' && stand.merkmal?.zustand === 'himmel';
  const bereit = s.kreaturen.filter((k) => !k.neu && !k.getappt && !k.gebannt);
  const zurueck = Math.min(Math.ceil(angreifendeDiener / 2), Math.floor(bereit.length / 3));
  const angreifer = [...bereit]
    .sort((x, y) => y.staerke - x.staerke)
    .slice(0, Math.min(bereit.length - zurueck, s.maxAngreifer ?? Infinity));
  s.maxAngreifer = undefined;
  const bonus = s.kommandeur ? d.kommandeurBonus : 0;
  // Am Himmel kommt bei Kreaturen ohne Flugfähigkeit nur die Hälfte an.
  const staerke = (k: Kreatur) =>
    Math.max(0, k.staerke + bonus - s.malusStaerke) * (amHimmel && !k.flieger ? 0.5 : 1);
  let direkt = d.direkt + (s.kommandeur && KOMMANDEUR_IST_WALKER.has(d.kurz) ? 2 : 0);
  const moeglich = angreifer.reduce((x, k) => x + staerke(k), 0);

  // Wie bei einer Belagerung: Beim Deklarieren der Angreifer legen die Spieler fest, wer eine
  // Karte des Bosses angreift. Reicht der Angriff für den Sieg, geht alles auf den Boss – außer
  // das Phylakterium hält ihn am Leben.
  const siegMoeglich =
    moeglich + direkt >= stand.leben + stand.schutz &&
    !reliktMitText(stand, def, /nicht unter 1 Leben/);
  const ziel = siegMoeglich ? null : belagerungsZiel(stand, def, moeglich + direkt);
  const aufKarte = new Set<Kreatur>();

  // Schwarmkönigin: Eier, die bald schlüpfen, zuerst zerschlagen (2 Schaden je Ei).
  const aufEi = new Set<Kreatur>();
  for (const ei of [...(stand.merkmal?.eier ?? [])].sort((a, b) => a.countdown - b.countdown)) {
    const k = [...angreifer]
      .filter((x) => !aufEi.has(x) && staerke(x) >= 2)
      .sort((x, y) => staerke(x) - staerke(y))[0];
    if (!k) break;
    aufEi.add(k);
    k.getappt = true;
    stand = eiZerschlagen(stand, ei.nr);
    notizen.push('zerschlägt ein Ei');
  }
  // Flieger, die angreifen, vertreiben Nebel.
  if (nebel) {
    for (const k of angreifer) if (k.flieger && !aufEi.has(k)) stand = nebelVertreiben(stand);
  }
  if (ziel) {
    // Etwas mehr als nötig, weil Diener auch diese Angreifer blocken dürfen.
    let summe = 0;
    for (const k of angreifer) {
      if (summe >= ziel.rest * 1.3) break;
      aufKarte.add(k);
      summe += staerke(k);
    }
  }

  const blocker = stand.diener.filter((x) => !x.getappt);
  let schaden = 0;
  let karteSchaden = 0;
  let geblockt = 0;
  for (const k of angreifer) {
    if (aufEi.has(k)) continue;
    k.getappt = true;
    const st = staerke(k);
    // Diener blocken nur sinnvoll: wenn sie den Angreifer töten, überleben oder immer blocken müssen.
    const block = blocker.findIndex(
      (b) =>
        (!k.flieger ||
          sturm ||
          dienerFliegt(b.faehigkeit) ||
          /reichweite/i.test(b.faehigkeit ?? '')) &&
        (b.staerke >= k.widerstand ||
          b.widerstand > st ||
          /blockt immer/i.test(b.faehigkeit ?? '')),
    );
    if (block >= 0) {
      const b = blocker.splice(block, 1)[0];
      geblockt++;
      if (st >= b.widerstand) stand = dienerBesiegen(stand, b.nr);
      if (b.staerke >= k.widerstand) entfernen(s, k);
    } else if (aufKarte.has(k)) karteSchaden += st;
    else schaden += st;
  }
  s.malusStaerke = 0;
  s.kreaturen.forEach((k) => (k.gebannt = false));

  if (ziel) {
    // Sprüche, die „jedes Ziel“ treffen, dürfen den Rest der Verteidigung übernehmen.
    const rest = ziel.rest - karteSchaden;
    if (rest > 0 && rest <= direkt) {
      karteSchaden += rest;
      direkt -= rest;
    }
    if (karteSchaden > 0) {
      const vorher = stand.relikte.length;
      stand = reliktTreffen(stand, ziel.id, karteSchaden, def);
      if (stand.relikte.length < vorher) MESSUNG.relikteZerstoert++;
      const name = def.relikte.find((r) => r.id === ziel.id)?.name;
      notizen.push(
        `${aufKarte.size} greifen ${name} an (${Math.min(karteSchaden, ziel.rest)} Schaden)`,
      );
    }
  }
  schaden += direkt;

  const { stand: nach, verfallen } = schadenVerteilen(stand, schaden, def);
  log(
    `  ${s.name} (${d.kurz}, ${s.laender + s.steine} Mana): ${notizen.join(', ') || 'baut auf'}` +
      ` · greift mit ${angreifer.length} an (${geblockt} geblockt) → ${schaden - verfallen} Schaden` +
      (verfallen ? ` (${verfallen} am Phasen-Schild verfallen)` : '') +
      ` · Boss ${nach.leben}/${nach.maxLeben}`,
  );
  return { stand: schildAufheben(nach), schaden: schaden - verfallen, verfallen };
}

function bossRunde(
  def: BossDefinition,
  stand: BossStand,
  spieler: Spieler[],
  schadenRunde: Map<number, number>,
  zufall: Zufall,
  log: Log,
): BossStand {
  const alle = lebend(spieler);
  const sicht = alle.map((s) => ({ id: s.id, name: s.name, leben: Math.round(s.leben) }));
  const fragen = fragenFuerZug(def, bossLage(stand, sicht, {}), zufall);
  const antwort = antworten(fragen, spieler, schadenRunde);
  const zug = bossZug(def, bossLage(stand, sicht, antwort), zufall);
  const vorherNr = stand.naechsteNr;

  log(
    `  ${def.name} [${zug.stimmung}, Phase ${zug.phase}] fragt: ${fragen.map((f) => f.id).join(', ') || '–'}`,
  );
  log(`   „${zug.spruch}“`);
  if (process.env['SIM_DEBUG'])
    log(`   Δ ${JSON.stringify(zug.lebenAenderungen)} Rundeneffekt: ${zug.rundenEffekt}`);
  const lebenVorher = alle.reduce((x, s) => x + s.leben, 0);
  const kreaturenVorher = alle.reduce((x, s) => x + s.kreaturen.length, 0);
  for (const l of zug.lebenAenderungen) {
    const s = spieler.find((x) => x.id === l.spielerId);
    if (s) s.leben += l.um;
  }
  for (const a of zug.aktionen) {
    log(`   ⚡ ${a.name}: ${a.text}`);
    textWirkung(a.text, spieler, log);
  }
  for (const t of zug.merkmal?.texte ?? []) log(`   ★ ${t}`);
  for (const w of zug.merkmal?.wirkungen ?? []) {
    log(`   ★ ${w}`);
    textWirkung(w, spieler, log);
  }
  MESSUNG.aktionsSchaden += lebenVorher - alle.reduce((x, s) => x + s.leben, 0);
  MESSUNG.kreaturenWeg += kreaturenVorher - alle.reduce((x, s) => x + s.kreaturen.length, 0);
  if (zug.ankuendigung) log(`   ⚠ ${zug.ankuendigung}`);

  if (zug.neuesRelikt) {
    MESSUNG.relikteGelegt++;
    log(`   🜲 Neu: ${def.relikte.find((r) => r.id === zug.neuesRelikt?.id)?.name}`);
  }
  for (const e of zug.reliktEffekte) log(`   🜲 ${e}`);
  const sturm = reliktMitText(stand, def, /Diener[^.]*haben Flugfähigkeit/);

  let neu = bossZugEintragen(stand, zug, sicht, antwort);
  for (const s of spieler) s.gestorben = 0;
  // „Jede Kreatur“ trifft auch seine eigenen Diener.
  const ausbruch = (zug.merkmal?.wirkungen ?? [])
    .map((w) => /jede kreatur erhält (\d+) schaden/i.exec(w))
    .find((m) => m);
  if (ausbruch) {
    for (const d of neu.diener)
      if (d.widerstand <= Number(ausbruch[1])) neu = dienerBesiegen(neu, d.nr);
  }
  // Teufelspakte: Wer genug Leben hat, nimmt meist an – solange Azgaroth nicht zu viele Seelen hat.
  for (const o of neu.merkmal?.offen ?? []) {
    const s = spieler.find((x) => x.id === o.spielerId);
    if (!s) continue;
    const seelen = neu.merkmal?.wert ?? 0;
    const annehmen =
      (o.pakt === 'blut' && s.leben < 20) || (s.leben >= 15 && seelen < 6 && zufall() < 0.6);
    const r = paktEntscheiden(neu, o.spielerId, annehmen, def);
    neu = r.stand;
    if (!annehmen) continue;
    s.leben += r.leben;
    if (o.pakt === 'wissen') s.hand += 2;
    if (o.pakt === 'gold') s.malusMana -= 3;
    if (o.pakt === 'macht') s.malusStaerke -= 2;
    if (o.pakt === 'rueckkehr') s.hand += 1;
    if (o.pakt === 'zorn' && neu.diener.length) {
      const staerkster = [...neu.diener].sort((a, b) => b.staerke - a.staerke)[0];
      neu = dienerBesiegen(neu, staerkster.nr);
    }
    log(`   ☠ ${s.name} nimmt den Pakt „${o.pakt}“ an.`);
  }

  // Diener greifen an: wer schon da war oder Eile hat, außer reinen Blockern.
  const ziel = spieler.find((s) => s.id === zug.angriffsziel && s.leben > 0);
  const angreifer = neu.diener.filter((x) => !x.greiftNichtAn && (x.nr < vorherNr || x.eile));
  if (ziel && angreifer.length) {
    const blocker = ziel.kreaturen.filter((k) => !k.getappt);
    let durch = 0;
    for (const x of [...angreifer].sort((a, b) => b.staerke - a.staerke)) {
      const fliegt = sturm || dienerFliegt(x.faehigkeit);
      const i = blocker.findIndex(
        (k) =>
          (!fliegt || k.flieger) &&
          (k.staerke >= x.widerstand || k.widerstand > x.staerke || ziel.leben <= x.staerke * 2),
      );
      if (i >= 0) {
        const k = blocker.splice(i, 1)[0];
        if (k.staerke >= x.widerstand) neu = dienerBesiegen(neu, x.nr);
        if (x.staerke >= k.widerstand) entfernen(ziel, k);
      } else durch += x.staerke;
    }
    ziel.leben -= durch;
    MESSUNG.dienerSchaden += durch;
    log(`   ${angreifer.length} Diener greifen ${ziel.name} an → ${durch} Schaden durch.`);
  }
  log(
    `   Leben: ${alle.map((s) => `${s.name} ${Math.round(s.leben)}`).join(' · ')} · Diener: ${neu.diener.length}`,
  );
  return neu;
}

export function spiele(
  def: BossDefinition,
  decks: [DeckProfil, DeckProfil],
  seed: number,
  log: Log = () => {},
): Ergebnis {
  // Zum Vergleich: SIM_OHNE_MERKMAL=1 spielt die Bosse ohne ihr Merkmal.
  if (process.env['SIM_OHNE_MERKMAL']) def = { ...def, merkmal: undefined };
  const zufall = zufallMitStartwert(seed);
  const spieler: Spieler[] = decks.map((deck, i) => ({
    id: i + 1,
    name: `Spieler ${i + 1}`,
    deck,
    leben: 40,
    laender: 0,
    steine: 0,
    kreaturen: [],
    bleibende: 0,
    friedhof: 0,
    kommandeur: false,
    hand: 7,
    malusStaerke: 0,
    malusMana: 0,
    gestorben: 0,
  }));
  let stand = bossStarten(def, zufall, (process.env['SIM_PLANER'] as Planerstufe) ?? 'instinkt');
  let maxPhase = 1;
  let burstRunden = 0;
  let verfallenGesamt = 0;
  log(`${def.name} (Level ${def.level}, ${def.leben} Leben) – Laune: ${stand.temperament}`);

  for (let runde = 1; runde <= MAX_RUNDEN; runde++) {
    log(`\nRunde ${runde}`);
    const schadenRunde = new Map<number, number>();
    const lebenVorRunde = stand.leben;
    for (const s of lebend(spieler)) {
      const r = spielerZug(s, spieler, runde, stand, def, zufall, log);
      stand = r.stand;
      verfallenGesamt += r.verfallen;
      schadenRunde.set(s.id, r.schaden);
      maxPhase = Math.max(maxPhase, phase(stand.leben, stand.maxLeben));
      if (stand.leben <= 0) break;
    }
    if (lebenVorRunde - stand.leben > stand.maxLeben * 0.3) burstRunden++;
    if (stand.leben <= 0) {
      log(`\n→ Sieg in Runde ${runde}!`);
      return {
        sieg: true,
        runden: runde,
        maxPhase,
        burstRunden,
        verfallen: verfallenGesamt,
        lebenUebrig: lebend(spieler).reduce((x, s) => x + s.leben, 0),
        toteSpieler: 2 - lebend(spieler).length,
      };
    }
    if (!lebend(spieler).length) {
      log(`
→ Niederlage in Runde ${runde}.`);
      return {
        sieg: false,
        runden: runde,
        maxPhase,
        burstRunden,
        verfallen: verfallenGesamt,
        lebenUebrig: 0,
        toteSpieler: 2,
      };
    }
    stand = bossRunde(def, stand, spieler, schadenRunde, zufall, log);
    maxPhase = Math.max(maxPhase, phase(stand.leben, stand.maxLeben));
    if (!lebend(spieler).length) {
      log(`\n→ Niederlage in Runde ${runde}.`);
      return {
        sieg: false,
        runden: runde,
        maxPhase,
        burstRunden,
        verfallen: verfallenGesamt,
        lebenUebrig: 0,
        toteSpieler: 2,
      };
    }
  }
  log('\n→ Unentschieden: Rundenlimit erreicht (zählt als Niederlage).');
  return {
    sieg: false,
    runden: MAX_RUNDEN,
    maxPhase,
    burstRunden,
    verfallen: verfallenGesamt,
    lebenUebrig: 0,
    toteSpieler: 2 - lebend(spieler).length,
  };
}

/** Alle Paarungen aus zwei verschiedenen Decks. */
function paarungenAus(decks: DeckProfil[]): [DeckProfil, DeckProfil][] {
  return decks.flatMap((x, i) => decks.slice(i + 1).map((y) => [x, y] as [DeckProfil, DeckProfil]));
}

function auswertung(spiele_: number): void {
  const decks = process.env['SIM_DECKS'] === 'strixhaven' ? [...STRIXHAVEN, JACE] : PRECONS;
  const paarungen = paarungenAus(decks);
  console.log(
    `Simulation: ${spiele_} Partien je Boss und Paarung, ${paarungen.length} Paarungen ` +
      `(2 gegen Boss, 40 Leben, Boss-Verstand ${process.env['SIM_PLANER'] ?? 'instinkt'}).\n`,
  );
  const kopf = [
    'Lvl',
    'Boss'.padEnd(26),
    'Sieg',
    ...decks.map((d) => d.kurz.padEnd(7)),
    'Schwächste'.padEnd(16),
    'Ø Rd',
    'Ph. 3',
  ];
  console.log(kopf.join(' | '));
  for (const boss of BOSSE) {
    const proDeck = new Map<string, { s: number; n: number }>();
    const proPaar: { name: string; quote: number }[] = [];
    let runden = 0;
    let siege = 0;
    let phase3 = 0;
    let n = 0;
    for (const p of paarungen) {
      let s = 0;
      for (let i = 0; i < spiele_; i++) {
        const e = spiele(boss, p, i * 7919 + boss.level * 31 + p[0].kurz.length * 13);
        n++;
        if (e.sieg) {
          s++;
          siege++;
          runden += e.runden;
        }
        if (e.maxPhase === 3) phase3++;
      }
      for (const d of p) {
        const x = proDeck.get(d.kurz) ?? { s: 0, n: 0 };
        proDeck.set(d.kurz, { s: x.s + s, n: x.n + spiele_ });
      }
      proPaar.push({ name: `${p[0].kurz}+${p[1].kurz}`, quote: s / spiele_ });
    }
    const schwach = [...proPaar].sort((a, b) => a.quote - b.quote)[0];
    console.log(
      [
        String(boss.level).padStart(3),
        boss.name.padEnd(26),
        `${Math.round((siege / n) * 100)}%`.padStart(4),
        ...decks.map((d) => {
          const x = proDeck.get(d.kurz)!;
          return `${Math.round((x.s / x.n) * 100)}%`.padEnd(7);
        }),
        `${schwach.name} ${Math.round(schwach.quote * 100)}%`.padEnd(16),
        (siege ? (runden / siege).toFixed(1) : '–').padStart(4),
        `${Math.round((phase3 / n) * 100)}%`.padStart(5),
      ].join(' | '),
    );
  }
  console.log(
    '\nSieg: Siegquote der Spieler über alle Paarungen. Deck-Spalten: Siegquote aller Paarungen mit diesem Deck.',
  );
}

// Nur als Einstieg ausführen, nicht wenn ein anderes Skript die Funktionen nutzt.
if (!process.env['SIM_EINSTIEG']) {
  const modus = process.argv[2];
  if (modus === 'beispiel') {
    const level = Number(process.argv[3] ?? 4);
    const deck = PRECONS.find((d) => d.kurz === (process.argv[4] ?? 'Terra')) ?? PRECONS[1];
    spiele(BOSSE[level - 1], [deck, JACE], Number(process.argv[5] ?? 42), (z) => console.log(z));
  } else {
    auswertung(Number(modus ?? 200) || 200);
  }
}
