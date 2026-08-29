# NEUTRAL – API

## 1. Geltungsbereich

Die Produktionsoberfläche ist der PHP-Router `Server/public/api/index.php`, erreichbar unter der zentral konfigurierten API-Basis. Beim Shared-Hosting-Root-Deployment leitet die Root-`.htaccess` `/api` nach `Server/public/api/`; dort leitet `Server/public/api/.htaccess` Unterpfade an den Router. `Web-App/public/api-client.js` liest die Basis aus `window.NeutralConfig.apiBase` oder dem Meta-Element `neutral-api-base`; die konkrete öffentliche Basis darf nicht im Client-Core fest codiert werden.

`Server/node/bootstrap/server.js` bietet zusätzlich eine Node-Referenz- und Test-API. Sie ist tatsächlich vorhanden, aber keine Voraussetzung der Shared-Hosting-Produktion und nicht automatisch vertraglich identisch mit PHP.

Antworten der PHP-API verwenden grundsätzlich JSON-Umschläge von `JsonResponse`: Erfolg `{ "ok": true, "data": ... }`, Fehler `{ "ok": false, "error": { "message": ... }, "details": ... }` (Details abhängig vom Fehler).

## 2. Querschnittsverhalten

- **Auth:** PHP-Sessioncookie; optionaler Admin-Bootstrap-Token ist nur für autorisierte Setup-/Automationswege vorgesehen.
- **CSRF:** Zustandsändernde geschützte Requests benötigen `x-csrf-token`; `ApiClient` liest dazu `neutral_csrf`.
- **Rechte:** serverseitige Permissionprüfung; UI-Sichtbarkeit erteilt keine Rechte.
- **Request:** JSON-Body bei schreibenden API-Aufrufen; ungültiges JSON ergibt 400.
- **Versionierung:** **FEHLT** – kein URL-/Header-basierter API-Versionsvertrag.
- **Timeout:** **FEHLT** – `ApiClient` setzt keinen zentralen Timeout.
- **Retry:** **FEHLT** – keine allgemeine Retry-/Backoff-Policy. Schreibrequests dürfen nicht blind wiederholt werden.
- **Offline:** **TEILWEISE** – Client erhält strukturierte Netzwerkfehler; persistentes Queueing fehlt.

## 3. PHP-Endpunkte

Statuswerte: **VORHANDEN** bedeutet im PHP-Router nachweisbar.

| Methode | Pfad | Zweck | Auth / Recht | Request | Response | Fehler / DB-Bezug | Status |
|---|---|---|---|---|---|---|---|
| GET | `/api/setup/status` | Setupstatus und Voraussetzungen | vor Aktivierung öffentlich | – | Setupstatus | 500 bei Runtime/DB; Setup-/Migrationsstatus | VORHANDEN |
| POST | `/api/setup/install` | DB anlegen, migrieren, Core-Daten seeden | Setupzustand; keine normale Session vor Erstinstallation | Installationsdaten/Environment | Installationsresultat | 400/500; alle Coretabellen | VORHANDEN |
| GET | `/api/status` | Laufzeit-, DB- und Migrationsstatus | öffentlich | – | Statusobjekt | 500; DB-Ping/Migrationstatus | VORHANDEN |
| POST | `/api/auth/login` | Benutzer authentifizieren, Session starten | öffentlich, Credentials erforderlich | `username`, `password` | öffentliche Identität, CSRF/Sessionkontext | 400/401; `users`, `user_roles`, `roles`, `permissions`, `sessions` | VORHANDEN |
| POST | `/api/auth/logout` | aktive Session beenden | Session; CSRF | – | Logoutbestätigung | 401/403; `sessions` | VORHANDEN |
| GET | `/api/auth/me` | aktuelle Identität und effektive Rechte | Session | – | User/Rollen/Permissions | 401; Session/RBAC-Tabellen | VORHANDEN |
| GET | `/api/modules` | für Identität sichtbarer Modulkatalog | optional; Sichtbarkeit per Manifestpermission | – | Module mit Lifecycle | 500; `modules`, `module_state`, Permissions | VORHANDEN |
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
| GET | `/api/admin/backups`, `/api/backups`, `/api/admin/backup` | Backups lesen | Adminvariante geschützt | – | Backupliste/-status | 403; `backups` | VORHANDEN |
| GET | `/api/admin/updates`, `/api/updates` | Updatezustand lesen | Adminvariante geschützt | – | Updateinformationen | 403; Runtime | VORHANDEN |

## 4. Node-Referenz-API

`Server/node/bootstrap/server.js` implementiert zusätzlich Status/Health/Logs, Frameworkdiagnostik, Release/Maintenance, Auth, Connections, Providers, Backups/Restore, Setup/Aktivierung, Server-/DB-Tests, Devices, Licenses, Updates, Module sowie Benutzer-, Rollen-, Audit- und Settings-CRUD. Diese Endpunkte werden in Node-Integrationstests verwendet. Nur Endpunkte, die auch im PHP-Router vorhanden und geprüft sind, dürfen als Produktionsvertrag vorausgesetzt werden.

## 5. Erweiterungsregel

Neue Endpunkte benötigen vor Implementierung: dokumentierten Vertrag, Auth-/Permissionentscheidung, Requestvalidierung, Fehlercodes, Datenbank-/Transaktionskonzept, Datenschutzprüfung, Tests und Eintrag in diesem Dokument. Module können derzeit nicht selbstständig produktive PHP-Routen registrieren (**FEHLT/GEPLANT**).

## Client-Timeout – P3 IST

`ApiClient.request()` begrenzt Requests standardmäßig auf 10 Sekunden; `timeoutMs` kann pro Request gesetzt oder mit `0` bewusst deaktiviert werden. Wenn `AbortController` vorhanden ist, wird der Fetch abgebrochen; ältere Browser erhalten einen Promise-Timeout-Fallback. Das Ergebnis ist `{ok:false,status:408,code:"API_TIMEOUT"}`. Es gibt keinen automatischen Retry für Login oder andere Schreiboperationen.
