# Wildcast – Projekt-Briefing

Arbeitstitel **Wildcast**. Eine Web- bzw. Handy-App mit Hausregel-Varianten für Sammelkartenspiel-Abende, entstanden aus einer selbst getesteten Commander-Hausregel (1 gegen 1 und 2 gegen Boss).

Entwickler: Johannes, Fullstack-Webentwickler.
Stack: **Angular, TypeScript, Supabase, Vercel**. Mobile-first, wird vor allem am Handy am Spieltisch genutzt.

---

## 1. Kernidee: Mana-Würfel

Spieler bezahlen Mana und bekommen dafür einen **frei generierten Effekt**, dessen Stärke zu den Manakosten passt.

### Grundregeln
- Gespielt wird 1 gegen 1 Commander mit 40 Leben, oder 2 Spieler im Team gegen einen Boss.
- Nur die Manamenge zählt, die Farbe ist egal.
- Effekte können **jederzeit wie ein Spontanzauber** gewirkt werden. Sie gehen auf den Stapel, und der Gegner kann darauf antworten, auch mit einem eigenen Mana-Effekt.

### Würfel 1: Art des Effekts
| Art | Wahrscheinlichkeit |
|---|---|
| Positiv | 65 % |
| Negativ (trifft den Zahlenden) | 31,5 % |
| Chaos (trifft alle Spieler) | 3,5 % (= 10 % der negativen Würfe) |

### Würfel 2: Form des Effekts
| Form | Wahrscheinlichkeit | Beschreibung |
|---|---|---|
| Normal | 55 % | Klassischer MTG-artiger Einmaleffekt |
| Verrückt | 20 % | Effekte, die es so in MTG nicht gibt, die aber trotzdem **Karten, Hand, Deck, Friedhof oder Spielfeld** betreffen (z. B. Hände tauschen, Karten aus dem gegnerischen Deck stehlen, Deck nach Kartentyp zensieren). Keine Spielerei wie „laut reden“ oder „nur mit einer Hand spielen“. |
| Verzauberung | 15 % | Bleibendes Objekt, kann zerstört werden |
| Emblem | 10 % | Bleibt das ganze Spiel und kann nicht entfernt werden |

Jede Kombination ist möglich, z. B. ein negatives Emblem oder eine Chaos-Verzauberung.

### Ausgabeformat eines Effekts
1. **Lustiger Satz** in Anführungszeichen, *immer ganz oben*
2. Würfelergebnis (Art · Form)
3. **#Nr · Name (X Mana)**
4. Regeltext, kurz und eindeutig

Keinen Abschnitt „Zur Einordnung“ ausgeben.

### Balancing-Faustregeln für die Effektstärke
- 1 Mana: ±2–4 Leben, eine Karte tappen, kleiner Pump-Effekt (+2/+0), 2 Schaden
- 2–3 Mana: eine Karte ziehen, 3 Schaden, eine Kreatur zurück auf die Hand, kleiner Spielstein
- 4–6 Mana: Entfernung mit Manawert-Grenze, mehrere Spielsteine, kleine Verzauberung
- 7–10 Mana: großer Drache, zusätzlicher Zug, dauerhafte Übernahme einer Kreatur
- 13–20 Mana: das Spielfeld leeren, große Lebensschwankungen
- 42 Mana: „Du gewinnst das Spiel.“ (Insider-Gag, Anspielung auf „Per Anhalter durch die Galaxis“)

Negative Effekte bei hohen Manakosten dürfen sehr wehtun. Das Risiko ist Teil des Spaßes.

---

## 2. Boss-Modus (2 Spieler gegen KI-Boss)

### Ablauf
1. Spieler 1 macht seinen Zug, dann Spieler 2.
2. **Boss-Zug:** Der Boss würfelt eine Aktion und greift mit seinen Dienern an.
3. Danach ist wieder Spieler 1 dran.

### Boss-Aufbau
- Leben, passive Fähigkeit, Diener als Spielsteine
- Drei Phasen: Phase 2 beginnt bei 60 % der Leben, Phase 3 bei 30 %. In Phase 3 handelt der Boss zweimal pro Zug und kündigt seinen Spezialangriff eine Runde vorher an.
- Eine Aktion darf sich nicht direkt wiederholen.
- **Der Boss kennt das Board der Spieler nicht.** Deshalb arbeiten seine Aktionen mit:
  - **relativen Zielen**: „die Kreatur mit der höchsten Stärke“, „der Spieler mit den meisten Leben“, bei Gleichstand entscheidet der Würfel
  - einer **Ersatzstrafe**: „…hat er keine Kreatur, verliert er stattdessen X Leben“

### Level-System (getestet)
| Level | Boss | Leben | Besonderheit |
|---|---|---|---|
| 1 | Spiegelhexe | 100 | Strafe für teure Zauber, kopiert Kreaturen |
| 2 | Nebelkönigin | 120 | Fliegende Diener, Heilung, wenn ein Diener stirbt |
| 3 | Gorvak der Hungrige | 140 | Die Spieler verlieren 1 Leben pro Boss-Diener und Runde; der Boss heilt sich, wenn Kreaturen der Spieler sterben |
| 4 | Sturmdrache | 160 | neue Balancing-Regeln, siehe unten |

