# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER PRÜFAUFTRAG – BACKUP-INHALT / VOLLSTÄNDIGKEIT / RESTORE-SICHERHEIT  
**Datum:** 2026-09-10

# Betreiber-Livebefund

Der aktuelle Produktionsstand wurde real auf iPad/Chrome geprüft.

Positiv bestätigt:

- `Backup storage path` wurde auf dem realen Host gesetzt und erfolgreich getestet.
- realer Pfad: `/home/web1819/backup_neutral/` außerhalb `public_html`.
- `Encryption key: Ready`.
- `Crypto: Ready`.
- `Database/schema: Ready`.
- `Protected storage: Ready`.
- ein manuelles Backup wurde erfolgreich erstellt.
- die Backup-Liste zeigt das erzeugte Backup mit Download/Restore/Delete.
- angezeigte Größe des real erzeugten Backups: ca. **27.8 KB**.

Der Betreiber möchte vor einem Restore wissen, **was dieses Backup tatsächlich enthält** und ob der Umfang fachlich vollständig genug ist, um die vorgesehenen verwalteten Plattformdaten zuverlässig wiederherzustellen.

Wichtig: **Keinen destruktiven Restore auf Produktion ausführen.**

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `Install-README-Server.md`, `ADMIN-UX-DECISIONS.md`, `WORKFLOW.md` und alle Backup-/Restore-Service-, Repository-, Schema-, Migration-, Download-, Upload- und Automatic-Backup-Dateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine Secrets, Keys, Tokens, Passwörter oder produktiven personenbezogenen Daten ausgeben.
5. `NEUTRAL_BACKUP_KEY` niemals anzeigen, zurückliefern, loggen oder committen.
6. Keine destruktive Produktionsaktion ausführen.

---

# 2. Backup-Format exakt analysieren

Ermittle end-to-end, was ein aktuelles Neutral-Backup enthält.

Dokumentiere konkret:

- Dateiformat / Container / Verschlüsselungsformat;
- welche Datenbereiche serialisiert werden;
- welche Datenbanktabellen vollständig enthalten sind;
- welche Tabellen absichtlich nicht enthalten sind;
- ob Settings enthalten sind;
- ob User, Rollen, Permissions, Packages, Licenses, Device-/Installationsdaten, Sessions, Audit, Moduleinstellungen und sonstige Core-Daten enthalten sind;
- ob Runtime-/Logdaten enthalten oder absichtlich ausgeschlossen sind;
- ob hochgeladene Dateien/Medien unterstützt werden und falls nein, wie der Vertrag dazu lautet;
- ob Anwendungscode enthalten ist oder bewusst **nicht** Bestandteil des Backups ist;
- wie sich ein vollständiger Neuaufbau zusammensetzt: Code aus Git/Release + `.env`/Secrets hostlokal + Restore der verwalteten Daten.

Nicht nur Doku übernehmen: tatsächlichen Codepfad `Create backup → serialize/export → encrypt → persist` prüfen.

---

# 3. Größe 27.8 KB fachlich einordnen

Die reale Backup-Datei ist ca. 27.8 KB groß.

Nicht pauschal als Fehler oder Erfolg bewerten. Stattdessen prüfen:

- welche Datenmenge im aktuellen System tatsächlich vorhanden ist;
- ob Kompression/Verschlüsselung verwendet wird;
- ob das Backup nur verwaltete Daten enthält;
- ob alle erwarteten Tabellen/Records tatsächlich im Export landen;
- ob es stille Ausschlüsse, Filter oder leere Bereiche gibt;
- ob ein Fehler dazu führen könnte, dass nur Metadaten statt Nutzdaten gesichert werden.

Erzeuge in isolierter Testumgebung einen reproduzierbaren Backup-Inhalt mit bekannten Testdaten und verifiziere anschließend, dass diese Daten tatsächlich im verschlüsselten Backup enthalten und nach Restore wieder vorhanden sind.

---

# 4. Backup-Vollständigkeitsvertrag definieren

Lege für Core 1.0 verbindlich fest, was Neutral unter **Backup** versteht.

Empfohlene Trennung:

## Muss enthalten

Alle persistent verwalteten Core-/App-Daten, die für eine funktionale Wiederherstellung nach Neuinstallation benötigt werden, soweit sie innerhalb des Neutral-Datenmodells liegen.

Mindestens prüfen:

