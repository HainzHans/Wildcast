import { TestBed } from '@angular/core/testing';

import { STANDARD_WUERFEL } from '../../varianten/mana-wuerfel/wuerfel-einstellungen';
import { ZUFALL, zufallMitStartwert } from '../zufall';
import { SpielStore } from './spiel-store';

describe('SpielStore', () => {
  let store: SpielStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: ZUFALL, useValue: zufallMitStartwert(3) }],
    });
    store = TestBed.inject(SpielStore);
    store.starten(['mana-wuerfel'], ['Jo', 'Flo'], 40);
  });

  it('legt die Spieler mit Startleben an', () => {
    expect(store.stand()?.spieler).toEqual([
      { id: 1, name: 'Jo', leben: 40 },
      { id: 2, name: 'Flo', leben: 40 },
    ]);
  });

  it('ändert Leben', () => {
    store.aendereLeben(2, -5);
    store.aendereLeben(2, -1);
    expect(store.stand()?.spieler[1].leben).toBe(34);
  });

  it('nummeriert gewirkte Effekte fortlaufend und merkt sich den Zahlenden', () => {
    const erster = store.wirken(1, 3);
    const zweiter = store.wirken(2, 7);
    expect(erster?.nr).toBe(1);
    expect(zweiter?.nr).toBe(2);
    expect(zweiter?.spielerId).toBe(2);
    expect(store.stand()?.effekte.length).toBe(2);
  });

  it('markiert Verzauberungen als zerstört', () => {
    const effekt = store.wirken(1, 5)!;
    store.zerstoeren(effekt.nr);
    expect(store.stand()?.effekte[0].zerstoert).toBe(true);
  });

  it('speichert den Stand lokal', () => {
    store.aendereLeben(1, 3);
    TestBed.tick();
    const gespeichert = JSON.parse(localStorage.getItem('wildcast.spiel.v1')!);
    expect(gespeichert.spieler[0].leben).toBe(43);
  });

  it('würfelt mit den Hausregeln der Partie', () => {
    const nurChaos = structuredClone(STANDARD_WUERFEL);
    nurChaos.arten.positiv.aktiv = false;
    nurChaos.arten.negativ.aktiv = false;
    store.starten(['mana-wuerfel'], ['Jo', 'Flo'], 40, { manaWuerfel: nurChaos });
    for (let i = 0; i < 20; i++) expect(store.wirken(1, 5)?.art).toBe('chaos');
  });

  it('trägt Commander-Schaden je Gegner ein und zieht ihn von den Leben ab', () => {
    store.starten(['normal'], ['Jo', 'Flo', 'Max'], 40);
    store.commanderSchaden(1, 3, 7);
    store.commanderSchaden(1, 2, 2);
    store.commanderSchaden(1, 3, -10);
    const jo = store.stand()!.spieler[0];
    expect(jo.commander).toEqual({ 2: 2, 3: 0 });
    expect(jo.leben).toBe(38);
  });
});
