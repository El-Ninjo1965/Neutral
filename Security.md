# NEUTRAL – Sicherheit

**Status:** DETAILVERTRAG

**Geprüft:** 2026-09-03
**Autorität:** untergeordnet zu [`CORE-1.0.md`](CORE-1.0.md) und [`Architecture.md`](Architecture.md).

## Statuslegende

- **VORHANDEN**: im Code implementiert.
- **TEILWEISE**: vorhanden, aber nicht vollständig produktionsreif oder nicht überall einheitlich.
- **FEHLT**: keine belastbare Implementierung.
- **GEPLANT**: verbindliches Ziel.

## 1. Login

**VORHANDEN:** `POST /api/auth/login` authentifiziert serverseitig gegen gespeicherte Passwort-Hashes. PHP verwendet `password_hash`/`password_verify`; die Node-Referenzruntime verwendet den Password-Hash-Service mit Argon2 bzw. unterstütztem Fallback. Fehlversuche liefern keine Passwortdaten.

**VORHANDEN:** Benutzer- und Adminlogin zeigen keine voreingestellte Kontoidentität. Die Kennungen `admin` und `Developer` sowie ein clientseitiger `Developer`-Fallback wurden testgetrieben entfernt; produktive Read-only-Prüfung `33808897301` bestätigt leere Felder. Dadurch wird weder ein Standardkonto suggeriert noch eine Kennung unnötig offengelegt.

**VORHANDEN/PRODUKTIONSABNAHME OFFEN:** PHP-Logins werden über `LoginRateLimiter` und den persistenten `PdoLoginAttemptStore` nach gehashter Kennung/IP sowie IP-weit gedrosselt. Positive, Sperr- und Fail-closed-Pfade sind automatisiert getestet; der echte produktive Lockout-/Retry-Ablauf muss noch ohne Offenlegung von Benutzer- oder IP-Daten abgenommen werden.

## 2. Logout

**VORHANDEN:** `POST /api/auth/logout` invalidiert die Serversession. Zustandsänderung verlangt Session/CSRF gemäß API-Schutz.

## 3. Sessions und Cookies

**VORHANDEN:** Servergenerierte Session-ID, serverseitige Sessionregistrierung, Ablaufzeit, Status und CSRF-Token. PHP setzt Cookieparameter anhand der Laufzeit; Adminseiten prüfen die serverseitige Identität und Rolle.

**TEILWEISE:** sichere Produktionswirkung hängt von HTTPS und korrekter Cookiekonfiguration (`Secure`, `HttpOnly`, `SameSite`) im aktiven Hostkontext ab. Browser-lokale Authzustände sind ausschließlich Clientartefakte und keine Autorität.

## 4. Tokens

**VORHANDEN/BEGRENZT:** Ein Admin-/Bootstrap-Zugriffstoken kann für autorisierte Setup- oder Automationpfade aufgelöst werden. Er darf keine normale interaktive Session ersetzen und muss hostlokal bleiben.

**FEHLT:** allgemeines Access-/Refresh-Token-System für Benutzer.

## 5. Remember / Refresh

**FEHLT:** kein dokumentierter produktiver Remember-me- oder Refresh-Token-Lifecycle. Eine spätere Umsetzung benötigt Rotation, Widerruf, Gerätebindung/Übersicht und sichere Speicherung.

## 6. Rollen und Rechte

**VORHANDEN:** Tabellen und PHP-Services für Rollen, Permissions, Benutzerrollen und Rollenpermissions. API-Endpunkte prüfen konkrete Permissionkeys. Systemrollen sind gegen allgemeines Löschen/Ändern geschützt; Modulppermissions besitzen Scope und deklarierte Standardrollen.

**VORHANDEN:** Für den öffentlichen Modulkatalog werden die gespeicherten Modulrechte der Systemrolle `viewer` in eine anonyme, auf `canView` und `canUse` reduzierte Browserentscheidung abgebildet. Die Rolle selbst, effektive Permissionlisten sowie Verwaltungsrechte werden nicht an den anonymen Client übertragen. Diese Abbildung gilt ausschließlich für lokale Modulsichtbarkeit/-nutzung und autorisiert keinen Serverendpunkt.

**VORHANDEN:** Produktive Modulrouten werden zentral nur für registrierte aktive Module ausgeführt. Der Server prüft Authentifizierung, deklarierte Permission und Schreibmethoden-CSRF, bevor Entry oder Servicefactory ausgeführt werden; quantitative Limits umfassen Nutzungsmessung und Mutation unter einer DB-Sperre. Server-Entries müssen im geschützten Modulpfad liegen; Pfadflucht und Manifest-/Entry-Identitätsabweichung werden abgelehnt. Migrationen sind SHA-256-gebunden und dürfen in neueren Definitionen nicht fehlen; Installation, Aktivierung und Update lehnen Downgrades ab. Deinstallation erfordert einen inaktiven Zustand. Destruktive Gegenmigrationen dürfen ausschließlich deklarierte eigene Tabellen verändern und müssen am Ende jede davon explizit entfernen; `retain` erhält Daten und Migrationshistorie.

