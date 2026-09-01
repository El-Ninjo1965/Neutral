# Production Authentication and Portability Design

**Status:** zur Freigabe  
**Datum:** 2026-09-01  
**Grundlage:** `CORE-1.0.md`, `Security.md`, `API.md`, `TODO.md`

## Ziel und Abgrenzung

Dieser Abschlussblock liefert vier zusammenhängende Nachweise: persistente PHP-Login-Drosselung, produktiven Session-/CSRF-Schreibfluss, Neuinstallation auf leerer MySQL-Datenbank sowie verschlüsseltes Backup, Restore und Umzug in eine isolierte Zielinstanz. Bestehende Geschäftsdaten werden vor jeder destruktiven Operation inventarisiert und gesichert. Ein vorhandener Bootstrap-Benutzer darf neu erzeugt werden; unbekannte fachliche Datensätze dürfen nicht stillschweigend gelöscht werden.

Nicht Bestandteil dieses Blocks sind allgemeine Modulrouten, Modul-SQL-Migrationen, Provideradapter, quantitative Entitlements oder API v1. Diese bleiben getrennte Core-1.0-Pakete.

## Sicherheitsmodell

Produktive Diagnose und Abnahme verwenden keine öffentlich committeten Tokens. Für einmalige Hostprüfungen wird zur Laufzeit ein zufälliges Geheimnis erzeugt, als GitHub-Repository-Secret hinterlegt und ausschließlich in ein temporäres, nicht versioniertes Deploymentartefakt injiziert. Das Artefakt akzeptiert nur HTTPS, vergleicht das Geheimnis konstantzeitlich, gibt ausschließlich aggregierte Tabellenzahlen aus und löscht sich nach abgeschlossener Prüfung. Geheimnisse, Passworthashes, Sessionwerte und Datensätze erscheinen weder in Logs noch in Testausgaben.

Vor Reset oder Restore gelten drei Sperren: erfolgreicher verschlüsselter Backup-Export, lokal verifizierbarer SHA-256-Hash des Artefakts und erfolgreich gelesene Inventarsumme. Bei einem Fehler bleibt die bestehende Installation unverändert. Der bevorzugte Abnahmeweg verwendet eine separate Datenbank und ein separates Webverzeichnis. Nur wenn das Hosting keine zweite Datenbank zulässt und das Inventar keine fachlichen Datensätze zeigt, darf nach gesichertem Backup die bestehende Neutral-Datenbank zurückgesetzt und unmittelbar wiederhergestellt werden.

## PHP-Login-Drosselung

Eine neue Tabelle `login_attempts` speichert keine Klartextkennung und keine Klartext-IP. Schlüssel sind SHA-256-Hashes aus normalisierter Kennung und IP; gespeichert werden Fehlversuche, erstes/letztes Auftreten und Sperrende. Die Drosselung prüft sowohl den kombinierten Kennung/IP-Schlüssel als auch einen IP-Schlüssel, damit Angreifer weder einen Benutzer gezielt unbegrenzt testen noch Kennungen rotieren können.

Standardvertrag:

- maximal fünf Fehlversuche je Kennung/IP innerhalb von 15 Minuten,
- maximal 20 Fehlversuche je IP innerhalb von 15 Minuten,
- anschließend 15 Minuten Sperre,
- HTTP 429 mit generischer Meldung und `Retry-After`,
- erfolgreiche Anmeldung löscht nur die passenden Kennung/IP-Zähler,
- abgelaufene Einträge werden opportunistisch gelöscht,
- Datenbankfehler führen in Produktion zu einer generischen 503-Antwort; Authentifizierung fällt nicht ungedrosselt offen aus.

Die Grenzwerte sind über hostlokale Environmentwerte konfigurierbar, bleiben aber ohne Konfiguration bei den sicheren Defaults. Drosselungsentscheidungen und Aktualisierungen laufen transaktional beziehungsweise über atomare MySQL-Upserts.

## Backupformat und Restore

Der PHP-Core erhält einen eigenständigen `DatabaseBackupService`. Er exportiert ausschließlich die von `SchemaMigrator` verwalteten Neutral-Tabellen in definierter Abhängigkeitsreihenfolge. Das logische Format enthält Formatversion, Core-/Schema-Version, Erstellzeit, Tabellenlisten, Spaltendefinitionen, Zeilen und einen Inhalts-Hash. Es enthält keine Runtime-Dateien oder `.env`-Werte.

Jedes Artefakt wird mit AES-256-GCM und einem hostlokalen `NEUTRAL_BACKUP_KEY` von mindestens 32 Zeichen verschlüsselt. Nonce und Authentifizierungstag stehen im Envelope; der Schlüssel selbst niemals im Artefakt. Backups liegen außerhalb des öffentlichen Webroots unter `Server/runtime/backups`. Download, Upload, Erzeugung und Restore sind nur für eine Adminsession mit CSRF und `backups.manage` zulässig. Dateinamen werden serverseitig erzeugt; Pfade aus Requests werden nie direkt verwendet.

