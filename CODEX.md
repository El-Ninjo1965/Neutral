# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Device-Retest-Folgefehler und User-UX bereinigen

Synchronisiere zuerst vollständig mit `origin/main`. Seit deinem letzten Abschluss wurden `I18N.md` neu angelegt und `DOCUMENTATION.md` aktualisiert. Diese Änderungen sind verbindlich und dürfen nicht überschrieben oder verworfen werden.

Lies vor Implementierung vollständig:

- `WORKFLOW.md`
- `DOCUMENTATION.md`
- `CODEX.md`
- `CURRENT-TASK.md`
- `UI-UX.md`
- `I18N.md`
- `VISION.md`
- `CORE-1.0.md`
- `Architecture.md`
- `Functions.md`
- `ModuleCreation.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- relevante User-App-, Settings-, GPS-, Login-, Startup-, Navigation-, CSS- und Testdateien

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

## Aktueller Betreiber-Livebefund vom 2026-09-08

### Bereits bestätigt

- Appearance kann `Module → GPS` speichern.
- GPS wird auf der Startansicht eingebettet.
- HTML-Modus zeigt den gespeicherten `<h1>TEST</h1>`-Inhalt.
- Username `Tester`, `Active Application`, `Local Workspace` und Modulzahl sind aus der User-App entfernt.
- Settings wirkt deutlich bereinigt.

### Noch fehlerhaft / zu verbessern

1. **Startseiten-/Reload-Semantik im Modulmodus**
   - Wenn `Module → GPS` als globale Startseite konfiguriert ist, zeigt `Start` GPS korrekt innerhalb der Startansicht.
   - Bei Browser-Reload springt die App jedoch auf die eigenständige GPS-Modulansicht, statt auf `Start` zu bleiben und GPS dort als konfigurierten Startinhalt einzubetten.
   - Beim Reload blitzt vorher kurz die alte neutrale Welcome-Startseite auf.
   - Erwartung: `Start` bleibt der aktive Startkontext. Das konfigurierte Modul ist der **Inhalt der Startseite**, kein erzwungener Navigationswechsel zum Modul-Tab.
   - Kein sichtbarer Flash der alten Default-Startseite vor Auflösung der gültigen Startkonfiguration.

2. **Blauer Rahmen beim GPS-Reload**
   - Nach dem Reload der eigenständigen GPS-Darstellung erscheint ein deutlicher blauer Rahmen um den Modulinhalt.
   - Der Rahmen bleibt sichtbar, bis irgendwo geklickt/getippt wird; danach verschwindet er.
   - Prüfe Focus-/`:focus`-/`:focus-visible`-/iframe-/Container-Verhalten und behebe die Ursache accessibility-konform. Nicht pauschal alle Fokusindikatoren entfernen.

3. **HTML-Startseite enthält unerwünschten festen Welcome-Block**
   - Im HTML-Modus wird der Administratorinhalt korrekt angezeigt, aber darüber bleibt `Welcome` / `Neutral Platform` als statischer Frameworkinhalt sichtbar.
   - Erwartung: Im Modus `Text / HTML` bestimmt der konfigurierte Inhalt den Startseiten-Inhalt. Ein fester Welcome-/Neutral-Block darf nicht zusätzlich darüber liegen.
   - Default-Welcome darf nur Fallback sein, wenn keine gültige konfigurierte Startseite vorhanden ist.

4. **Login benötigt teilweise zwei Klicks**
   - Betreiber beobachtet: Passwort eingeben → erster Klick auf `Login` führt nicht zuverlässig zur nächsten Ansicht; zweiter Klick ist erforderlich.
   - Reproduziere den realen Ablauf und finde Root Cause. Kein künstlicher Doppelklick-/Timeout-Workaround.
   - Nach einem gültigen Login muss genau eine bewusste Submit-Aktion ausreichen.
   - P1 User-/Admin-Sessiontrennung darf nicht verändert werden.

5. **`Show all functions` entfernen**
   - In User Settings existiert `Show all functions` mit Browser-Alert `All functions are visible again.`
   - Diese Funktion wird vom Betreiber nicht gewünscht und soll aus der normalen User-App entfernt werden.
   - Die individuelle Auswahl sichtbarer Bereiche/Funktionen bleibt dagegen erhalten, weil Nutzer später bei vielen Modulen nur gewünschte Bereiche in ihrer Navigation anzeigen sollen.
   - Keine Permission-/Securitylogik mit persönlicher Sichtbarkeitspräferenz verwechseln: User-Hide/Show ändert keine serverseitigen Rechte.

6. **Settings-Terminologie nutzerorientiert halten**
   - Technische Begriffe wie `Module` sollen in der normalen User-App nicht unnötig erscheinen.
   - Für die persönliche Auswahl sichtbarer Produktbereiche einen verständlichen neutralen UI-Begriff verwenden (z. B. sinngemäß `Features`, `App areas` oder localeabhängiges Äquivalent), ohne den internen Modulvertrag umzubenennen.
   - Keine endgültige englische Einzelbezeichnung hartcodieren, die den kommenden I18N-Vertrag blockiert.

7. **GPS-Anzeige menschenlesbar machen**
   - Aktuell wird Genauigkeit als lange Roh-Fließkommazahl angezeigt, z. B. `8.18936451168144 m`.
   - Sichtbar soll ein sinnvoll gerundeter Wert erscheinen, z. B. `± 8 m` bzw. locale-/einheitengerecht.
   - Interne Präzision darf nicht verloren gehen; nur Darstellung formatieren.
   - Aktueller Zeitstempel ist technisch/lang und visuell schlecht lesbar. Sichtbar lokales, konsistentes menschenlesbares Datum/Uhrzeitformat verwenden.
   - Interne Rohzeit/ISO-Werte dürfen für Logik/Persistenz erhalten bleiben.
   - Diese Korrektur darf keine komplette I18N-Implementierung vorwegnehmen; sie muss aber mit `I18N.md` kompatibel sein und vorhandene `Intl`-/Locale-Fähigkeiten sinnvoll nutzen, falls vorhanden.

8. **Sprach-Mischmasch nicht weiter fest verdrahten**
   - Betreiber sieht aktuell englische User-App-Texte und ein deutsches GPS-Modul gleichzeitig.
   - Die vollständige neue Sprachpaket-/Providerarchitektur aus `I18N.md` ist **nicht** Bestandteil dieses Auftrags.
   - Bei den jetzt angefassten sichtbaren Texten keine neue inkompatible Insellösung schaffen. Bestehende I18N-Fähigkeiten nutzen, falls vorhanden; ansonsten den späteren zentralen Vertrag offenhalten.

## Nicht Bestandteil dieses Auftrags

- vollständige Implementierung von `I18N.md`;
- automatischer Übersetzungsprovider;
- Sprachpaket-Download/-Löschung;
- vollständiges neues Designsystem;
- Sync-Engine/Offline-Queue;
- Store-App-Wrapper;
- neue Produktmodule.

## Tests

Regressionstests zuerst ergänzen/anpassen. Mindestens beweisen:

- `Start` + konfiguriertes GPS bleibt auch nach Reload Startkontext und rendert GPS als Startinhalt;
- kein Default-Welcome-Flash bei gültiger Startkonfiguration, soweit automatisiert belastbar prüfbar;
- HTML-Modus zeigt keinen zusätzlichen statischen Welcome-/Neutral-Block;
- GPS-Container erhält beim normalen Reload keinen falschen persistenten Fokusrahmen; echte Tastatur-Fokusindikatoren bleiben erhalten;
- gültiger User-Login benötigt nur einen Submit;
- `Show all functions` ist aus User Settings entfernt;
- persönliche Feature-/Bereichsauswahl bleibt funktional und verändert keine Berechtigungen;
- GPS-Genauigkeit wird nur in der Anzeige gerundet, Rohwert bleibt präzise;
- GPS-Zeit wird menschenlesbar/lokal formatiert;
- P1, Auth, CSRF, Module Access, Offline-Fallback und Appearance bleiben regressionsfrei.

## Abschluss

Gemäß `WORKFLOW.md` vollständig:

- fokussierte Tests;
- vollständige Test-Suite unter unterstützter PHP-8.1+-Runtime;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- Dokumentation wahrheitsgemäß aktualisieren;
- Commit und Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS, CodeQL und weitere erforderliche CI bis terminal abwarten;
- vollständigen Abschlussbericht nach `CHATGPT.md` schreiben und auf GitHub `main` verifizieren;
- erst danach Abschlussmeldung.

P4 darf weiterhin erst nach erneutem positiven Betreiber-Livetest als `LIVE BESTANDEN` gelten.
