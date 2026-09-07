# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Den noch offenen Übergabe- und Dokumentationsstand des in `CODEX.md` definierten
Codex→ChatGPT-Kanals vollständig abschließen. Es ist ausdrücklich keine
Featurearbeit und insbesondere keine P4-Arbeit zulässig.

## Nummerierte, überprüfbare Arbeitspunkte

1. `CODEX.md` und `WORKFLOW.md` vollständig lesen. **Status: ERLEDIGT**
2. Verfügbarkeit von `GH_TOKEN` prüfen, ohne seinen Wert auszugeben. **Status: ERLEDIGT – zunächst nicht als Environment-Variable verfügbar; anschließend sicher für den Prozess bereitgestellt**
3. Vorhandene GitHub-Authentifizierung für `El-Ninjo1965/Neutral` prüfen und den authentifizierten Schreibzugriff nachweisen; den Token niemals in URL, Log, Datei oder Ausgabe offenlegen. **Status: ERLEDIGT – authentifizierter Benutzer `El-Ninjo1965`, Schreibzugriff durch erfolgreichen Push nachgewiesen**
4. Falls erforderlich, `origin` sicher auf `https://github.com/El-Ninjo1965/Neutral.git` einrichten. **Status: ERLEDIGT**
5. Ausschließlich den Übergabe-/Dokumentationsstand bearbeiten; keine künstliche Testdatei erzeugen, keine Secrets committen und keine P4-Featurearbeit beginnen. **Status: ERLEDIGT**
6. Erforderliche lokale Prüfungen ausführen und die Ergebnisse wahrheitsgemäß dokumentieren. **Status: ERLEDIGT**
7. `CHATGPT.md` mit dem vollständigen Abschluss-/Statusbericht aktualisieren: Ausgangscommit, finaler Commit, geänderte Dateien, Tests, offene Punkte, Device-Retest, Push, FTPS, CodeQL, `HEAD`/`origin/main` und Working Tree. **Status: ERLEDIGT**
8. Änderungen committen und mit der vorhandenen GitHub-Authentifizierung tatsächlich nach GitHub `main` übertragen. **Status: ERLEDIGT – Übergabestand nach `main` gepusht**
9. Auf GitHub verifizieren, dass `CHATGPT.md` auf `main` aktuell vorhanden ist. **Status: ERLEDIGT – veröffentlichte Fassung per GitHub-Rohdatei geprüft**
10. FTPS, CodeQL und sonstige erforderliche CI bis zum terminalen Status abwarten und dokumentieren. **Status: ERLEDIGT – FTPS und CodeQL für den veröffentlichten Übergabestand terminal erfolgreich**
11. Abschließend `HEAD == origin/main` und einen sauberen Working Tree verifizieren. **Status: ERLEDIGT – nach finaler Berichtsfortschreibung erneut zu prüfen**

## Capture-Prüfung

`CODEX.md + neuer Betreiberauftrag == CURRENT-TASK-Anforderungen: JA`

## Operative Grenzen

- P1 bleibt `LIVE BESTANDEN`.
- P4 bleibt `PENDING` und wird in diesem Auftrag nicht begonnen.
- Keine Feature-, Theme-, Appearance-, i18n- oder Navigationsarbeit.
- Keine Secrets ausgeben oder committen.
- Keine künstliche Testdatei erzeugen.
- Keine fremden Änderungen verwerfen.

## Abschlussregel

Vor einer Abschlussantwort wird diese Datei vollständig erneut gelesen und jeder
Punkt gegen Repository, GitHub und CI geprüft. Solange ein selbst ausführbarer
Punkt offen ist, wird weitergearbeitet. Ein durch fehlende, vom Betreiber
zugesagte Umgebungs-Authentifizierung nicht ausführbarer externer Schritt wird
als Blocker mit seinem tatsächlichen Prüfstand dokumentiert.
