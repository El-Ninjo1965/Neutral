# NEUTRAL Core 1.0 — Backup- und Restore-Vertrag

**Stand:** 2026-09-10  
**Klassifikation:** **BACKUP CONTRACT PARTIAL**

## 1. Tatsächliches Dateiformat

Ein Backup ist eine einzelne JSON-Datei mit der Endung `.neutral-backup`. Der äußere Container `neutral-encrypted-backup-v1` enthält nur Backup-ID, Erstellzeit, Base64-kodierten 12-Byte-Nonce, 16-Byte-GCM-Tag und den Base64-kodierten Ciphertext. Der Klartext besteht aus dem logischen Payload `neutral-logical-backup-v1` und dessen SHA-256-Prüfsumme. Das gesamte Payload wird mit AES-256-GCM authentifiziert verschlüsselt; die zufällige 128-Bit-Backup-ID ist Additional Authenticated Data. Der Schlüssel wird aus dem ausschließlich hostlokalen `NEUTRAL_BACKUP_KEY` per SHA-256 abgeleitet.

Es findet **keine Kompression** statt. JSON-Struktur und Base64 vergrößern das verschlüsselte Ergebnis gegenüber dem Klartext typischerweise; die Verschlüsselung selbst reduziert die Größe nicht.

## 2. Garantierter Datenbankinhalt

Create prüft zuerst, dass alle Core-Migrationen angewendet sind. Danach liest es innerhalb einer `REPEATABLE READ`-Transaktion sämtliche Zeilen und Spalten der folgenden 21 Tabellen:

1. `roles`
2. `permissions`
3. `users`
4. `user_roles`
5. `role_permissions`
6. `settings`
7. `modules`
8. `module_state`
9. `module_migrations`
10. `setup_status`
11. `audit_log`
12. `backups`
13. `release_state`
14. `user_profiles`
15. `packages`
16. `licenses`
17. `license_users`
18. `installation_presence`
19. `user_media`
20. `media_moderation_history`
21. `schema_migrations`

Damit sind innerhalb des aktuellen Core-Schemas insbesondere Konten und Passwort-Hashes, Profile, Rollen/Permissions und Zuordnungen, Settings einschließlich Appearance/System-/Modulsettings und Backup-Pfad, Modulregistrierung/-status/-migrationsnachweise, Packages/Entitlements, Licenses/Organizations, User-/License-/Package-Device-Limits, persistente Installation-Presence, Audit, Release-/Setupzustand sowie **Medienmetadaten** enthalten.

## 3. Bewusste und derzeitige Ausschlüsse

- `sessions` und `login_attempts` sind bewusst ausgeschlossen. Ein Restore leert beide Tabellen; alle Benutzer müssen sich danach neu anmelden und Login-Drosselzustände reisen nicht zwischen Installationen.
- `.env`, `NEUTRAL_BACKUP_KEY`, Datenbankpasswort, Session-/Provider-/Recovery-/Admin-Secrets und sonstiges Schlüsselmaterial sind niemals enthalten.
- Anwendungscode, Release-Dateien, Git-Historie, Deploymentmanifest, Caches, Logs, temporäre Dateien und Automatic-Backup-Laufstatus sind nicht enthalten.
- Die physischen Dateien aus `Server/runtime/user-media` sind **nicht enthalten**. `user_media` und Moderationshistorie sichern nur Metadaten; ein Restore auf einen leeren Host stellt die referenzierten Binärdateien nicht wieder her.
- Von Modulen deklarierte eigene Tabellen, aktuell beispielsweise `reference_notes_items`, gehören nicht zur Core-Tabelleliste und sind **nicht enthalten**. `modules`, `module_state` und `module_migrations` sichern nur Registrierung, Zustand und Migrationsnachweise.
- JSON-Fallbackdateien unter `Server/runtime/config` sind nicht enthalten. Im normalen datenbankbereiten Produktionspfad sind die maßgeblichen Settings/Audit-/Userdaten in den oben genannten Tabellen. Ein nur im Fallback entstandener Dateizustand ist nicht durch dieses Datenbankbackup garantiert.

