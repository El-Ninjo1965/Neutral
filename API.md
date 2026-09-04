# NEUTRAL – API

**Status:** DETAILVERTRAG

**Geprüft:** 2026-09-03
**Autorität:** untergeordnet zu [`CORE-1.0.md`](CORE-1.0.md) und [`Architecture.md`](Architecture.md).

## 1. Geltungsbereich

Die Produktionsoberfläche ist der PHP-Router `Server/public/api/index.php`, erreichbar unter der zentral konfigurierten API-Basis. Der kanonische Produktionspräfix ist `/api/v1`; der bisherige Präfix `/api` bleibt vorerst kompatibel. Beim Shared-Hosting-Deployment leitet die Root-`.htaccess` alle öffentlichen `/api`-Pfade direkt und abschließend an diesen Router; Request-URI und Query bleiben für dessen kanonische Auswertung erhalten. `Web-App/public/api-client.js` nutzt `NeutralPublicPath`; der Resolver liest `basePath` aus `window.NeutralConfig` beziehungsweise `neutral-base-path` und leitet daraus `<Basis>/api/v1` ab.

`Server/node/bootstrap/server.js` bietet zusätzlich eine Node-Referenz- und Test-API. Sie ist tatsächlich vorhanden, aber keine Voraussetzung der Shared-Hosting-Produktion und nicht automatisch vertraglich identisch mit PHP.

Antworten der PHP-API verwenden grundsätzlich JSON-Umschläge von `JsonResponse`: Erfolg `{ "ok": true, "data": ... }`, Fehler `{ "ok": false, "error": { "message": ... }, "details": ... }` (Details abhängig vom Fehler).

## 2. Querschnittsverhalten

- **Auth:** PHP-Sessioncookie; optionaler Admin-Bootstrap-Token ist nur für autorisierte Setup-/Automationswege vorgesehen.
- **CSRF:** Zustandsändernde geschützte Requests benötigen `x-csrf-token`; `ApiClient` liest dazu `neutral_csrf`.
- **Rechte:** serverseitige Permissionprüfung; UI-Sichtbarkeit erteilt keine Rechte.
- **Request:** JSON-Body bei schreibenden API-Aufrufen; ungültiges JSON ergibt 400.
- **Versionierung:** **VORHANDEN** – `/api/v1` ist kanonisch, `/api` bleibt abwärtskompatibel; Antworten senden `X-Neutral-API-Version: 1`, unbekannte explizite Versionen wie `/api/v2` ergeben 404.
- **Timeout:** **VORHANDEN** – `ApiClient` beendet Requests kontrolliert über `AbortController`; `tests/api-timeout.test.js` prüft den Fehlerpfad.
- **Retry:** **FEHLT** – keine allgemeine Retry-/Backoff-Policy. Schreibrequests dürfen nicht blind wiederholt werden.
- **Offline:** **TEILWEISE** – Client erhält strukturierte Netzwerkfehler; ein validierter anonymer Modulkatalog wird installationsbezogen zwischengespeichert. Persistentes Schreibqueueing fehlt.

## 3. PHP-Endpunkte

Statuswerte: **VORHANDEN** bedeutet im PHP-Router nachweisbar. Die folgende Tabelle zeigt die kompatiblen Kurzpfade unter `/api`; für neue Aufrufer ist jeweils `/api/v1/...` verbindlich.

