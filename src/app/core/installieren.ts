import { Injectable, signal } from '@angular/core';

/** Das Ereignis, mit dem Chrome & Co. die Installation anbieten (noch nicht in den DOM-Typen). */
interface InstallAngebot extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Wildcast als App auf den Startbildschirm legen. Android und Desktop-Browser bieten das per
 * Knopf an; auf dem iPhone geht es nur über „Teilen → Zum Home-Bildschirm“.
 */
@Injectable({ providedIn: 'root' })
export class Installieren {
  private angebot: InstallAngebot | null = null;

  /** Läuft schon als installierte App (ohne Browserleiste). */
  readonly installiert = signal(
    matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  /** Der Browser bietet die Installation per Knopf an. */
  readonly moeglich = signal(false);
  readonly iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);

  constructor() {
    addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.angebot = e as InstallAngebot;
      this.moeglich.set(true);
    });
    addEventListener('appinstalled', () => {
      this.installiert.set(true);
      this.moeglich.set(false);
    });
  }

  async installieren(): Promise<void> {
    if (!this.angebot) return;
    await this.angebot.prompt();
    const { outcome } = await this.angebot.userChoice;
    if (outcome === 'accepted') this.moeglich.set(false);
    this.angebot = null;
  }
}
