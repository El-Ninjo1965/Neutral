# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

## Zweck

Diese Datei enthält immer genau **einen aktuellen Betreiberauftrag für Codex**.

## Verbindlicher Übergabevertrag

1. Codex liest bei Aufforderung diese Datei vollständig.
2. `CODEX.md` repräsentiert den neuesten ausdrücklich erteilten Betreiberauftrag.
3. Codex übernimmt den Auftrag gemäß `WORKFLOW.md` vollständig in `CURRENT-TASK.md` und prüft vor Implementierung: `CODEX.md == CURRENT-TASK-Anforderungen`.
4. Erst danach beginnt die Implementierung.
5. Alte Inhalte von `CODEX.md` sind nach einer Ersetzung keine operative Wahrheit mehr.
6. Secrets, Passwörter, Tokens und lokale ENV-Werte gehören niemals in diese Datei.
7. Am Ende jedes Auftrags schreibt Codex seinen vollständigen Abschluss-/Statusbericht nach `CHATGPT.md` und veröffentlicht ihn zusammen mit dem finalen Projektstand nach GitHub.
8. `CHATGPT.md` muss die tatsächlichen Fakten enthalten: Ausgangscommit, finaler Commit, geänderte Dateien, Tests, offene Punkte, Device-Retest-Status, Push, FTPS, CodeQL, HEAD/origin-main und Working Tree.
9. Codex darf eine Chat-Abschlussmeldung erst nach dem in `WORKFLOW.md` vorgeschriebenen VERIFY/CLOSE erzeugen.

# Aktueller Auftrag

## P4 + Admin Appearance sauber und vollständig umsetzen

Dieser Auftrag ist ausdrücklich vom Betreiber freigegeben.

### Verbindliche Designentscheidung

`Admin → Appearance` ist der zuständige Bereich für:

- Theme
- Layout
- globale Startseiten-Konfiguration

`Admin → Settings` bleibt für System-/technische Einstellungen zuständig.

Die beiden Bereiche dürfen nicht mehr dieselbe View oder denselben fachlichen Inhalt anzeigen.

## Ziel 1 – Settings und Appearance vollständig trennen

Prüfe den aktuellen Stand und stelle sicher:

- `Settings` und `Appearance` sind fachlich und technisch getrennte Admin-Views.
- Navigation auf `Settings` zeigt ausschließlich System-/technische Einstellungen.
- Navigation auf `Appearance` zeigt ausschließlich UI-/Darstellungsfunktionen.
- Kein gemeinsames Copy/Paste-Rendering, kein Wiederverwenden derselben View für beide Menüpunkte.
- Bestehende funktionierende Einstellungen dürfen nicht verloren gehen.
- Keine Änderung an P1 / User-/Admin-Session-Trennung.

## Ziel 2 – P4 globale Startseite in Appearance

Unter `Admin → Appearance` muss eine neue globale Startseiten-Konfiguration vorhanden sein.

Der Administrator wählt genau einen von zwei Modi:

### Modus A – Modul

- dynamische Auswahl aus **allen aktuell aktivierten und als Startziel verfügbaren Modulen**;
- keine hartcodierte veraltende Modulliste, wenn das Framework bereits eine Registry/Manifest-/Modulquelle besitzt;
- neue aktivierte Module sollen später automatisch in der Auswahl erscheinen, sofern sie die Voraussetzungen erfüllen;
- deaktivierte bzw. nicht verfügbare Module dürfen nicht als gültiges Startziel angeboten werden;
- gespeicherte Auswahl muss nach Reload erhalten bleiben;
- beim App-Start wird das gespeicherte Modul als Startziel geöffnet.

### Modus B – Text / HTML

- freie Text-/HTML-Eingabe durch den Administrator;
- vollständiges HTML ist ausdrücklich erlaubt;
- Inline-CSS / Styles sind erlaubt;
- Links und Bilder sind erlaubt;
- JavaScript ist ebenfalls erlaubt;
- KEINE automatische HTML-Sanitization, die den vom Administrator eingegebenen Inhalt verändert;
- Betreiber akzeptiert bewusst das Risiko, da ausschließlich der geschützte Adminbereich diese Konfiguration ändern darf;
- Vorschau vor bzw. beim Speichern vorsehen, soweit dies sauber in die vorhandene Admin-UI passt;
- gespeicherter Inhalt muss nach Reload erhalten bleiben;
- beim App-Start wird dieser Inhalt als Startseite angezeigt.

## Sicherheits- und Berechtigungsgrenzen

- Nur der geschützte Adminbereich darf die globale Startseiten-Konfiguration ändern.
- Kein normaler User darf diese globale Einstellung verändern.
- Keine Secrets oder Zugangsdaten in Settings/Appearance speichern.
- Freies HTML/JS ist hier eine bewusste Betreiberentscheidung und darf nicht stillschweigend eingeschränkt werden.
- Bestehende Auth-/CSRF-/Admin-Schutzmechanismen müssen weiter gelten.

## Persistenz

Nutze den bestehenden Settings-/Config-Vertrag des Projekts, sofern fachlich passend.

Erfinde keine parallele zweite Konfigurationsarchitektur, wenn bereits ein zentraler Settings-Service bzw. Config-Manager existiert.

Die Konfiguration muss mindestens dauerhaft speichern:

- Startseitenmodus: `module` oder `html`
- gewähltes Modul, falls Modus `module`
- HTML/Text-Inhalt, falls Modus `html`

Bei ungültiger oder fehlender Konfiguration muss die App robust auf den bisherigen/default Startzustand zurückfallen und darf nicht in einer leeren oder kaputten Ansicht hängen.

## Startverhalten der User-App

Prüfe den tatsächlichen Startup-/Router-/Navigation-Flow und integriere P4 an der fachlich richtigen Stelle.

