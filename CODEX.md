# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – PHASE 1 DIAGNOSE / NO FIXES  
**Datum:** 2026-09-09

# Aktueller Auftrag

## Live Admin Reality Check – Produktionsbefund gegen dokumentierten Abschluss prüfen

Der letzte Admin-Operations-Auftrag wurde code-seitig und in `CHATGPT.md` als abgeschlossen gemeldet. Der aktuelle reale iPad/Safari-Betreibercheck zeigt jedoch mehrere Abweichungen zwischen Dokumentation/Tests und dem tatsächlich ausgelieferten Produktionszustand.

**In dieser Phase nichts reparieren, nichts refactoren und keine neue Featurearbeit beginnen.** Zuerst systematisch die Root Causes ermitteln und einen belastbaren Ist-Bericht erstellen.

P1 und P4 bleiben `LIVE BESTANDEN` und dürfen durch spätere Arbeiten nicht regressieren.

---

# 1. Pflicht-Preflight

1. Vollständig mit `origin/main` synchronisieren und sicherstellen, dass gegen den aktuellen Stand gearbeitet wird.
2. Vollständig lesen:
   - `CHATGPT.md`
   - `CODEX.md`
   - `CURRENT-TASK.md`
   - `STATUS.md`
   - `TODO.md`
   - `ToDoNow.md`
   - `WORKFLOW.md`
   - `CHANGELOG.md`
   - `Architecture.md`
   - `Security.md`
   - `API.md`
   - `Database.md`
   - `Functions.md`
   - `CONNECTIONS.md`
   - `UI-UX.md`
   - relevante Install-/Deployment-/Backup-Dokumentation
3. Danach die tatsächlich betroffenen Implementierungs-, API-, Migration-, Test- und Deploymentdateien vollständig prüfen.
4. Abgleichen, welcher Commit aktuell auf `main` liegt und welcher Build/Commit produktiv ausgeliefert wurde.
5. Keine Secrets ausgeben oder in Diagnoseartefakte schreiben.

---

# 2. Reale Betreiberbefunde vom 2026-09-09

## A. Sessions

Realer Befund: In der Admin-UI sind keine bzw. nicht die erwarteten Geräte-Sessions sichtbar.

Das widerspricht dem letzten Abschlussbericht, laut dem persistente Device Sessions und eine Session Overview implementiert wurden.

Prüfen:

- Werden Device Sessions tatsächlich erzeugt und in der produktiven DB gespeichert?
- Wird die korrekte Session-/Device-Registry abgefragt?
- Gibt es Migrationen, die auf Produktion nicht ausgeführt wurden?
- Filtert die UI fälschlich alle Sessions heraus?
- Werden aktuelle Sessions durch Cleanup/Expiry/Revocation sofort entfernt?
- Existiert ein Deployment-/Schema-Drift zwischen Code und Produktion?

Noch keine Änderung vornehmen.

## B. Connections & Providers

Realer Befund: weiterhin keine verwertbaren realen Informationen sichtbar.

Prüfen:

- Welche autoritative Quelle sollte diese Seite laut aktuellem Code verwenden?
- Liefert der Server echte Runtime-/Providerdaten oder nur leere/optionale Zustände?
- Kommt die Antwort in Produktion an?
- Unterscheidet die UI korrekt zwischen "nicht konfiguriert" und "Fehler/keine Daten"?
- Wurde die zuletzt dokumentierte Umstellung auf autoritative Daten tatsächlich produktiv deployt?

## C. Server

Realer Befund: weiterhin im Wesentlichen wie vor dem letzten Auftrag; die erwarteten realen Runtime-/Healthinformationen sind nicht erkennbar.

Prüfen:

- reale API-Antwort,
- Health-/Runtime-Service,
- Berechtigungen,
- Base-Path/Endpoint-Routing,
- Deploymentstand,
- UI-Binding/Rendering.

## D. Database

Realer Befund: ebenfalls weiterhin wie vorher; erwartete sichere reale DB-Metadaten fehlen.

Prüfen:

- DB-Statusquelle und API,
- Produktionskonfiguration,
- Migration/Schema,
- Permission-/Admin-Scope,
- UI-Binding,
- ob Fehler absichtlich zu stark in "unavailable" normalisiert werden und dadurch Root Causes unsichtbar bleiben.

## E. Backups & Restore

Realer Screenshot-Befund:

`Backup creation failed: Backup service temporarily unavailable.`

Seite zeigt gleichzeitig:

- `Encrypted database backups`
- `Automatic scheduler: external-cron-required.`
- `Last success: No scheduled backup recorded.`
- `No backups available yet.`
- Button `Create backup`

Prüfen und exakt lokalisieren:

- Welcher Endpoint/Service beantwortet `Create backup`?
- Welche konkrete interne Fehlerbedingung wird auf `Backup service temporarily unavailable.` reduziert?
- Ist der Backup-Key vorhanden/lesbar?
- Sind Backup-Verzeichnis und Dateirechte korrekt?
- Ist die DB-Verbindung verfügbar?
- Sind alle verwalteten Tabellen vorhanden?
- Wurden alle Backup-Migrationen produktiv ausgeführt?
- Ist der Pfad auf Shared Hosting korrekt?
- Blockiert ein fehlender Cron fälschlich auch manuelle Backups? Das darf funktional nicht vermischt werden.
- Gibt es einen Unterschied zwischen Tests/Sandbox und Shared-Hosting-Produktion?

**Wichtig:** Keine Secrets, Schlüssel oder sensitive Pfade in den Bericht schreiben. Sensitive Details nur als vorhanden/fehlend/zugreifbar klassifizieren.

## F. Maintenance & Updates

Realer Befund: weiterhin keine bzw. nicht die erwarteten verwertbaren Release-/Updateinformationen.

Prüfen:

- Welche Datenquelle ist laut Code autoritativ?
- Werden Build-/Releaseinformationen im Produktionspaket überhaupt mitgeliefert?
- Ist der Deploy-Zeitpunkt ableitbar?
- Ist die UI aktuell oder läuft noch eine ältere Version?
- Gibt es einen Unterschied zwischen Maintenance-State und Release-Information, der in der UI nicht korrekt abgebildet wird?

## G. Settings – Backup-Intervall / manuelle Auswahl

Realer Betreiberbefund: Die gewünschte Auswahl ist weiterhin nicht vorhanden; angezeigt wird weiterhin ein fest/vorgegeben wirkender Wert von `14 Tage`.

Prüfen:

- Welche Setting-ID/Quelle erzeugt diesen Wert?
- Ist dies Backup-Retention, Backup-Intervall oder ein anderer 14-Tage-Vertrag?
- Welche Auswahloptionen sind im aktuellen Code tatsächlich vorgesehen?
- Wurde die gewünschte manuelle/konfigurierbare Auswahl implementiert, aber nicht deployed, oder nie implementiert?
- Stimmen `Settings`, Backend-Schema, Defaults und Dokumentation überein?

Keine UX-Änderung vornehmen, bevor die Bedeutung des 14-Tage-Werts eindeutig geklärt ist.

## H. Globaler Alert bleibt beim Seitenwechsel sichtbar

Screenshot-Befund: Die Backup-Fehlermeldung bleibt oben sichtbar, nachdem zu `Audit Log` navigiert wurde.

Prüfen:

- Ist der Alert globaler persistenter State?
- Wird Seiten-/Routenwechsel nicht zum Clear genutzt?
- Ist Persistenz absichtlich oder ein UI-State-Leak?
- Welche Alerttypen sollen global bleiben und welche nur seitenlokal sein?

## I. Audit Log UX

Screenshot-Befund: Teile der Filterleiste, insbesondere Datums-/Zeitraumfelder, sind nicht ausreichend selbsterklärend bzw. erscheinen ohne klare sichtbare Beschriftung.

Prüfen:

- existierende Labels/ARIA-Zuordnung,
- Tablet-/Safari-Darstellung,
- responsive Grid-Berechnung,
- Placeholder-only-UX,
- ob visuelle Labels durch CSS/Breakpoints verschwinden.

Noch keine kosmetische Änderung vornehmen; zuerst Ursache und Sollvertrag benennen.

---

