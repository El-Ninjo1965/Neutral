# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** P0 Produktionsauthentifizierung nach zwei real fehlgeschlagenen Fixversuchen
**Status:** CODE-SEITIG KORRIGIERT · DEPLOYMENT/PRODUKTIONSSMOKE AUSSTEHEND · DEVICE RETEST REQUIRED

## Konkrete Root Cause

Der vorher entfernte `SchemaMigrator::migrate()`-Aufruf war nicht der einzige DDL-Pfad im Login. Vor **jedem** Credential-Lookup ruft `LoginRateLimiter::check()` zweimal `PdoLoginAttemptStore::state()` auf. Dessen bisheriges `ensureSchema()` führte bei jeder neuen PHP-Request-Instanz `CREATE TABLE IF NOT EXISTS login_attempts` aus. Der produktive Runtime-DB-Benutzer folgt Least Privilege und kann Anwendungs-DML ausführen, aber kein DDL. Die dadurch geworfene PDO-/Runtime-Exception traf User und Admin im gemeinsamen Routerpfad vor der Passwortprüfung und wurde vom breiten Catch als HTTP 503 `Authentication service temporarily unavailable.` maskiert.

Ein test-first gebauter PDO-Adapter, der DDL wie der Produktionsaccount verweigert, reproduzierte den Blindspot: Schon `state()` scheiterte vor dem SELECT. Nach dem Fix läuft derselbe Test mit null `exec()`-Aufrufen grün. Dies ist neue konkrete Evidenz und nicht die widerlegte Advisory-Lock-Hypothese.

## Fix

- `PdoLoginAttemptStore` besitzt keine Request-time-Schemaerzeugung mehr. `login_attempts` gehört ausschließlich der checksummed Migration `2026_09_01_0002_login_throttle`; Runtimezugriffe sind SELECT/INSERT/DELETE.
- Infrastrukturfehler werden ohne interne Exceptiontexte sicher klassifiziert: `AUTH_THROTTLE_UNAVAILABLE`, `AUTH_USER_LOOKUP_UNAVAILABLE`, `AUTH_PERMISSION_RESOLUTION_FAILED` oder `AUTH_SESSION_PERSISTENCE_FAILED`, jeweils mit zufälliger 16-Hex-Correlation-ID. Keine SQL-, Credential-, Cookie-, Account- oder PII-Daten gelangen zum Client.
- Nach erfolgreicher Identitäts- und Sessionpersistenz ist das Löschen alter Throttle-Zähler best effort; ein optionaler Cleanup kann gültigen Login nicht nachträglich in 503 verwandeln. Kritische Sessionpersistenz bleibt fail-closed.
- `DEVICE_LIMIT_REACHED` bleibt ein eigener 409. Falsche Credentials bleiben 401. User/Admin verwenden weiter denselben ApiClient und Authservice, aber getrennte Session-/CSRF-Cookies.
- Der Produktionssmoke sendet für beide kanonischen Loginrouten absichtlich ungültige, nicht existierende Dummy-Credentials und verlangt explizit 401 plus Invalid-Credentials-Envelope. 503 lässt das Deployment fehlschlagen. Keine Betreibercredentials werden verwendet.

## Verifikation vor Deployment

- Der neue DDL-Blindspot-Test war vor dem Fix rot und danach grün.
- Fokussierte PHP-/Auth-/Session-/Shell-/Smoke-Suite bestand einschließlich gültigem Userlogin, gültigem Adminlogin, falschen Credentials, getrennten Scopes, CSRF und Session-Deduplizierung.
- PHP-Lint, JavaScript-Syntax, `git diff --check` und Produktionspaket inklusive Authclient, Rewrite, Router und PHP-Services bestanden.
- Keine Secrets oder Produktionsdaten wurden ausgegeben/committed; keine Produktionsmutation außer den ausdrücklich erlaubten ungültigen Auth-Probes, kein Testuser, kein Restore, kein manuelles SQL.

## Betreiber-Retest nach Deployment

Nur diese beiden Punkte zuerst:

1. **DEVICE RETEST REQUIRED:** bestehenden User `Tester` real einloggen.
2. **DEVICE RETEST REQUIRED:** bestehenden Admin `Developer` real über `admin.php` einloggen.

Erst nach Bestätigung beider Logins dürfen weitere Profile-/License-/Media-Retests oder Core-Freeze-Aussagen folgen.