**TEILWEISE:** Rechtebezeichnungen und Endpointmatrix müssen bei jeder API-Änderung synchron dokumentiert und getestet werden.

## 7. CSRF

**VORHANDEN:** Serversession enthält CSRF-Token. `ApiClient` sendet für POST/PUT/PATCH/DELETE `x-csrf-token`, und geschützte PHP-/Node-Schreibwege validieren ihn. Ungültiger CSRF-Kontext führt zu 403.

## 8. HTTPS

**GEPLANT/BETRIEBSPFLICHT:** Produktion wird ausschließlich über HTTPS betrieben. Der Code kann TLS nicht erzwingen, wenn der vorgeschaltete Host falsch konfiguriert ist. HSTS, Zertifikatserneuerung und Proxyheader sind Deploymentaufgaben.

## 9. Secrets

**VORHANDEN:** Das Produktions-Staging enthält eine Root-`.htaccess`, die Dotfiles, `Server/php/`, `Server/runtime/` und Verzeichnislisten vor HTTP-Zugriff schützt. GitHub- und manuelles FTPS-Deployment erzwingen Zertifikatsketten- und Hostnamenprüfung; der Workflow setzt sie unveränderlich auf `true`, manuell wird `FTP_SSL_CHECK_HOSTNAME=false` abgelehnt. Das FTPS-Ziel muss ausdrücklich gesetzt werden. Deploymentzustand wird nur nach einem SHA-256-Fingerprinttreffer desselben Protokolls, Servers, Ports, Benutzers, Ziels und Paketformats für verwaltete Löschungen wiederverwendet; Verbindungswerte werden nicht protokolliert und lftp erhält das Skript über stdin statt Prozessargumente.

**VORHANDEN ALS REPOSITORY-REGEL:** `.env` und `.env.*` sind ignoriert; `.env.example` enthält nur kanonische Schlüssel, sichere öffentliche Defaults und leere Geheimwerte. Datenbankpasswort, Bootstrap-Passwort, Backup-Schlüssel, Session-/Provider-Secrets sowie Recovery-, Auth- und Admin-Tokens werden ausschließlich hostlokal gesetzt. Die versionierte FTPS-Vorlage enthält nur neutrale Metadaten und ein leeres Passwort. Keine Zugangsdaten in Clientcode, Dokumentation, Logs, Commits oder Screenshots. Bereits offengelegte Tokens müssen rotiert werden.

**VORHANDEN:** Eine aktive Installation verbirgt `setup.php` sowie direkte und geroutete Setup-API-Endpunkte standardmäßig mit HTTP 404. Die Sperre berücksichtigt persistierten Runtimezustand und serverseitig erkannte Datenbankinstallation, stellt eine verlorene Runtime-Markierung aus DB-Evidenz wieder her und bleibt bei vollständig konfigurierter, aber nicht prüfbarer Datenbank konservativ geschlossen. Wiederherstellung erfordert das deaktivierte Flag `NEUTRAL_SETUP_RECOVERY_ENABLED` und ein mindestens 32 Zeichen langes `NEUTRAL_SETUP_RECOVERY_TOKEN`, das per HTTP Basic Auth geprüft wird; beide Werte werden nach dem Recoveryfenster entfernt. Der öffentliche Status enthält nur Betriebsbereitschaft und keine Environmentpfade, Datenbanknamen, Datenbankbenutzer oder internen Fehlertexte.

## 10. Datenbankzugriff

**VORHANDEN:** ausschließlich serverseitig über PDO/Services; Passwörter bleiben in Environmentkonfiguration; relevante Services nutzen vorbereitete Statements. Schema nutzt Foreign Keys und eindeutige Indizes.

**TEILWEISE:** Least-Privilege-DB-Rollen, Schlüsselrotation und produktive DB-Audits sind Betreiberaufgaben und noch nicht vollständig automatisiert.

**VORHANDEN:** PHP-Logins werden persistent nach gehashter Kennung/IP und IP-weit gedrosselt. Standardmäßig sperren fünf kombinierte beziehungsweise zwanzig IP-weite Fehlversuche für 15 Minuten; ein nicht prüfbares Drosselungsbackend fällt in Produktion geschlossen aus.

