# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-10
**Auftrag:** Backup-Inhalt, Vollständigkeit und Restore-Sicherheit belastbar prüfen
**Status:** **BACKUP CONTRACT PARTIAL** · ISOLIERTER RESTORE BESTANDEN · KEIN PRODUKTIONS-RESTORE

## Ergebnis

Das reale Backup von ca. 27,8 KB ist für den kleinen aktuellen Core-Datenbestand technisch plausibel, aber seine Größe ist allein kein Vollständigkeitsbeweis. Das Format komprimiert nicht; der verschlüsselte JSON-/Base64-Container ist eher größer als sein logischer Klartext. Produktive Datensatzinhalte oder Secrets wurden nicht ausgelesen.

Das Backup sichert nachweislich alle Zeilen und Spalten der 21 verwalteten, nicht flüchtigen Coretabellen. Dazu gehören Benutzer/Passwort-Hashes/Profile, Rollen/Permissions, Settings/Appearance, Modulregistrierung/-zustand, Packages, Licenses, Device-Limits, Installation-Presence, Audit, Setup-/Releasezustand, Medienmetadaten und Migrationsnachweise. `sessions` und `login_attempts` sind bewusst ausgeschlossen und werden beim Restore geleert.

Der Gesamtvertrag ist dennoch **PARTIAL**: Physische Medien aus `Server/runtime/user-media`, moduldeklarierte Nutzdatentabellen wie `reference_notes_items`, Code/Release, `.env`/Secrets, Logs, Caches und Runtime-Fallbackdateien sind nicht im Artefakt. Insbesondere reichen die gesicherten `user_media`-Metadaten auf einem leeren Host nicht zur Wiederherstellung der Binärdateien.

Der vollständige verbindliche Inhalt und alle Ausschlüsse stehen in `BACKUP-CONTRACT.md`.

## Durchgeführte sichere Prüfung

- Vollständige lokale Regression: **491/491 Tests bestanden**; PHP-Lint über 40 Dateien, JavaScript-Syntaxprüfung über 91 Dateien, Diffprüfung und Produktionspaket mit 112 Dateien bestanden.
- Reproduzierbarer isolierter Datensatz mit einem eindeutigen Marker in jeder der 21 garantierten Coretabellen erstellt.
- Backup über den echten Servicepfad serialisiert und AES-256-GCM-verschlüsselt.
- Alle Testtabellen gezielt verändert, danach ausschließlich in der isolierten SQLite-Testdatenbank restauriert und jeden Marker exakt verglichen.
- Bestätigt, dass Sessions beim Restore verschwinden und ein absichtlich fehlschlagender Insert die gesamte Datenbankmutation zurückrollt.
- Falscher Schlüssel, manipuliertes Artefakt, falsche Schema-Version, unvollständige Tabellenmenge, Traversal-ID und Größenüberschreitung scheitern kontrolliert vor einer Mutation.
- Download-/Uploadartefakt byteidentisch verglichen; keine Browserentschlüsselung.
- Eine Lücke geschlossen: Upload prüft nun bereits vor dem finalen Speichern Schema-Version, vollständige Tabellenmenge und Zeilenstruktur. Zuvor konnte ein korrekt verschlüsseltes, aber unvollständiges Artefakt gespeichert werden, obwohl Restore es später ablehnte.
- Es wurde **kein** Produktions-Restore, keine Produktionsmutation und kein manueller Produktions-SQL-Eingriff ausgeführt.
- Implementierungscommit `a903bde9777069833a0a4d879d5dbeaedb9da0b3` ist nach `origin/main` übertragen. CodeQL Run `34442654765` sowie FTPS Deploy Run `34442655508` sind erfolgreich; der ausschließlich lesende Produktionssmoke bestätigte passende Deploymentrevision, `migrationsReady:true`, HTTPS und die geschützten Auth-/Admin-/Core-Grenzen.

## Core-1.0-Gate

Der Datenbank-Backupkern ist lokal belastbar verifiziert. Das gesamte Backup-/Restore-Gate ist noch nicht bestanden, weil Modul-Nutzdatentabellen und Medienbinärdateien fehlen und ein vollständiger Empty-Host-Restore mit diesen Daten noch keinen Vertrag besitzt. Kein Core Freeze.

## Betreiberantwort

1. **Sind 27,8 KB plausibel?** Ja, für den derzeit kleinen, rein logischen Core-Datenbestand. Die Dateigröße beweist aber nicht die konkrete produktive Zeilenzahl.
2. **Garantiert enthalten?** Die 21 Tabellen aus `BACKUP-CONTRACT.md`, vollständig mit allen Zeilen/Spalten zum konsistenten Exportzeitpunkt.
3. **Bewusst/nachweislich nicht enthalten?** Aktive Sessions/Login-Drosselzustand, Secrets, `.env`, Code, Logs/Caches; außerdem derzeit Medienbinärdateien und moduldeklarierte Nutzdatentabellen.
4. **Kann Download getestet werden?** Ja: herunterladen, unverändert sicher verwahren und optional wieder in eine isolierte Testinstallation hochladen. Die Datei bleibt verschlüsselt.
5. **Wie Restore sicher testen?** Ausschließlich separate Staging-URL, separate leere Datenbank, separates Storage und den passenden hostlokalen Schlüssel verwenden; danach Dateninventar und neuen Login prüfen. Niemals Produktion als Restore-Testziel verwenden.
6. **Gate bestanden?** **Nein, PARTIAL**. Erst Modul-/Dateidatenvertrag ergänzen und danach einen isolierten vollständigen Empty-Host-Restore abnehmen.
