import { BossAktion, BossDefinition, Merkmal, Relikt } from './boss-modell';

/**
 * Bosskampf mit drei oder vier Spielern. Die Bosse sind für zwei Spieler geschrieben; mit mehr
 * Spielern bekommt jeder Boss mehr Leben, heilt und schützt sich entsprechend stärker, ruft mehr
 * Diener und verteilt Schaden und Entfernung auf mehrere Spieler. Die Texte werden dabei
 * angepasst, damit am Tisch steht, was die App auch umsetzt.
 */
export interface Mehrspieler {
  spieler: number;
  /** Weitere Spieler, die Lebensverlust gegen einen einzelnen Spieler zusätzlich trifft. */
  zusatzZiele: number;
  /** Anteil des Lebensverlusts, den diese weiteren Spieler erleiden. */
  zusatzAnteil: number;
  /** Weitere Spieler, deren stärkste Kreatur ein Effekt gegen „die stärkste Kreatur“ mittrifft. */
  zusatzKreaturen: number;
  /** Diener, die jede Runde zusätzlich kommen (0,5 = jede zweite Runde) … */
  dienerProRunde: number;
  /** … und wie viele er mehr haben darf. */
  dienerGrenze: number;
}

/**
 * Was sich je Spielerzahl ändert. Zwei Spieler sind der Maßstab, für den die Bosse geschrieben sind.
 * `leben` vervielfacht seine Leben, `heilung` Heilung, Schutz und die Verteidigung seiner Karten.
 * Die Werte sind mit der Simulation (scripts/simulation) so gewählt, dass jeder Boss mit drei und
 * vier Spielern etwa so oft besiegt wird wie mit zwei.
 */
export const MEHRSPIELER: Record<number, Mehrspieler & { leben: number; heilung: number }> = {
  2: {
    spieler: 2,
    leben: 1,
    heilung: 1,
    zusatzZiele: 0,
    zusatzAnteil: 0,
    zusatzKreaturen: 0,
    dienerProRunde: 0,
    dienerGrenze: 0,
  },
  3: {
    spieler: 3,
    leben: 1.7,
    heilung: 1.6,
    zusatzZiele: 1,
    zusatzAnteil: 1,
    zusatzKreaturen: 1,
    dienerProRunde: 0.5,
    dienerGrenze: 2,
  },
  4: {
    spieler: 4,
    leben: 2.2,
    heilung: 2,
    zusatzZiele: 2,
    zusatzAnteil: 1,
    zusatzKreaturen: 2,
    dienerProRunde: 1,
    dienerGrenze: 4,
  },
};

export function spielerzahlGueltig(n: number | undefined): number {
  return n && MEHRSPIELER[n] ? n : 2;
}

const mal = (x: number, f: number) => Math.round(x * f);

/** Ersetzt eine Zahl in einer festen Wendung, z. B. „erhält 9 Leben“ → „erhält 14 Leben“. */
function zahlInText(text: string, vorher: string, alt: number, neu: number, nachher = ''): string {
  if (alt === neu) return text;
  return text.replace(`${vorher}${alt}${nachher}`, `${vorher}${neu}${nachher}`);
}

/** „erhält 9 Leben“, aber auch „erhält die Königin 4 Leben“. */
function heilungInText(text: string, alt: number, neu: number): string {
  return text.replace(new RegExp(`(erhält[^.\\d]*?)${alt} Leben`), `$1${neu} Leben`);
}

function schutzInText(text: string, alt: number, neu: number): string {
  return zahlInText(text, 'die ersten ', alt, neu, ' Schaden');
}

const ZAHLWORT = ['', 'einem', 'zwei', 'drei'];

/** Trifft eine Aktion „die Kreatur der Spieler mit der höchsten Stärke“ oder Ähnliches? */
export const STAERKSTE_KREATUR =
  /(kreatur(en)? der spieler (mit flugfähigkeit und )?(mit )?der höchsten stärke|stärkste kreatur der spieler|kommandeur mit der höchsten stärke)/i;

/** Lebensverlust nur für einen Spieler – das verteilt der Boss mit mehr Spielern weiter. */
export function einzelZiel(a: BossAktion): boolean {
  return !!a.folgen?.leben && a.folgen.leben.ziel !== 'alle' && a.folgen.leben.um < 0;
}

function hinweisLeben(a: BossAktion, m: Mehrspieler): string {
  const wer = a.folgen?.leben?.ziel === 'wenigsteLeben' ? 'wenigsten' : 'meisten';
  const menge = Math.ceil(-(a.folgen?.leben?.um ?? 0) * m.zusatzAnteil);
  const spieler =
    m.zusatzZiele === 1
      ? `der Spieler mit den ${wer} Leben`
      : `die ${ZAHLWORT[m.zusatzZiele]} Spieler mit den ${wer} Leben`;
  return ` Außerdem ${m.zusatzZiele === 1 ? 'verliert' : 'verlieren'} ${spieler} unter den übrigen ${menge} Leben.`;
}