Wegen der fehlenden Modul-Nutzdaten und Medienbinärdateien ist der Vertrag für einen vollständigen Wiederaufbau aller derzeit modellierten App-Daten **PARTIAL**, nicht COMPLETE. Das aktuelle Backup ist ein vollständiges logisches Backup der oben aufgelisteten Core-Tabellen, aber kein vollständiges Datei-/Modul-Datenarchiv.

## 4. Einordnung der beobachteten 27,8 KB

27,8 KB sind für eine junge Installation mit wenigen Konten, Rollen, Settings, Packages, Licenses, Auditzeilen und überwiegend kleinen/leeren Tabellen technisch plausibel. Der Container komprimiert nicht; JSON/Base64 verursachen zusätzlichen Platzbedarf. Die Größe beweist weder Vollständigkeit noch einen Defekt. Entscheidend sind Tabellenliste und Zeileninhalt nach authentifizierter Entschlüsselung.

Der isolierte Regressionstest erzeugt für jede der 21 garantierten Tabellen einen eindeutigen Datensatz, erstellt und verschlüsselt das Backup, verändert alle Tabellen, restauriert und vergleicht jeden Marker. Er bestätigt außerdem, dass Sessions geleert werden, ein absichtlich fehlschlagender Insert die gesamte Restore-Transaktion zurückrollt, falsche Schlüssel und Manipulation vor Mutation scheitern und Download-/Uploadbytes identisch bleiben. Produktive Datensatzinhalte wurden nicht gelesen oder ausgegeben. Ohne berechtigten, datensparsamen Tabelleninventurvergleich kann aus 27,8 KB allein keine Aussage über die konkrete Anzahl produktiver Records abgeleitet werden.

## 5. Restore-Sicherheitsvertrag

Vor jeder Mutation werden Envelope, Backup-ID, Nonce-/Taglänge, GCM-Authentizität, Payloadformat, SHA-256-Prüfsumme, exakte Schema-Version, vollständige Core-Tabellenmenge, erlaubte Tabellennamen und Zeilenstruktur geprüft. Upload führt dieselbe vollständige Payloadvalidierung jetzt bereits **vor** dem finalen Speichern durch. Unvollständige oder schemafremde, aber korrekt verschlüsselte Artefakte werden deshalb nicht mehr in das Inventar aufgenommen.

Der Datenbankimport läuft in einer Transaktion: Sessions/Loginversuche werden geleert, gesicherte Tabellen in umgekehrter Reihenfolge geleert und in definierter Reihenfolge wieder befüllt. Bei einem Fehler erfolgt Rollback; die isolierte Regression bestätigt, dass weder früh geleerte noch bereits befüllte Tabellen als Teilzustand verbleiben. Nach erfolgreichem HTTP-Restore wird die aktuelle Adminsession beendet.

## 6. Download und Upload

- Download erfordert eine Adminsession mit `backups.manage`, liefert exakt die gespeicherte verschlüsselte Datei als `application/octet-stream`, setzt einen neutralen `.neutral-backup`-Dateinamen und `Cache-Control: no-store`. Es findet keine Browserentschlüsselung statt.
- Upload ist CSRF-geschützt, erfordert `backups.manage`, streamt in eine zufällige temporäre Datei im konfigurierten Backupziel, begrenzt auf 100 MiB und benennt erst nach vollständiger kryptografischer, Schema- und Tabellenprüfung atomar auf die aus dem validierten Envelope stammende ID um.
- Backup-IDs akzeptieren ausschließlich 32 kleine Hexzeichen; Dateipfad-Traversal über IDs ist ausgeschlossen. Fehler entfernen die temporäre Datei.

## 7. Vollständiger Neuaufbau und sicherer Test

Ein Neuaufbau besteht aus:

