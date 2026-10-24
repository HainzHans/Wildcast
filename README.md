# Wildcast

Chaos-Effekte & Bosskämpfe für deinen Kartenspielabend. Hausregel-Varianten für 1–4 Spieler,
gespielt auf **einem** Gerät, das alle sehen (Handy flach in der Tischmitte, Tablet oder Laptop).
Läuft komplett lokal und offline. Hintergrund und Regeln: [wildcast-briefing.md](wildcast-briefing.md).

## Starten

```bash
npm start      # http://localhost:4200
npm test       # Vitest
npm run build  # statischer Build nach dist/wildcast/browser
```

## Aufbau

```
src/app/
  core/            Spielstand (Signals, Rückgängig, localStorage), Tischausrichtung, Bildschirm-wach
  content/         Begriffe an einer Stelle (für eine spielneutrale Fassung austauschbar)
  varianten/       Register aller Varianten + je ein Ordner pro Variante
    mana-wuerfel/  Würfel-Logik, Effekt-Pool, Wirken-Dialog, Effekt-Karte, Effektliste
  pages/           Start (Variante wählen), Einrichten, Spieltisch
  shared/ui/       Überlagerung (drehbar), Bestätigen-Knopf (zweimal tippen)
```

## Eine neue Variante hinzufügen

1. In `core/spiel/modell.ts` die `VarianteId` (und ggf. ein neues `Werkzeug`) ergänzen.
2. In `varianten/varianten.ts` die Variante beschreiben: Spielerzahl, Startleben, Regeln, Werkzeuge.
3. Eigene Logik und Bausteine in `varianten/<name>/`; der Spieltisch blendet sie über die Werkzeuge ein.

## Effekt-Pool erweitern

Vorlagen liegen in `varianten/mana-wuerfel/effekt-pool.ts`. Platzhalter skalieren mit dem bezahlten Mana:
`{m}`, `{2m}`, `{m/2}`, `{m+1}`, `{2m-1}` (abgerundet, mindestens 1). Die Tests prüfen, dass jede
Kombination aus Art und Form mindestens eine Vorlage hat.