function hinweisKreatur(text: string, m: Mehrspieler): string {
  const was = /kommandeur mit der höchsten stärke/i.test(text)
    ? 'den stärksten Kommandeur'
    : 'die stärkste Kreatur';
  const weitere =
    m.zusatzKreaturen === 1
      ? 'einem weiteren Spieler'
      : `${ZAHLWORT[m.zusatzKreaturen]} weiteren Spielern`;
  return ` Das gilt außerdem für ${was} von ${weitere}.`;
}

function aktionSkalieren(a: BossAktion, m: Mehrspieler, f: number): BossAktion {
  const folgen = a.folgen ? { ...a.folgen } : undefined;
  let text = a.text;
  if (folgen?.heilung) {
    const neu = mal(folgen.heilung, f);
    text = heilungInText(text, folgen.heilung, neu);
    folgen.heilung = neu;
  }
  if (folgen?.schutz) {
    const neu = mal(folgen.schutz, f);
    text = schutzInText(text, folgen.schutz, neu);
    folgen.schutz = neu;
  }
  if (folgen?.heilungAusVerlust) {
    const neu = mal(folgen.heilungAusVerlust.max, f);
    text = zahlInText(text, '(höchstens ', folgen.heilungAusVerlust.max, neu, ')');
    folgen.heilungAusVerlust = { ...folgen.heilungAusVerlust, max: neu };
  }
  if (m.zusatzZiele && einzelZiel(a)) text += hinweisLeben(a, m);
  if (m.zusatzKreaturen && STAERKSTE_KREATUR.test(text)) text += hinweisKreatur(text, m);
  return { ...a, text, folgen };
}

function reliktSkalieren(r: Relikt, f: number): Relikt {
  let text = r.text;
  const proZug = r.proZug ? { ...r.proZug } : undefined;
  if (proZug?.heilung) {
    const neu = mal(proZug.heilung, f);
    text = heilungInText(text, proZug.heilung, neu);
    proZug.heilung = neu;
  }
  if (proZug?.schutz) {
    const neu = mal(proZug.schutz, f);
    text = schutzInText(text, proZug.schutz, neu);
    proZug.schutz = neu;
  }
  let ablauf = r.ablauf;
  if (ablauf?.heilung) {
    const neu = mal(ablauf.heilung, f);
    ablauf = { ...ablauf, heilung: neu, text: heilungInText(ablauf.text, ablauf.heilung!, neu) };
  }
  return { ...r, text, proZug, ablauf, verteidigung: mal(r.verteidigung, f) };
}

function merkmalSkalieren(m: Merkmal, n: number, f: number): Merkmal {
  switch (m.art) {
    case 'hunger':
      return { ...m, heilung: mal(m.heilung, f) };
    case 'pakte': {
      const neu = mal(m.heilungProSeele, f);
      return {
        ...m,
        heilungProSeele: neu,
        text: heilungInText(m.text, m.heilungProSeele, neu),
      };
    }
    case 'hitze': {
      // Mehr Spieler machen mehr Schaden – sonst kühlt er von allein ab.
      const neu = mal(m.schadenProKuehlung, f);
      return {
        ...m,
        schadenProKuehlung: neu,
        text: zahlInText(m.text, 'Je ', m.schadenProKuehlung, neu, ' Schaden'),
      };
    }
    case 'brut': {
      const neu = m.schildMax + (n - 2);
      return {
        ...m,
        schildMax: neu,
        text: zahlInText(m.text, 'höchstens ', m.schildMax, neu, '.'),
      };
    }
    case 'koerper':
      return {
        ...m,
        text: m.teile.reduce(
          (t, x) => (x.heilung ? zahlInText(t, 'um ', x.heilung, mal(x.heilung, f), '.') : t),
          m.text,
        ),
        teile: m.teile.map((x) =>
          x.heilung
            ? {
                ...x,
                heilung: mal(x.heilung, f),
                wirkung: zahlInText(x.wirkung, 'um ', x.heilung, mal(x.heilung, f), '.'),
              }
            : x,
        ),
      };
    default:
      return m;
  }
}

/** Der Boss, wie er gegen so viele Spieler antritt. Mit zwei Spielern bleibt er unverändert. */
export function fuerSpielerzahl(boss: BossDefinition, n: number): BossDefinition {
  const m = MEHRSPIELER[spielerzahlGueltig(n)];
  if (m.spieler === 2) return boss;
  return {
    ...boss,
    leben: mal(boss.leben, m.leben),
    startDiener: boss.startDiener + (m.spieler - 2),
    aktionen: boss.aktionen.map((a) => aktionSkalieren(a, m, m.heilung)),
    spezial: aktionSkalieren(boss.spezial, m, m.heilung),
    relikte: boss.relikte.map((r) => reliktSkalieren(r, m.heilung)),
    merkmal: boss.merkmal && merkmalSkalieren(boss.merkmal, m.spieler, m.heilung),
    mehrspieler: m,
  };
}
