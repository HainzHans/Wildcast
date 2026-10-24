import { InjectionToken } from '@angular/core';

/** Liefert eine Zahl in [0, 1). In Tests durch eine feste Folge ersetzbar. */
export type Zufall = () => number;

export const ZUFALL = new InjectionToken<Zufall>('Zufall', {
  providedIn: 'root',
  factory: () => Math.random,
});

/** Reproduzierbarer Zufall (mulberry32), z. B. für Verteilungstests. */
export function zufallMitStartwert(startwert: number): Zufall {
  let a = startwert >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
