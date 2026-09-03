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
