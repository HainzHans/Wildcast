import { TestBed } from '@angular/core/testing';

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
    store.starten('mana-wuerfel', ['Jo', 'Flo'], 40);
  });

  it('legt die Spieler mit Startleben an', () => {
    expect(store.stand()?.spieler).toEqual([
      { id: 1, name: 'Jo', leben: 40 },
      { id: 2, name: 'Flo', leben: 40 },
    ]);
  });

  it('ändert Leben und macht es rückgängig', () => {
    store.aendereLeben(2, -5);
    store.aendereLeben(2, -1);
    expect(store.stand()?.spieler[1].leben).toBe(34);

    store.rueckgaengig();
    expect(store.stand()?.spieler[1].leben).toBe(35);
    store.rueckgaengig();
    expect(store.stand()?.spieler[1].leben).toBe(40);
    expect(store.kannRueckgaengig()).toBe(false);
  });

  it('nummeriert gewirkte Effekte fortlaufend und merkt sich den Zahlenden', () => {
    const erster = store.wirken(1, 3);
    const zweiter = store.wirken(2, 7);
    expect(erster?.nr).toBe(1);
    expect(zweiter?.nr).toBe(2);
    expect(zweiter?.spielerId).toBe(2);
    expect(store.stand()?.effekte.length).toBe(2);
  });

  it('markiert Verzauberungen als zerstört, rückgängig inklusive', () => {
    const effekt = store.wirken(1, 5)!;
    store.zerstoeren(effekt.nr);
    expect(store.stand()?.effekte[0].zerstoert).toBe(true);
    store.rueckgaengig();
    expect(store.stand()?.effekte[0].zerstoert).toBeFalsy();
  });

  it('speichert den Stand lokal', () => {
    store.aendereLeben(1, 3);
    TestBed.tick();
    const gespeichert = JSON.parse(localStorage.getItem('wildcast.spiel.v1')!);
    expect(gespeichert.spieler[0].leben).toBe(43);
  });
});
