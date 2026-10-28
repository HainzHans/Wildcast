import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { bossZug, fragenFuerZug } from '../../varianten/boss/boss-logik';
import { Antworten, BossZug, Frage } from '../../varianten/boss/boss-modell';
import {
  bossKorrigieren,
  bossLage,
  bossStarten,
  bossTreffen,
  bossZugEintragen,
  dienerBesiegen,
  dienerTappen,
  eiZerschlagen,
  nebelVertreiben,
  paktEntscheiden,
  reliktTreffen,
  reliktZerstoeren,
  schildAufheben,
} from '../../varianten/boss/boss-stand';
import { bossMitId } from '../../varianten/boss/bosse';
import { EffektArchiv } from '../../varianten/mana-wuerfel/effekt-archiv';
import { wuerfleEffekt } from '../../varianten/mana-wuerfel/wuerfel';
import {
  lebenBeimErscheinen,
  rundeBeenden,
  STANDARD_WELTEN,
  weltenStarten,
} from '../../varianten/welten/welt-stand';
import { weltMitId } from '../../varianten/welten/welten';
import { basarKaufen, basarRunde, basarStarten, STANDARD_BASAR } from '../../varianten/basar/basar';
import {
  segenStarten,
  segenUmschalten,
  segenWaehlen,
  STANDARD_SEGEN,
} from '../../varianten/segen/segen';
import {
  abwurfWaehlen,
  STANDARD_STURM,
  sturmRunde,
  sturmStarten,
} from '../../varianten/untergang/sturm';
import { lesen, schreiben } from '../speicher';
import { ZUFALL } from '../zufall';
import { Effekt, SpielOptionen, Spielstand, VarianteId } from './modell';

const SCHLUESSEL = 'wildcast.spiel.v1';
const MAX_VERLAUF = 100;
/** So viele zuletzt gewürfelte Vorlagen werden möglichst nicht wiederholt. */
const KEINE_WIEDERHOLUNG = 8;

/** Liest den gespeicherten Stand; ältere Stände kannten nur eine einzelne Variante. */
function ladeStand(): Spielstand | null {
  const stand = lesen<Spielstand & { variante?: VarianteId }>(SCHLUESSEL);
  if (!stand) return null;
  const { variante, ...rest } = stand;
  const mitVarianten = variante && !rest.varianten ? { ...rest, varianten: [variante] } : rest;
  // Bosskämpfe aus früheren Versionen kannten das Gedächtnis des Bosses noch nicht.
  const boss = mitVarianten.boss;
  return boss
    ? {
        ...mitVarianten,
        boss: {
          ...boss,
          verlauf: boss.verlauf ?? [],
          letzteFragen: boss.letzteFragen ?? [],
          gemerkteAntworten: boss.gemerkteAntworten ?? {},
          letzteSprueche: boss.letzteSprueche ?? [],
          relikte: boss.relikte ?? [],
          verlorenesRelikt: boss.verlorenesRelikt ?? null,
        },
      }
    : mitVarianten;
}

/**
 * Hält die laufende Partie auf diesem einen Gerät. Jede Änderung legt den vorherigen Stand
 * im Verlauf ab, damit am geteilten Tisch ein Danebentippen rückgängig gemacht werden kann.
 */
@Injectable({ providedIn: 'root' })
export class SpielStore {
  private readonly zufall = inject(ZUFALL);
  private readonly archiv = inject(EffektArchiv);

  private readonly _stand = signal<Spielstand | null>(ladeStand());
  private readonly verlauf = signal<Spielstand[]>([]);

  readonly stand = this._stand.asReadonly();
  readonly kannRueckgaengig = computed(() => this.verlauf().length > 0);
  /** Eine Welt ist gerade erschienen und soll groß aufgedeckt werden. */
  private readonly _weltAufdecken = signal(false);
  readonly weltAufdecken = this._weltAufdecken.asReadonly();

  constructor() {
    effect(() => schreiben(SCHLUESSEL, this._stand()));
  }