# 3. Dokumentationswiderspruch ausdrücklich prüfen

`CHATGPT.md` meldet u. a. Device Sessions, autoritative Infrastrukturinformationen und Backup/Restore als abgeschlossen. Der reale Betreiberzustand widerspricht dem zumindest teilweise.

Zusätzlich ist `CURRENT-TASK.md` noch als `in Bearbeitung` markiert, obwohl alle Punkte abgehakt sind und der Auftrag in `CHATGPT.md` als abgeschlossen beschrieben wird.

Prüfe für jeden betroffenen Bereich getrennt:

1. **Code vorhanden?**
2. **Tests vorhanden und sinnvoll?**
3. **Migration vorhanden?**
4. **Migration produktiv angewendet?**
5. **Build enthält Änderung?**
6. **FTPS-Deploy enthält Änderung?**
7. **Produktionsendpoint liefert erwartete Daten?**
8. **UI konsumiert diese Daten korrekt?**
9. **Dokumentation entspricht dem realen Zustand?**

Keine Aussage "erledigt", nur weil Tests grün sind.

---

# 4. Systematische Diagnose – verbindliches Vorgehen

Für jedes Problem:

1. Fehler reproduzieren bzw. den Produktionspfad anhand vorhandener sicherer Diagnosemöglichkeiten nachvollziehen.
2. Letzte relevante Commits und Deployments prüfen.
3. Datenfluss rückwärts verfolgen: UI → API → Service → Runtime/DB/Filesystem/Migration.
4. Vergleich mit funktionierenden benachbarten Adminseiten/Services.
5. Eine konkrete Root-Cause-Hypothese pro Problem formulieren und mit Evidenz belegen.
6. Noch keine Reparatur durchführen.

Wenn Produktionszugriff für einen Teil nicht möglich ist, exakt trennen zwischen:

- **nachgewiesen**, 
- **starke Evidenz**, 
- **nicht prüfbar ohne Betreiber-/Hostzugriff**.

Nicht raten.

---

# 5. Erwartetes Ergebnis dieser Phase

Erstelle nach Abschluss der Diagnose einen kompakten, aber vollständigen Bericht mit Tabelle:

| Bereich | Live-Befund | Code-Stand | Produktionsstand | Root Cause | Evidenz | Fix nötig? | Priorität |

Mindestens für:

- Sessions
- Connections & Providers
- Server
- Database
- Backups & Restore
- Maintenance & Updates
- Settings / 14-Tage-Wert
- globaler Alert-State
- Audit-Log-Filter/Labels
- Dokumentationsstatus `CURRENT-TASK.md`

Danach zusätzlich:

1. Liste der exakt zu ändernden Dateien für Phase 2.
2. Liste nötiger Migrationen/Deploymentmaßnahmen.
3. Liste notwendiger Live-Retests auf iPad/Safari.
4. Klare Trennung zwischen Codefehler, Deploymentdrift, Konfigurationsproblem und externer Hostaufgabe.
5. Empfehlung für die Reihenfolge der Reparaturen.

**Noch keine Implementierung. Noch kein Commit mit Codefixes.**

Der Diagnosebericht soll am Ende in `CHATGPT.md` als neuer aktueller Übergabestand dokumentiert werden, ohne historische Evidenz zu löschen. `CURRENT-TASK.md` darf nur dann angepasst werden, wenn dies zur wahrheitsgemäßen Kennzeichnung dieses neuen Diagnoseauftrags nötig ist; keine vorzeitige "DONE"-Markierung.

---

# 6. Grenzen

- Keine Appearance-/i18n-Weiterentwicklung in diesem Auftrag.
- Keine neuen Features.
- Keine Änderung von P1/P4-Verträgen.
- Keine Fake-/Placeholder-Daten als "Fix".
- Keine Secret-Ausgabe.
- Keine symptomatischen Schnellfixes ohne Root Cause.
- Keine Produktionsdaten löschen.
- Keine Backup-/Restore-Experimente mit destruktivem Restore auf Produktion.

**Ziel dieser Phase ist ausschließlich: die Diskrepanz zwischen dokumentiertem Abschluss und realem Produktionszustand vollständig erklären.**