**VORHANDEN:** Portabilitätsbackups enthalten ausschließlich verwaltete Neutral-Tabellen, schließen Sessions und Login-Drosselungszustand aus und werden mit AES-256-GCM sowie einem hostlokalen Schlüssel von mindestens 32 Zeichen authentifiziert verschlüsselt. Restore prüft Envelope, GCM-Tag, Format, Hash und Tabellennamen vor der Transaktion. Backup-APIs benötigen serverseitige Rechte; Mutationen zusätzlich CSRF.

## 11. Lokale Speicherung

**TEILWEISE:** IndexedDB und localStorage speichern Clientzustand. Sie sind nicht automatisch verschlüsselt. Sessiongeheimnisse, Passwörter und serverseitige Autorität dürfen dort nicht dauerhaft abgelegt werden. Für personenbezogene Offline-Daten fehlen noch allgemeine Verschlüsselungs-, Lösch- und Exportverträge.

Der Offline-Modulkatalog enthält nur öffentliche Modulmetadaten und bereinigte anonyme Zugriffsflags. Nur Antworten mit bestätigtem anonymem Kontext werden gespeichert; authentifizierte oder strukturell ungültige Kataloge werden nie als anonymer Fallback verwendet. Ohne gültigen Cache bleibt der Zugriff geschlossen.

## 12. Datenschutz

**GEPLANT:** Datenminimierung, Zweckbindung, Transparenz, Löschung, Export, Aufbewahrungsfristen und Schutz lokaler Gerätedaten. GPS-Daten sind besonders sensibel; Berechtigung, sichtbarer Status und begrenzte Speicherung sind Pflicht.

**FEHLT:** vollständiges projektweites Dateninventar und formales Lösch-/Exportkonzept.

## 13. Eingabe, Fehler und Logging

**VORHANDEN/TEILWEISE:** JSON-Parsing, grundlegende Payloadvalidierung, zentrale Fehlerantworten und Audit-/Logservices existieren. Produktionsantworten dürfen keine Stacktraces oder Secrets enthalten. Dateiuploads und neue Endpunkte benötigen eigene Größen-, Typ- und Inhaltsvalidierung.

## 14. Offene Prioritäten

1. PHP-Login-Drosselung und Missbrauchsschutz im produktiven HTTPS-Betrieb abnehmen.
2. Cookieflags im realen HTTPS-Betrieb automatisiert prüfen.
3. lokales Datenschutz-/Verschlüsselungsmodell für Offline-Daten definieren.
4. Refresh/Remember nur bei tatsächlichem Bedarf mit Rotation entwerfen.
5. Securitytests für jede neue API, Modulpermission und Migration verpflichtend halten.

Client-Modulkonfiguration wird unter `moduleSettings.<id>` isoliert. Schlüssel, die Passwörter, Secrets, Tokens, Private Keys oder Credentials darstellen, werden vom öffentlichen Configvertrag abgelehnt; serverseitige Geheimnisse bleiben ausschließlich in hostlokaler Serverkonfiguration.

Der Browser-Fehlerpfad redigiert sensible Kontextschlüssel sowie typische Token-/Passwortmuster in Meldung und Stack. Das öffentliche Fehler-Event transportiert keinen rohen `Error`; das In-Memory-Log ist begrenzt. Diese Schutzschicht ersetzt nicht die Pflicht, personenbezogene oder geheime Daten gar nicht erst als Diagnosekontext zu übergeben.

Die initiale `auth/me`-Prüfung läuft nach sichtbarer Shell und bleibt die Autorität für vorhandene Sessions. Eine erfolgreiche Loginantwort ist selbst eine serverseitig authentifizierte Identitätsentscheidung und wird ohne redundanten direkten `me`-Roundtrip übernommen. Geschützte Admininhalte bleiben bis bestätigter Serveridentität verborgen; Timeout/Offline erteilt keine Rechte.

## Device sessions and administrative boundary (2026-09-09)

The User-App has no administrative capabilities. Core administrative permissions are never assigned to the `user` or `viewer` system roles; existing installations remove those legacy grants through schema migration. Module permissions remain declarative and are the only permissions intended for User-App functionality.

A browser installation uses a cryptographically random 128-bit installation identifier. It is not a hardware fingerprint and contains no credential. Authentication secrets remain in HttpOnly, Secure-on-HTTPS, SameSite=Lax cookies; no bearer or remember secret is stored in localStorage. Device sessions default to 30 days, are refreshed from authoritative user/role state, are individually revocable, and are constrained by the central `AUTH_MAX_DEVICES_PER_USER` setting (default five). Logout revokes the current server session. Account disablement and restore invalidate authentication; security-sensitive user changes may call the central revoke-all operation. Revoked/expired sessions are omitted from the active-device view and are cleanup-eligible after 30 days.