  starten(
    varianten: VarianteId[],
    namen: string[],
    startLeben: number,
    optionen: SpielOptionen = {},
  ): void {
    this.verlauf.set([]);
    const spieler = namen.map((name, i) => ({ id: i + 1, name, leben: startLeben }));
    const welt = varianten.includes('welten')
      ? weltenStarten(optionen.welten ?? STANDARD_WELTEN, spieler.length, this.zufall)
      : undefined;
    const erste = welt && weltMitId(welt.aktuell);
    this._weltAufdecken.set(!!welt);
    this._stand.set({
      varianten,
      gestartet: new Date().toISOString(),
      spieler: erste ? lebenBeimErscheinen(erste, spieler) : spieler,
      effekte: [],
      optionen,
      runde: 1,
      welt,
      sturm: varianten.includes('untergang')
        ? sturmStarten(optionen.sturm ?? STANDARD_STURM)
        : undefined,
      segen: varianten.includes('segen')
        ? segenStarten(optionen.segen ?? STANDARD_SEGEN, spieler, this.zufall)
        : undefined,
      basar: varianten.includes('basar')
        ? basarStarten(optionen.basar ?? STANDARD_BASAR, this.zufall)
        : undefined,
      boss: varianten.includes('boss')
        ? bossStarten(bossMitId(optionen.bossId), this.zufall, optionen.bossPlaner)
        : undefined,
    });
  }

  beenden(): void {
    this.verlauf.set([]);
    this._weltAufdecken.set(false);
    this._stand.set(null);
  }

  aendereLeben(spielerId: number, um: number): void {
    this.aendern((s) => ({
      ...s,
      spieler: s.spieler.map((p) => (p.id === spielerId ? { ...p, leben: p.leben + um } : p)),
    }));
  }

  /** Würfelt einen Effekt für den zahlenden Spieler und legt ihn ins Protokoll. */
  wirken(spielerId: number, mana: number): Effekt | null {
    const s = this._stand();
    if (!s) return null;
    const zuletzt = s.effekte.slice(-KEINE_WIEDERHOLUNG).map((e) => e.vorlage);
    const effekt: Effekt = {
      ...wuerfleEffekt(this.archiv.pool(), mana, this.zufall, zuletzt, s.optionen?.manaWuerfel),
      nr: s.effekte.length + 1,
      spielerId,
      zeit: new Date().toISOString(),
    };
    this.aendern((alt) => ({ ...alt, effekte: [...alt.effekte, effekt] }));
    return effekt;
  }

  zerstoeren(nr: number): void {
    this.aendern((s) => ({
      ...s,
      effekte: s.effekte.map((e) => (e.nr === nr ? { ...e, zerstoert: true } : e)),
    }));
  }

  // ── Runden ────────────────────────────────────────────────────

  /** Jeder war einmal dran: neue Welt, Sturm und Basar rücken weiter. */
  rundeBeenden(): void {
    this.aendern((s) => this.rundeWeiter(s));
  }

  /** Was beim Rundenwechsel in allen Varianten passiert. Im Bosskampf beendet der Boss-Zug die Runde. */
  private rundeWeiter(alt: Spielstand): Spielstand {
    const runde = (alt.runde ?? alt.welt?.runde ?? 1) + 1;
    let s: Spielstand = { ...alt, runde };
    if (s.welt) {
      const { stand: welt, neu } = rundeBeenden(s.welt, s.spieler.length, this.zufall);
      if (neu) this._weltAufdecken.set(true);
      s = { ...s, welt, spieler: neu ? lebenBeimErscheinen(neu, s.spieler) : s.spieler };
    }
    if (s.sturm) {
      const r = sturmRunde(s.sturm, s.spieler, runde, this.zufall);
      s = { ...s, sturm: r.stand, spieler: r.spieler };
    }
    if (s.basar) s = { ...s, basar: basarRunde(s.basar, runde, this.zufall) };
    return s;
  }

  weltGesehen(): void {
    this._weltAufdecken.set(false);
  }

  // ── Untergang ─────────────────────────────────────────────────

  /** Der Nächste in der Reihenfolge nimmt sich ein Angebot aus dem Versorgungsabwurf. */
  abwurfWaehlen(angebotId: string): void {
    this.aendern((s) => {
      if (!s.sturm) return s;
      const r = abwurfWaehlen(s.sturm, s.spieler, angebotId);
      return { ...s, sturm: r.stand, spieler: r.spieler };
    });
  }

  // ── Segen-Draft ───────────────────────────────────────────────

  segenWaehlen(segenId: string): void {
    this.aendern((s) => {
      if (!s.segen) return s;
      const r = segenWaehlen(s.segen, s.spieler, segenId);
      return { ...s, segen: r.stand, spieler: r.spieler };
    });
  }

  /** Einmaligen Segen als eingesetzt markieren (oder zurücknehmen). */
  segenUmschalten(spielerId: number, segenId: string): void {
    this.aendern((s) =>
      s.segen ? { ...s, segen: segenUmschalten(s.segen, spielerId, segenId) } : s,
    );
  }

  // ── Basar ─────────────────────────────────────────────────────