| Methode | Pfad | Zweck | Auth / Recht | Request | Response | Fehler / DB-Bezug | Status |
|---|---|---|---|---|---|---|---|
| GET | `/api/setup/status` | Setupstatus und Voraussetzungen | vor Aktivierung öffentlich; nach Aktivierung nur mit Recoveryflag und HTTP-Basic-Recoverytoken | – | Setupstatus | 404 ohne Flag, 401 ohne gültiges Token; 500 bei Runtime/DB | VORHANDEN |
| POST | `/api/setup/install` | DB anlegen, migrieren, Core-Daten seeden | vor Aktivierung öffentlich; nach Aktivierung nur mit Recoveryflag und HTTP-Basic-Recoverytoken | Installationsdaten/Environment | Installationsresultat | 404 ohne Flag, 401 ohne gültiges Token; 400/500; alle Coretabellen | VORHANDEN |
| GET | `/api/status` | öffentlicher Betriebs- und DB-Erreichbarkeitsstatus | öffentlich | – | Service, Umgebung, App und ausschließlich DB-Zustand | 500; DB-Ping | VORHANDEN |
| POST | `/api/auth/login` | Benutzer authentifizieren, Session starten | öffentlich, Credentials erforderlich | `username`, `password` | öffentliche Identität, CSRF/Sessionkontext | 400/401; `users`, `user_roles`, `roles`, `permissions`, `sessions` | VORHANDEN |
| POST | `/api/auth/logout` | aktive Session beenden | Session; CSRF | – | Logoutbestätigung | 401/403; `sessions` | VORHANDEN |
| GET | `/api/auth/me` | aktuelle Identität und effektive Rechte | Session | – | User/Rollen/Permissions | 401; Session/RBAC-Tabellen | VORHANDEN |
| GET | `/api/modules` | für Identität sichtbarer Modulkatalog | optional; ohne Session nur aktive Module gemäß gespeicherten `viewer`-Sichtrechten | – | `{modules, accessContext}`; je Modul bereinigtes `clientAccess` mit Modus/Sichtbarkeit/Nutzung | 500; `modules`, `module_state`, Rollenpermissions | VORHANDEN |
| GET | `/api/admin/sessions` | Sessions auflisten | `sessions.view` | Filter – | öffentliche Sessiondaten | 401/403; `sessions` | VORHANDEN |
| GET | `/api/admin/permissions` | Permissionkatalog | `roles.view` oder Adminberechtigung | – | Permissions | 401/403; `permissions` | VORHANDEN |
| GET | `/api/admin/users` | Benutzer suchen/listen | `users.view` | Queryfilter | Benutzerliste | 401/403; `users`, Rollen | VORHANDEN |
| POST | `/api/admin/users` | Benutzer anlegen | `users.manage`, CSRF | Username, E-Mail, Passwort, Rollen/Status | neuer öffentlicher User | 400/409/403; Benutzer/Rollen | VORHANDEN |
| GET | `/api/admin/users/{id}` | Benutzer lesen | `users.view` | – | User | 404/403; Benutzer/Rollen | VORHANDEN |
| PUT | `/api/admin/users/{id}` | Benutzer ändern | `users.manage`, CSRF | änderbare Userfelder | aktualisierter User | 400/404/409/403 | VORHANDEN |
| DELETE | `/api/admin/users/{id}` | Benutzer löschen | `users.manage`, CSRF | – | Bestätigung | 404/403; löscht abhängige Rollen/Sessions per FK | VORHANDEN |
| GET | `/api/admin/roles` | Rollen auflisten | `roles.view` | – | Rollen mit Rechten | 401/403; Rollen/Permissions | VORHANDEN |
| POST | `/api/admin/roles` | Rolle anlegen | `roles.manage`, CSRF | Rolle und Permissions | neue Rolle | 400/409/403 | VORHANDEN |
| GET | `/api/admin/roles/{id}` | Rolle lesen | `roles.view` | – | Rolle | 404/403 | VORHANDEN |
| PUT | `/api/admin/roles/{id}` | Rolle ändern | `roles.manage`, CSRF | Name/Beschreibung/Permissions | Rolle | 400/404/403; Systemrollenschutz | VORHANDEN |
| DELETE | `/api/admin/roles/{id}` | Rolle löschen | `roles.manage`, CSRF | – | Bestätigung | 400 für Systemrolle, 404/403 | VORHANDEN |
| GET | `/api/admin/settings` | Settings lesen | `settings.view` | – | Settingsobjekt | 401/403; `settings` | VORHANDEN |
| POST | `/api/admin/settings` | Settings aktualisieren | `settings.manage`, CSRF | Key-/Objektwerte | aktualisierte Settings | 400/403; `settings`, Audit | VORHANDEN |
| GET | `/api/admin/audit` | Audit filtern/listen | `audit.view` | Queryfilter | Auditeinträge | 401/403; `audit_log` | VORHANDEN |
| GET | `/api/admin/modules` | Admin-Modulkatalog | `modules.view` | – | Module/Lifecycle/Manifest | 401/403; Module/RBAC | VORHANDEN |
| GET | `/api/admin/modules/{id}` | Moduldetails | `modules.view` | – | Modul | 404/403 | VORHANDEN |
| GET | `/api/admin/modules/{id}/permissions` | Modulrechte/Rollenzuordnung | `modules.view`/Verwaltungsrecht | – | Definitionen/Zuweisungen | 404/403; RBAC | VORHANDEN |
| PUT | `/api/admin/modules/{id}/permissions` | Modulrechte Rollen zuweisen | Modulverwaltung, CSRF | Rollenzuordnungen | aktualisierte Zuordnung | 400/404/403; RBAC | VORHANDEN |
| POST | `/api/admin/modules/{id}/install` | entdecktes Modul registrieren | Modulverwaltung, CSRF | optional – | installiertes, inaktives Modul | 404/409/403; Module/Permissions | VORHANDEN |
| POST | `/api/admin/modules/{id}/activate` | Modul aktivieren | Modulverwaltung, CSRF | – | aktives Modul | 404/409/403; `module_state` | VORHANDEN |
| POST | `/api/admin/modules/{id}/deactivate` | Modul deaktivieren | Modulverwaltung, CSRF | – | inaktives Modul | 404/403 | VORHANDEN |
| POST | `/api/admin/modules/{id}/uninstall` | Modulregistrierung entfernen | Modulverwaltung, CSRF | – | Bestätigung | 404/403; Modulstate, modulbezogene Rechte/Settings; nur deklarierte sichere Tabellen | VORHANDEN |
| GET | `/api/admin/system/health` | System-/Voraussetzungszustand | Admin/Systemrecht | – | Healthchecks | 401/403/500; DB-Ping | VORHANDEN |
| GET | `/api/admin/diagnostics` | Runtimediagnostik | Admin/Systemrecht | – | Diagnoseobjekt | 401/403 | VORHANDEN |
| GET | `/api/admin/server` | Serverkonfiguration/-zustand | Admin/Systemrecht | – | sanitisiertes Serverobjekt | 401/403 | VORHANDEN |
| GET | `/api/server/test` | Verbindungsvoraussetzungen testen | geschützter Betriebskontext | – | Testresultat | 403/500 | VORHANDEN |
| GET | `/api/admin/database` | DB-Konfiguration/-status | Admin/Systemrecht | – | sanitisiertes DB-Objekt | 401/403; DB | VORHANDEN |
| GET | `/api/database/status` | DB-Erreichbarkeit/Migrationstatus | Betriebskontext | – | Status | 500; DB/Migrations | VORHANDEN |
| GET | `/api/admin/release/status` | Releasezustand | Admin/Systemrecht | – | Releaseobjekt | 401/403; `release_state` | VORHANDEN |
| GET | `/api/admin/providers`, `/api/providers` | konfigurierte Provider lesen | Adminvariante geschützt; öffentliche Variante gemäß Router | – | Providerliste | 403; Katalog/Runtime | VORHANDEN |
| GET | `/api/admin/connections`, `/api/connections` | Verbindungen lesen | Adminvariante geschützt | – | sanitiserte Verbindungen | 403; Runtimekonfiguration | VORHANDEN |
| GET | `/api/admin/system/inventory` | aggregiertes DB-Inventar für Portabilitätsprüfung | `backups.view` | – | Tabellenzahlen und Migrationszustand | 401/403/503; keine Zeileninhalte | VORHANDEN |
| POST | `/api/admin/modules/{id}/update` | inaktives registriertes Modul auf entdeckte Version aktualisieren | `role.write` oder Modul-Adminrecht + CSRF | – | aktualisiertes Modul | 404 nicht vorhanden; 409 aktiv/Downgrade | VORHANDEN |
| `GET/POST/PUT/PATCH/DELETE` | `/api/modules/{id}/{route}` | deklarierte Modulroute generisch ausführen | Route verlangt Auth + Modulrecht; Schreibwege zusätzlich CSRF | routenspezifisch | bereinigte Serviceantwort | 401/403/404/405/409/422 | VORHANDEN |
| GET | `/api/admin/backups` | verschlüsselte Backupmetadaten lesen | `backups.view` | – | ID, Erstellzeit, Größe | 401/403/503 | VORHANDEN |
| POST | `/api/admin/backups` | verschlüsseltes logisches Backup erzeugen | `backups.manage`, CSRF | – | Backup-ID und Metadaten | 401/403/503; verwaltete Coretabellen | VORHANDEN |
| GET | `/api/admin/backups/{id}/download` | verschlüsseltes Backup laden | `backups.view` | – | Binärartefakt | 400/401/403/404 | VORHANDEN |
| POST | `/api/admin/backups/upload` | verschlüsseltes Backup übertragen | `backups.manage`, CSRF | Binärartefakt bis 100 MiB | gespeicherte Metadaten | 400/401/403/413 | VORHANDEN |
| POST | `/api/admin/backups/{id}/restore` | Backup validieren und transaktional wiederherstellen | `backups.manage`, CSRF | – | Restorestatus; Sitzung endet | 400/401/403; verwaltete Coretabellen | VORHANDEN |
| GET | `/api/admin/updates`, `/api/updates` | Updatezustand lesen | Adminvariante geschützt | – | Updateinformationen | 403; Runtime | VORHANDEN |

