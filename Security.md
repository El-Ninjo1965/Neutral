# NEUTRAL – Sicherheit

**Status:** AKTUELLER SICHERHEITSVERTRAG  
**Stand:** 2026-09-13  
**Autorität:** `CORE-1.0.md` und `Architecture.md`

## Grundsatz

Der Server ist die Vertrauensgrenze. Clientzustand, Navigation, Manifest-Visibility, Offlinecache oder lokale Permissions erteilen niemals Serverrechte.

## Authentifizierung

- Login wird serverseitig gegen gespeicherte Passwort-Hashes geprüft.
- Passwörter werden nicht im Client gespeichert oder protokolliert.
- Loginantworten dürfen keine unnötigen Identitätsinformationen preisgeben.
- Fehlversuche werden persistent und fail-closed gedrosselt.
- Logout invalidiert die aktuelle Serversession.

## Sessions

- Sessions werden serverseitig erzeugt, geprüft, abgelaufen und widerrufen.
- Browserinstallation und Session sind getrennte Konzepte.
- Geräteidentität verwendet eine zufällige persistente Installations-ID, keinen Hardwarefingerprint.
- Re-Login derselben User-/Installationskombination ersetzt ältere aktive Sessions dieses Geräts.
- Gerätelimits zählen unterschiedliche aktive Installations-IDs.
- Unlimited darf nicht als numerisches Null-Limit interpretiert werden.

## Cookies und CSRF

Produktion verwendet HTTPS und sichere Cookieparameter. Zustandsändernde Browserrequests benötigen einen gültigen CSRF-Kontext. Timeout, Offlinezustand oder Clientfallback erteilen keine Rechte.

## Rollen und Permissions

- Rollen und Permissions werden serverseitig verwaltet und geprüft.
- Modulrouten benötigen aktiven Lifecycle sowie die deklarierte Auth-/Permission-/CSRF-Prüfung.
- Navigation/Visibility ist nur Darstellung und darf Permissions weder ersetzen noch erweitern.
- User- und Viewer-Rollen erhalten keine administrativen Core-Rechte.
- Modulpermissions bleiben deklarativ und modulbezogen.

## Public/Offline Module

Die lokale `publicOffline`-Projektion enthält ausschließlich sanitisierten öffentlichen Modulzustand. Sie enthält keine Sessiongeheimnisse, effektiven User-Permissions, Packages, Tokens oder Credentials.

Lokale Sichtbarkeit oder Nutzung autorisiert keinen geschützten Serverendpunkt. Permission-sensitive Module werden nicht als öffentlicher Fallback persistiert.

## Modulserver

Der produktive Modulserver prüft generisch:

- registriertes und aktives Modul;
- Manifest-/Entry-Identität;
- geschützten Serverpfad;
- Authentifizierung;
- Permission;
- CSRF bei Mutationen;
- Mengenlimits;
- Migrationsintegrität und Checksums;
- sichere Update-/Uninstall-Bedingungen.

Modulcode darf nicht aus öffentlichen oder pfadflüchtigen Orten geladen werden.

## Secrets

- Secrets bleiben hostlokal und außerhalb des Repositorys.
- Keine Passwörter, Tokens, Private Keys oder Credentials in Clientcode, Logs, Dokumentation, Commits oder Screenshots.
- öffentliche Modulsettings lehnen secretartige Schlüssel ab.
- Setup-/Recovery-Secrets sind ausschließlich temporäre serverseitige Betriebsdaten.

## Datenbank

- Datenbankzugriff ausschließlich serverseitig über PDO/Services.
- vorbereitete Statements und validierte Eingaben.
- Migrationen und destruktive Moduloperationen dürfen ausschließlich erlaubte modul-eigene Ressourcen verändern.
- Least Privilege bleibt Betreiberpflicht.

## Backup und Restore

- Backups verwenden geschützte Berechtigungen und verschlüsselte Formate.
- Restore validiert Format, Integrität und Kompatibilität vor Mutation.
- Production Restore ist niemals Smoke-Test.
- Modul-eigene Daten und Medien müssen ihrem jeweiligen Backupvertrag entsprechen; Metadaten dürfen nicht als tatsächlich wiederhergestellte Dateien ausgegeben werden.

## Lokale Speicherung

IndexedDB/localStorage sind keine Serverautorität und nicht automatisch verschlüsselt. Passwörter, Sessiongeheimnisse und serverseitige Autorisierung dürfen dort nicht dauerhaft gespeichert werden.

Personenbezogene Offline-Daten sind zu minimieren und benötigen Lösch-/Export-/Schutzregeln.

## Uploads und Medien

Generische Medienfunktionen müssen mindestens prüfen:

- MIME und tatsächlichen Inhalt;
- Größenlimits;
- sichere IDs und Zielpfade;
- Traversal/Symlink/Executable-Angriffe;
- Replace/Delete-Rechte;
- Backup-/Restore-Zuordnung.

Öffentliche Nutzerinhalte benötigen einen expliziten Moderations-/Freigabevertrag.

## Fehler und Logging

- keine Stacktraces oder Secrets in Produktionsantworten;
- sensible Kontextschlüssel und typische Token-/Passwortmuster redigieren;
- Logs begrenzen und personenbezogene Daten minimieren;
- detaillierte Ursachen nur in geschützten Diagnosen.

## Deployment

- Produktion ausschließlich HTTPS;
- PHP-Core, Runtimezustände, Dotfiles und Secrets nicht öffentlich ausliefern;
- FTPS/TLS-Verbindungen validieren Zertifikat und Hostnamen;
- Deploymentzustand darf keine Zugangsdaten protokollieren.

## Offene Sicherheitsarbeit

Nur tatsächlich noch offene aktuelle Punkte gehören in `STATUS.md`/`CHATGPT.md`. Diese Datei enthält keine historischen Live-Fehler oder abgeschlossenen Reparaturberichte.