- Benutzerkonten und Profile;
- Rollen und Permission-Zuordnungen;
- Packages/Entitlements;
- Licenses/Organizations;
- Package-/License-/User-Device-Limits;
- persistente Installation-/Device-Zuordnungen soweit fachlich sinnvoll;
- Settings und Appearance/Systemkonfiguration, soweit nicht secret-only;
- Modulstatus/-konfiguration;
- Audit-Daten nur wenn bewusst Teil des Vertrags;
- weitere persistente Coretabellen.

## Darf bewusst ausgeschlossen sein

- Anwendungscode/Release-Dateien;
- `.env`;
- Secrets und Schlüsselmaterial;
- Caches;
- temporäre Sessions, sofern Wiederherstellung dieser Sessions fachlich nicht gewollt ist;
- Runtime-/Logdaten, sofern ausdrücklich dokumentiert;
- sonstige reproduzierbare oder sicherheitskritische Hostdaten.

Jeden Ausschluss explizit dokumentieren.

---

# 5. Isolierter Restore-Test

In **isolierter Testumgebung**, niemals auf Produktion:

1. Testdaten mit eindeutig prüfbaren Werten anlegen.
2. Backup erstellen.
3. Ausgangszustand dokumentieren.
4. Daten gezielt verändern/löschen.
5. Restore ausführen.
6. Prüfen, ob alle vertraglich gesicherten Daten exakt zurückkehren.
7. Prüfen, ob absichtlich ausgeschlossene Daten nicht fälschlich erwartet werden.
8. Auth-/Security-Verträge nach Restore prüfen.
9. Migration-/Schema-Kompatibilität prüfen.
10. Prüfen, ob Restore bei falschem Schlüssel / beschädigtem Backup kontrolliert scheitert und niemals Teilzustände hinterlässt.

Restore muss transaktional bzw. anderweitig atomar genug sein, dass bei Fehler kein halb wiederhergestellter Zustand entsteht.

---

# 6. Download-/Upload-Vertrag prüfen

Prüfen:

- Download liefert exakt die verschlüsselte Backup-Datei;
- keine Entschlüsselung im Browser;
- Content-Type/Dateiname sinnvoll;
- Auth/Permission/CSRF soweit relevant;
- Upload akzeptiert nur das erwartete Backupformat;
- beschädigte/manipulierte Dateien werden sicher abgelehnt;
- keine Path-Traversal-/Arbitrary-File-Write-Risiken;
- Größenlimits und Fehlerbehandlung sind dokumentiert.

---

# 7. Ergebnis klassifizieren

Nach Analyse und Tests eines von drei Ergebnissen liefern:

- **BACKUP CONTRACT COMPLETE** – 27.8 KB ist für den aktuellen Datenbestand plausibel und der Backup-/Restore-Vertrag ist vollständig verifiziert.
- **BACKUP CONTRACT PARTIAL** – Backup funktioniert, aber bestimmte persistente Datenbereiche fehlen oder sind bewusst noch nicht abgedeckt.
- **BACKUP DEFECT** – Export/Restore sichert weniger als der dokumentierte Vertrag verspricht oder ist nicht zuverlässig wiederherstellbar.

Keine optimistische Einstufung ohne Beleg.

---

# 8. Nur notwendige Fixes

Wenn echte Lücken gefunden werden:

- nur generische Core-Backup-/Restore-Lücken beheben;
- keine CatchTrack-Fachlogik;
- keine Secrets in Backups aufnehmen;
- keine hostabhängigen Pfade hardcoden;
- bestehende erfolgreiche Backup-Storage-Path-Funktion nicht regressieren.

Danach vollständige Tests, PHP-Lint, JS-Syntax, `git diff --check`, Production package.

---

# 9. Dokumentation / Deployment

Mindestens aktualisieren, soweit betroffen:

- `CHATGPT.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `CORE-1.0-READINESS.md`
- `Install-README-Server.md`
- `Architecture.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Functions.md`

Wenn Code geändert wurde:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. Production-Smoke nur read-only;
4. **keinen Production-Restore ausführen**.

Wenn kein Code geändert werden muss, trotzdem die Analyse und belastbare Testevidenz in `CHATGPT.md` dokumentieren.

---

# 10. Betreiber-Retest nach diesem Auftrag

Der Betreiber soll danach nur noch wissen müssen:

- ob die 27.8 KB plausibel sind;
- welche Daten garantiert enthalten sind;
- welche Daten bewusst nicht enthalten sind;
- ob Download getestet werden kann;
- wie ein sicherer Restore-Test außerhalb Produktion durchgeführt wird;
- ob Backup/Restore damit als Core-1.0-Gate bestanden gelten kann.