Anforderungen:

- Konfiguration wird beim Start zuverlässig geladen;
- Modus `module` öffnet das konfigurierte Modul;
- Modus `html` rendert den gespeicherten Inhalt als Startseite;
- Reload verhält sich konsistent;
- bestehende Navigation funktioniert danach weiterhin;
- kein Admin-Login oder Admin-Kontext wird in die User-App übertragen;
- Offline-first-Verhalten darf nicht unnötig beschädigt werden;
- wenn Serverkonfiguration temporär nicht verfügbar ist, verwende den bestehenden robusten Fallback-/Cache-Mechanismus des Projekts statt einen neuen Sonderweg zu erfinden.

## Vor Implementierung zwingend lesen

Mindestens vollständig prüfen:

- `WORKFLOW.md`
- `CURRENT-TASK.md`
- `ToDoNow.md`
- `STATUS.md`
- `TODO.md`
- `VISION.md`
- `CORE-1.0.md`
- `Architecture.md`
- `Functions.md`
- `DOCUMENTATION.md`
- aktuelle Admin-Navigation und Admin-Views
- aktuellen Settings-/Config-Manager
- aktuellen Settings-Service/API-Pfad
- Startup-/Router-/User-App-Code
- relevante Tests

Historische Reports nur bei konkretem Bedarf lesen; sie sind keine aktuelle operative Wahrheit.

## Arbeitsweise

1. Repository synchronisieren und Git-Stand prüfen.
2. Auftrag vollständig in `CURRENT-TASK.md` übernehmen.
3. Prüfen: `CODEX.md == CURRENT-TASK-Anforderungen`.
4. Bestehenden Settings-/Appearance-/Startup-Datenfluss vollständig analysieren.
5. Vorhandene Tests identifizieren.
6. Regressionstests zuerst ergänzen bzw. anpassen, sodass das gewünschte Verhalten beweisbar wird.
7. Kleinste fachlich saubere Implementierung durchführen.
8. Keine unrelated Refactorings.
9. Keine bestehenden Verträge wegen lokaler Runtime-Probleme zurückbauen.
10. Dokumentation auf tatsächlichen Endstand aktualisieren.

## Mindesttests

Mindestens automatisiert abdecken:

### Settings / Appearance
- Settings und Appearance rendern unterschiedliche fachliche Views.
- Appearance enthält Startseiten-Konfiguration.
- Settings enthält diese UI nicht.

### Modulmodus
- aktive Module werden dynamisch angeboten.
- deaktivierte/ungültige Module nicht als gültiges Startziel.
- Auswahl wird gespeichert und wieder geladen.
- User-App startet im konfigurierten Modul.
- ungültiges gespeichertes Modul fällt sauber auf Default zurück.

### HTML-Modus
- HTML/Text wird gespeichert und wieder geladen.
- Inhalt wird als Startseite gerendert.
- freies HTML bleibt unverändert erhalten.
- Inline-Styles bleiben erhalten.
- JavaScript darf nicht durch eine neu eingeführte Sanitization entfernt werden.
- Wechsel von HTML → Modul und Modul → HTML funktioniert konsistent.

### Regression
- P1 User-/Admin-Session-Trennung bleibt grün.
- Admin-Auth/CSRF bleibt grün.
- bestehende Navigation bleibt grün.
- Startup ohne P4-Konfiguration bleibt kompatibel mit bisherigem Default.

## Abschlussprüfung

Vor Abschluss zwingend:

- fokussierte Regressionstests
- vollständige `npm test`-Suite unter unterstützter PHP-8.1+-Runtime
- PHP-Lint der betroffenen PHP-Dateien
- `node --check` der betroffenen JavaScript-Dateien
- `git diff --check`
- Produktionspaket bauen
- keine Secrets/Artefakte versehentlich aufgenommen
- relevante Dokumentation aktualisiert
- Commit
- Push nach `main`
- `HEAD == origin/main`
- Working Tree sauber
- FTPS bis terminalen Status abwarten
- CodeQL bis terminalen Status abwarten
- weitere erforderliche CI bis terminalen Status abwarten
- `CHATGPT.md` mit vollständigem Abschlussbericht aktualisieren und auf GitHub `main` verifizieren

## Statusregeln

- P1 bleibt `LIVE BESTANDEN`, sofern keine neue echte Regression nachgewiesen wird.
- P4 darf nach Code/Tests/Deploy höchstens als `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED` gelten.
- `LIVE BESTANDEN` für P4 erst nach echtem Betreiber-Test auf dem Gerät/Browser.
- Teilfertige Settings-/Appearance-Trennung darf nicht als Gesamtabschluss gemeldet werden.

## Betreiber-Retest nach erfolgreichem Deploy

Wenn Code, Push, FTPS und CodeQL erfolgreich abgeschlossen sind, muss `CHATGPT.md` konkrete kurze Device-Testschritte für den Betreiber enthalten, mindestens:

1. Admin → Settings öffnen und prüfen, dass dort keine Appearance-/Startseiten-Doppelansicht mehr erscheint.
2. Admin → Appearance öffnen.
3. Modus `Modul` wählen, ein aktives Modul speichern, App neu laden und Startziel prüfen.
4. Modus `Text/HTML` wählen, einfachen HTML-Inhalt speichern, App neu laden und Darstellung prüfen.
5. Danach wieder auf Modulmodus wechseln und prüfen, dass der Wechsel erhalten bleibt.
6. Parallel prüfen, dass P1 weiterhin korrekt ist: User-App-User und Admin-Login bleiben getrennt.

Erst nach positivem Betreiber-Livetest darf P4 später auf `LIVE BESTANDEN` gesetzt werden.