## 4. Node-Referenz-API

`Server/node/bootstrap/server.js` implementiert zusätzlich Status/Health/Logs, Frameworkdiagnostik, Release/Maintenance, Auth, Connections, Providers, Backups/Restore, Setup/Aktivierung, Server-/DB-Tests, Devices, Licenses, Updates, Module sowie Benutzer-, Rollen-, Audit- und Settings-CRUD. Diese Endpunkte werden in Node-Integrationstests verwendet. Nur Endpunkte, die auch im PHP-Router vorhanden und geprüft sind, dürfen als Produktionsvertrag vorausgesetzt werden.

## 5. Erweiterungsregel

Neue Core-Endpunkte benötigen vor Implementierung: dokumentierten Vertrag, Auth-/Permissionentscheidung, Requestvalidierung, Fehlercodes, Datenbank-/Transaktionskonzept, Datenschutzprüfung, Tests und Eintrag in diesem Dokument. Module deklarieren ausschließlich relative Routen, Methoden, Service/Action, Permission und optional ein Mengenlimit im Manifest; `ModuleHttpKernel` bleibt der einzige produktive Dispatcher. Direkte fachliche Zweige im zentralen Router sind verboten.

Der anonyme Zugriff auf `/api/modules` überträgt keine Viewer-Identität und keine effektive Permissionliste. Die Viewer-Zuordnung steuert nur den öffentlichen Modulkatalog. Jede serverseitige Modulaktion benötigt weiterhin eine eigene authentifizierte Autorisierungsentscheidung.

## Client-Timeout – P3 IST

`ApiClient.request()` begrenzt Requests standardmäßig auf 10 Sekunden; `timeoutMs` kann pro Request gesetzt oder mit `0` bewusst deaktiviert werden. Wenn `AbortController` vorhanden ist, wird der Fetch abgebrochen; ältere Browser erhalten einen Promise-Timeout-Fallback. Das Ergebnis ist `{ok:false,status:408,code:"API_TIMEOUT"}`. Es gibt keinen automatischen Retry für Login oder andere Schreiboperationen.
