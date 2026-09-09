# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** P0 Produktionsauthentifizierung nach zwei real fehlgeschlagenen Fixversuchen
**Status:** CODE-SEITIG KORRIGIERT · DEPLOYMENT/PRODUKTIONSSMOKE AUSSTEHEND · DEVICE RETEST REQUIRED

## Konkrete Root Cause

Die sichere Produktionsklassifikation trennte zwei aufeinanderfolgende Fehler:

1. `PdoLoginAttemptStore::ensureSchema()` führte vor jedem Throttle-Read Request-time-DDL aus. Dies war ein echter Blindspot und wurde test-first entfernt.
2. Der anschließend deployte Auth-Smoke erreichte danach `AUTH_USER_LOOKUP_UNAVAILABLE`. Damit war konkret belegt, dass der verbleibende 503 im Userlookup entstand. `Phase4UserService::authenticate()` verwendete denselben Named Placeholder `:username` zweimal (Username und E-Mail). Produktion verwendet bewusst `PDO::ATTR_EMULATE_PREPARES=false`; native PDO-MySQL-Prepares erlauben die Wiederverwendung eines Named Parameters nicht und werfen `HY093 Invalid parameter number` vor jedem `fetch()`. Deshalb waren bestehende User und Admin gleichermaßen betroffen, während Node-/Mocktests grün blieben.

Der Query verwendet jetzt zwei eindeutige Bindings (`:username_name`, `:username_email`) und behandelt nullable Legacy-/aktuelles E-Mail-Schema explizit. Ein PDO-Testadapter mit nativer MySQL-Placeholder-Regel deckt genau diesen bisherigen Blindspot ab.

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