  basarKaufen(angebotId: string, spielerId: number): void {
    this.aendern((s) => {
      if (!s.basar) return s;
      const runde = s.runde ?? 1;
      const r = basarKaufen(s.basar, s.spieler, angebotId, spielerId, runde, this.zufall);
      return { ...s, basar: r.stand, spieler: r.spieler };
    });
  }

  // ── Bosskampf ─────────────────────────────────────────────────

  /**
   * Schaden am Boss (bei mehreren Körpern am gewählten Teil). Gibt zurück, wie viel am
   * Phasen-Schild verfallen ist und wie viel wirklich ankam (Nebel, Hunger …).
   */
  bossTreffen(schaden: number, teilId?: string): { verfallen: number; wirkung: number } {
    const boss = this._stand()?.boss;
    if (!boss) return { verfallen: 0, wirkung: 0 };
    const { stand, verfallen, wirkung } = bossTreffen(boss, schaden, undefined, teilId);
    this.aendern((s) => ({ ...s, boss: stand }));
    return { verfallen, wirkung };
  }

  bossKorrigieren(um: number, teilId?: string): void {
    this.mitBoss((b) => bossKorrigieren(b, um, teilId));
  }

  nebelVertreiben(): void {
    this.mitBoss((b) => nebelVertreiben(b));
  }

  eiZerschlagen(nr: number): void {
    this.mitBoss((b) => eiZerschlagen(b, nr));
  }

  /** Ein Spieler nimmt den Pakt des Dämonenfürsten an oder lehnt ihn ab. */
  paktEntscheiden(spielerId: number, annehmen: boolean): void {
    this.aendern((s) => {
      if (!s.boss) return s;
      const r = paktEntscheiden(s.boss, spielerId, annehmen);
      return {
        ...s,
        boss: r.stand,
        spieler: s.spieler.map((p) =>
          p.id === spielerId ? { ...p, leben: p.leben + r.leben } : p,
        ),
      };
    });
  }

  dienerBesiegen(nr: number): void {
    this.mitBoss((b) => dienerBesiegen(b, nr));
  }

  dienerTappen(nr: number): void {
    this.mitBoss((b) => dienerTappen(b, nr));
  }

  schildAufheben(): void {
    this.mitBoss((b) => schildAufheben(b));
  }

  /** Eine Karte des Bosses ist zerstört, z. B. durch einen Entfernungszauber. */
  reliktZerstoeren(id: string): void {
    this.mitBoss((b) => reliktZerstoeren(b, id));
  }

  /** Schaden an einer Karte des Bosses, z. B. durch Angreifer (negativ zum Korrigieren). */
  reliktTreffen(id: string, schaden: number): void {
    this.mitBoss((b) => reliktTreffen(b, id, schaden));
  }

  /** Die Fragen, die der Boss zu Beginn seines Zuges stellt. Ändert nichts am Stand. */
  bossFragen(): Frage[] {
    const s = this._stand();
    if (!s?.boss) return [];
    return fragenFuerZug(bossMitId(s.boss.bossId), bossLage(s.boss, s.spieler, {}), this.zufall);
  }

  /** Würfelt den Boss-Zug mit den Antworten aus und trägt ihn sofort ein (rückgängig möglich). */
  bossZugAusfuehren(antworten: Antworten): BossZug | null {
    const s = this._stand();
    if (!s?.boss) return null;
    const zug = bossZug(
      bossMitId(s.boss.bossId),
      bossLage(s.boss, s.spieler, antworten),
      this.zufall,
    );
    this.aendern((alt) =>
      this.rundeWeiter({
        ...alt,
        spieler: alt.spieler.map((p) => ({
          ...p,
          leben:
            p.leben +
            zug.lebenAenderungen.filter((l) => l.spielerId === p.id).reduce((n, l) => n + l.um, 0),
        })),
        boss: alt.boss && bossZugEintragen(alt.boss, zug, alt.spieler, antworten),
      }),
    );
    return zug;
  }

  private mitBoss(
    neu: (b: NonNullable<Spielstand['boss']>) => NonNullable<Spielstand['boss']>,
  ): void {
    this.aendern((s) => (s.boss ? { ...s, boss: neu(s.boss) } : s));
  }

  rueckgaengig(): void {
    const verlauf = this.verlauf();
    if (!verlauf.length) return;
    this._weltAufdecken.set(false);
    this._stand.set(verlauf[verlauf.length - 1]);
    this.verlauf.set(verlauf.slice(0, -1));
  }

  private aendern(neu: (s: Spielstand) => Spielstand): void {
    const s = this._stand();
    if (!s) return;
    this.verlauf.update((v) => [...v.slice(-(MAX_VERLAUF - 1)), s]);
    this._stand.set(neu(s));
  }
}
