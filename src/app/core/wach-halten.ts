import { inject, Injectable } from '@angular/core';

import { Einstellungen } from './einstellungen';

/**
 * Hält den Bildschirm während der Partie an. Der Browser gibt die Sperre frei,
 * sobald der Tab im Hintergrund ist – beim Zurückkehren wird sie neu angefordert.
 */
@Injectable({ providedIn: 'root' })
export class WachHalten {
  private readonly einstellungen = inject(Einstellungen);
  private sperre: WakeLockSentinel | null = null;
  private aktiv = false;
  private readonly sichtbar = () => {
    if (this.aktiv && document.visibilityState === 'visible') void this.anfordern();
  };

  an(): void {
    if (this.aktiv || !this.einstellungen.wachHalten() || !('wakeLock' in navigator)) return;
    this.aktiv = true;
    document.addEventListener('visibilitychange', this.sichtbar);
    void this.anfordern();
  }

  aus(): void {
    this.aktiv = false;
    document.removeEventListener('visibilitychange', this.sichtbar);
    void this.sperre?.release();
    this.sperre = null;
  }

  private async anfordern(): Promise<void> {
    try {
      this.sperre = await navigator.wakeLock.request('screen');
    } catch {
      // Z. B. Energiesparmodus – dann geht der Bildschirm eben aus.
    }
  }
}
