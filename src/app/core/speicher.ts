/**
 * Kleiner Wrapper um localStorage. Im privaten Modus oder bei gesperrtem Speicher
 * wirft der Zugriff – dann läuft die App eben ohne Speichern weiter.
 */
export function lesen<T>(schluessel: string): T | null {
  try {
    const roh = localStorage.getItem(schluessel);
    return roh ? (JSON.parse(roh) as T) : null;
  } catch {
    return null;
  }
}

export function schreiben(schluessel: string, wert: unknown): void {
  try {
    if (wert === null) localStorage.removeItem(schluessel);
    else localStorage.setItem(schluessel, JSON.stringify(wert));
  } catch {
    // Speichern ist Komfort, kein Muss.
  }
}