Threats addressed include stolen cookies (server revocation, expiry, CSRF and rotation on login), uncontrolled device proliferation (central limit), privilege drift (permissions recalculated and legacy role migration), and device tracking (random installation ID only; no hardware fingerprint and no prominent IP collection).

## Phase 2 operations hardening

Operational readiness endpoints expose booleans/counts only and never configuration values, paths or credentials. Backup failures use stable safe codes while detailed causes remain in protected server diagnostics. Core migrations and automatic backups are CLI-only; production restore remains prohibited as a deployment smoke. Device identifiers remain random installation-local identifiers, not hardware fingerprints or authentication secrets.

## 2026-09-09 Device and Admin re-authentication clarification

A device ID identifies a browser installation, not a login attempt. On successful authentication, older active sessions for the same user/device ID are marked replaced; a different valid installation ID remains independent and device limits count distinct active IDs. User-Agent parsing is presentation-only and never a fingerprint or authorization input.

A non-admin identity in the isolated Admin cookie is cleared when the protected Admin entry renders Access Denied. The recovery link returns to `admin.php`, while the independent User-App session remains untouched. This changes no authorization decision and grants no permission.

## Permission areas and development audit reset

Permission `Area` names the protected product/security surface, not the grammatical subject of a key. Thus `user.read` means viewing user management in the **Admin** area; module keys remain **User-App** unless a separately reviewed Core-Admin contract protects the operation. GPS module permissions never replace `admin.read`, `admin.write` or `role.write` for Core lifecycle and role management.

The complete Audit reset is deliberately unavailable in production (404), requires an Admin session plus `admin.write`, and appears only in Development/Test. The request is logged immediately before deletion, but a successful complete reset necessarily deletes that request record as well; this limitation is displayed and documented. Production retains append-only audit history except confirmed bounded retention.

## Account, password, license and media contract (2026-09-09)

- Every initial, changed and bootstrap password is validated server-side as 8–25 characters with no whitespace. No letter, number, case or special-character composition is required. Passwords are one-way hashed and never returned or logged.
- Username is globally unique. E-mail is optional and unique when present; login accepts username and, when configured, e-mail. Profile fields are server validated and organization sharing is field-specific and default-off.
- `license.manage` does not confer System Admin access. Every delegated operation resolves the actor's own license on the server; global roles, permissions, settings, server, backup and audit operations remain unavailable.
- Device identity remains the random installation ID. UA/platform values are display-only. License/user device limits may be numeric or `unlimited`; revocation is required before replacing a device at a reached limit.
- Presence metrics mean “installation seen by this server”, not downloads. They store no IP history, GPS, hardware fingerprint or inferred offline use.
- Server-uploaded profile images are limited to validated JPEG/PNG/WebP up to 5 MB and enter `pending`; `approved`, `rejected` and `deleted` transitions retain moderation reason/note history. Anonymous viewers cannot upload and nothing is automatically public.

Schema migration is not controlled by request input: API bootstrap may apply only the checksummed migration definitions shipped in the deployed revision, under the existing database advisory lock. It never accepts arbitrary SQL. Readiness remains false when application fails, and the standalone CLI remains available for host diagnostics.

## Auth availability, delegated scope and media (2026-09-09)

Login never runs DDL or acquires a schema advisory lock inside the credential transaction. Deployment/API bootstrap owns idempotent migrations; authentication owns throttle, password, scoped session, device ID and CSRF only. License managers cannot choose global roles and every target query/mutation joins through their own managed license. Media upload is decode/MIME/size validated, stored with private permissions below `Server/runtime`, starts pending, and is delivered only by an ownership/moderation/status checked endpoint with `nosniff`.

## P0 authentication failure classification (2026-09-09)

Request handlers never execute auth schema DDL. `login_attempts` is provisioned only by the checksummed schema migration; runtime uses SELECT/INSERT/DELETE DML. Safe 503 details distinguish `AUTH_THROTTLE_UNAVAILABLE`, `AUTH_USER_LOOKUP_UNAVAILABLE`, `AUTH_PERMISSION_RESOLUTION_FAILED`, and `AUTH_SESSION_PERSISTENCE_FAILED`, accompanied only by a random correlation ID. They never expose exception messages, SQL, account identifiers, credentials or cookies. Invalid credentials remain 401 and device exhaustion remains 409 `DEVICE_LIMIT_REACHED`.

If `login_attempts` DML is unavailable, authentication rate limiting fails over to `Server/runtime/login-attempts.json`. The store contains only SHA-256 scope keys and bounded counters/timestamps, uses an exclusive filesystem lock and mode `0600`, and never stores usernames, IP plaintext, credentials, cookies or session data.