### Erkenntnisse aus den Tests (wichtig!)
- **Problem:** Die Bosse starten stark, weil sie schon Diener haben, und werden dann schwach, sobald ihre Diener weg sind. Die Spieler bauen zu zweit große Boards auf und erledigen den Boss am Ende **in einer einzigen Runde**. Phase 3 wurde deshalb nie erreicht.
- **Lösung ab Level 4:**
  - **Wachstum:** Der Boss startet mit wenigen Dienern und beschwört jede Runde mehr (Runde 1–2: einen, Runde 3–4: zwei, ab Runde 5: drei).
  - **Nachschub (ab Runde 2):** Hat der Boss höchstens einen Diener, kommen zwei weitere dazu.
  - **Phasen-Schild:** An jeder Phasengrenze verfällt jeder weitere Schaden in diesem Zug.
  - Optional: eine Strafe für volle Boards oder 1 Schaden weniger pro angreifender Kreatur.

---

## 3. Bestehender Prototyp (Logbuch)

Es gibt einen funktionierenden HTML-Prototyp: eine Single Page mit einem geteilten Dokumenten-Store. Mögliches Datenmodell für Supabase:

```
effekte   { nr, mana, art: positiv|negativ|chaos,
            form: normal|verrueckt|verzauberung|emblem,
            name, effekt, spruch, zeit, spieler? }
boss      { aktiv, level, name, hp, maxHp, passiv,
            extraLabel, extra, regeln, schild }
diener    { nr, name, pt: "3/2", effekt }
spieler   { nr, name, leben }
bosslog   { nr, spruch, text, zeit }
```

### UI-Funktionen des Prototyps
- Boss-Karte mit Lebensbalken, Phasenmarken bei 60 % und 30 %, passiver Fähigkeit, Level-Abzeichen und Schild-Hinweis
- Große Knöpfe fürs Handy: Boss-Leben −1, −3, −5, −10, +1. Die Knöpfe stoppen automatisch am Phasen-Schild.
- Spieler-Lebenspunkte mit −5, −1, +1, +5. Ab 10 oder weniger Leben wird die Anzeige rot.
- Diener-Karten mit „Besiegt“-Knopf, der zweimal getippt werden muss (Schutz vor Versehen)
- Letzter Boss-Zug hervorgehoben, darunter ein einklappbares Protokoll
- Effektliste mit Bilanz (Gesamt, Positiv, Negativ, Chaos), Filtern sowie Etiketten für Art und Form
- Echtzeit-Synchronisation, damit beide Spieler auf ihrem Handy denselben Stand sehen
- Hell- und Dunkelmodus

---

## 4. Rechtliches und Geschäft

- **Wizards Fan Content Policy:** Fan-Inhalte zu MTG müssen **kostenlos** sein. Bezahlschranken und Abos sind nicht erlaubt. Werbung, Sponsoring und Spenden sind erlaubt. Logos und Marken dürfen nicht ohne Genehmigung verwendet werden.
- **Daraus folgt:** Die App sollte **spielneutral** sein, ohne „Magic“, „MTG“, „Mana“ oder „Commander“ im Namen oder Branding und ohne Kartennamen oder Kartenbilder. Spielmechaniken selbst sind in der Regel nicht geschützt. *(Vor dem Start rechtlich prüfen lassen.)*
- **Konkurrenz:** Lotus (Life-Counter-App) bietet bereits Planechase, Archenemy und Würfel an, kostenlos, mit freiwilligen Unterstützer-Käufen und 4,6 Sternen bei rund 10.000 Bewertungen.
- **Alleinstellungsmerkmal:** frei generierte, balancierte Effekte mit Würfel-Logik, mitwachsende Bosse mit Level-System und lustige Effekttexte.
- **Einschätzung:** gut als Hobby- oder Portfolio-Projekt, als Geschäft eher Nische.
- **Effekt-Erzeugung:**
  - fester, kuratierter Effekt-Pool (mehrere tausend Effekte nach Mana, Art und Form): keine laufenden Kosten, funktioniert offline, **empfohlen als Basis**
  - KI-Generierung live: spannender, verursacht aber API-Kosten und braucht eine Qualitätskontrolle. Höchstens als Premium-Funktion in der spielneutralen Variante.
- **Empfohlener erster Schritt:** eine kostenlose Web-App mit festem Pool, vorgestellt in Commander-Communities wie Reddit, um zu testen, ob Interesse besteht.

---

## 5. Name

Favorit: **Wildcast**, Untertitel „Chaos-Effekte & Bosskämpfe für deinen Kartenspielabend“.
Alternativen: Spellroll, Chaoswürfel, Tablechaos, Houserule, Bossfight.
Noch zu prüfen: App Store und Google Play, Domain, DPMA- und EUIPO-Markenregister.