Restore validiert Formatversion, GCM-Tag, Inhalts-Hash, erwartete Tabellennamen und Schema-Kompatibilität vor der ersten Mutation. Danach werden Daten in einer DB-Transaktion in umgekehrter FK-Reihenfolge geleert und in Vorwärtsreihenfolge eingefügt. Bei Fehler erfolgt Rollback. Sessions und Login-Drosselungszustand werden nicht portiert; nach Restore ist eine neue Anmeldung erforderlich. Das Backup selbst bleibt nach Restore erhalten.

## API und Bedienweg

Folgende PHP-Endpunkte werden verbindlich:

- `GET /api/admin/system/inventory`: aggregierte Tabellenzahlen und Schema-/Migrationszustand, keine Zeileninhalte.
- `GET /api/admin/backups`: Metadaten vorhandener verschlüsselter Backups.
- `POST /api/admin/backups`: verschlüsseltes Backup erzeugen.
- `GET /api/admin/backups/{id}/download`: verschlüsseltes Artefakt herunterladen.
- `POST /api/admin/backups/upload`: verschlüsseltes Artefakt für einen Umzug hochladen.
- `POST /api/admin/backups/{id}/restore`: validieren und transaktional wiederherstellen.

Alle schreibenden Endpunkte benötigen Session, Adminrecht und CSRF. Fehlerantworten enthalten keine SQL-Texte, Pfade oder Secrets. Backup- und Restoreereignisse werden ohne Payloadinhalte auditiert.

## Abnahmesequenz

1. Aktuellen Produktivbestand aggregiert inventarisieren.
2. PHP-Drosselung testgetrieben implementieren; negative und positive Loginfälle lokal prüfen.
3. Backupservice und API testgetrieben implementieren; Manipulation, falscher Schlüssel, Pfadtraversal, Rollback und Sessionausschluss prüfen.
4. Security-Review ohne offene kritische, wichtige oder mittlere Findings abschließen.
5. Committen, pushen, CodeQL und FTPS-Deployment abwarten.
6. Produktiv mit bestehendem oder kontrolliert neu erzeugtem Admin anmelden; Cookieflags, `/auth/me`, CSRF-Ablehnung, erlaubte Settings-Schreiboperation, Rückänderung und Logout prüfen.
7. Verschlüsseltes Produktivbackup erzeugen und Hash/Inventar sichern.
8. Isolierte Zielinstanz auf leerem Webverzeichnis und leerer Datenbank installieren.
9. Backup hochladen und wiederherstellen; Tabellenzahlen, Benutzerlogin, Rechte und eine reversible Schreiboperation vergleichen.
10. Zielinstanz unter eigener temporärer URL als Umzugsnachweis prüfen und anschließend entweder bewusst behalten oder vollständig entfernen. Die bestehende Produktionsinstanz bleibt der autoritative Dienst.
11. `STATUS.md`, `TODO.md`, `Security.md`, `API.md`, Installations- und Umzugsanleitung mit datierten, geheimnisfreien Nachweisen aktualisieren.

## Abnahmekriterien

- Automatisierte Tests zeigen Red/Green für Loginlimits und Backup/Restore; Gesamtsuite bleibt grün.
- Sechster Fehlversuch derselben Kennung/IP und 21. IP-weiter Fehlversuch liefern 429 samt `Retry-After`.
- Erfolgreicher Produktivlogin verwendet Secure-, HttpOnly- und SameSite-Cookies; Schreibrequest ohne CSRF wird abgewiesen, mit CSRF akzeptiert und rückgängig gemacht.
- Inventar vor Backup und nach Restore stimmt für alle portierten Tabellen überein.
- Manipuliertes oder mit falschem Schlüssel geöffnetes Backup verändert keine Daten.
- Login auf der Zielinstanz funktioniert; alte Sessions funktionieren dort nicht.
- Repository, öffentliche Antworten, Actions-Logs und Backup-Metadaten enthalten keine Secrets.
- FTPS-Deployment und CodeQL sind erfolgreich; der Arbeitsbaum ist sauber und `main` entspricht `origin/main`.

## Fehler- und Rückfallstrategie

Scheitert Inventar oder Backup, endet die produktive Abnahme ohne Reset. Scheitert die isolierte Installation, bleibt Produktion unverändert und die Zielinstanz wird als fehlgeschlagen dokumentiert. Scheitert Restore, erzwingt die Transaktion Rollback; das Ziel kann anschließend aus dem unveränderten Backup neu aufgebaut werden. Ein Wechsel der autoritativen Domain ist nicht Bestandteil dieses Blocks und erfolgt nicht automatisch.