1. identischem/kompatiblem Neutral Release aus Git oder einem verifizierten Produktionspaket;
2. neuer hostlokaler `.env` einschließlich Datenbankzugang und **dem zum Backup gehörenden** `NEUTRAL_BACKUP_KEY`;
3. leerer isolierter Testdatenbank, ausgeführten Core- und benötigten Modulmigrationen;
4. geschütztem, nicht öffentlichem Backupziel;
5. Upload und Restore des verschlüsselten Artefakts;
6. separater Wiederherstellung bewusst ausgeschlossener Medien-/Moduldateien und derzeit nicht gesicherter Modul-Nutzdaten aus einem eigenen, passenden Verfahren;
7. Prüfung von Tabelleninventar, Login mit neu erzeugter Session, Rollen, Settings, Packages/Licenses, Installation-Presence und Audit.

Der Restore-Test muss auf einer separaten Staging-/Testinstallation mit separater Datenbank und separatem Storage erfolgen. Vorher URL, Datenbankname und Storagepfad sichtbar gegen Produktion abgrenzen. Niemals den Restore-Endpunkt oder Restore-Button auf Produktion als Test verwenden.

## 8. Core-1.0-Gate

- **Bestanden:** verschlüsselter Export/Import der 21 verwalteten Coretabellen, Integritäts-/Schlüsselprüfung, exakte Tabellenmenge, atomarer Datenbankrollback, Sessioninvalidierung, geschützter Download/Upload und Größenlimit.
- **Offen:** generischer Vertrag und Implementierung für moduldeklarierte Nutzdatentabellen sowie Binärdateien/Medien; anschließend isolierter Empty-Host-Restore mit diesen Daten und realer Betreiberabnahme.

Daher lautet die Gesamteinstufung: **BACKUP CONTRACT PARTIAL**.

## 9. Version 2 – vollständiger verwalteter Datenumfang

Neue Backups verwenden `neutral-logical-backup-v2`. Zusätzlich zu den 21 Coretabellen werden die Tabellen aller installierten Module generisch aus `modules.manifest_json → database.tables` ermittelt und vollständig exportiert. Der Core enthält keinen fest verdrahteten Modulnamen. Restore erwartet auf dem kompatibel installierten Ziel exakt dieselbe deklarierte Tabellenmenge.

V2 enthält außerdem jede reguläre, nicht symbolisch verlinkte Datei der verwalteten Core-Medienablage als installationsneutralen logischen Pfad `user-media/<zufällige-id>.<typ>`, Länge, SHA-256 und Base64-Inhalt innerhalb des vollständig AES-256-GCM-verschlüsselten Payloads. Zulässig sind nur die vom Media-Service erzeugten Namen und Typen; Gesamtinhalt und Upload bleiben auf 100 MiB begrenzt. Restore validiert alle Pfade, Größen und Hashes vor DB-Mutation, verlangt ein leeres Ziel, schreibt zunächst in ein privates Stagingverzeichnis und finalisiert per Umbenennung. Vorhandene Medien werden niemals still überschrieben.

V1 bleibt lesbar und stellt seinen historischen 21-Tabellen-Teilumfang wieder her; es wird nicht nachträglich als Datei-/Modulvollbackup bezeichnet. Bei V2 ist der für das aktuelle Framework deklarierte verwaltete Core-, Modul- und Medienumfang vollständig. Anwendungscode, `.env`/Secrets, Logs, Caches, Sessions und Login-Attempts bleiben bewusst ausgeschlossen.

**Klassifikation des aktuellen V2-Vertrags: BACKUP CONTRACT COMPLETE (code-/isoliert verifiziert).** Der Core-1.0-Freeze bleibt dennoch von realem Automatic-Backup/Cron und weiteren Host-/Move-Gates abhängig; kein Produktions-Restore wurde ausgeführt.

Profile's retained `user_profiles` rows, including bounded processed avatar data, are covered by the portable database table payload; no original upload is retained.
