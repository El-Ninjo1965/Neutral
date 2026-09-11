# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER GROSSER PRE-FREEZE-ABSCHLUSSAUFTRAG – ALLES CODESEITIG BIS ZUR GESAMMELTEN OPERATOR-LIVEABNAHME  
**Datum:** 2026-09-11

# Ziel

Arbeite in diesem Lauf **so viel wie technisch verantwortbar bis unmittelbar vor den finalen Betreiber-Livechecks und dem Core Freeze ab**. Der Betreiber möchte nicht nach jeder kleinen Änderung erneut testen. Nach diesem Lauf soll möglichst nur noch eine zusammenhängende Live-Abnahmerunde nötig sein.

Der Reparaturlauf bis `a9bccf807e7f0bd736e01c88404db613737cd82f` hat Profile, Media, Unlimited Devices, User Management, Module Visibility und User/System-Klassifikation code-/testseitig bearbeitet. Diese Punkte sind noch nicht gesammelt operator-live abgenommen. Ein Punkt wurde bereits erneut getestet und ist weiterhin fehlgeschlagen: **User Login Eye**.

Verbindlich:

> Core enthält nur zwingend notwendige technische Mechanismen. Konkrete Funktionen sind Module. Keine Fachmodul-Sonderlogik in Core.

> Lokale Tests und Deployment sind kein Betreiber-Live-Pass. Alles, was reale Bedienung/Produktionszustand benötigt, bleibt bis zur späteren Sammelabnahme `OPERATOR RETEST REQUIRED`.

Referral/Rewards bleibt Zukunftsmodul und wird in diesem Lauf nicht implementiert. Die automatische Setup-/Installationsroutine bleibt Post-Freeze und wird ebenfalls nicht vorgezogen.

---

# 1. Pflicht-Preflight und Arbeitsweise

1. Mit `origin/main` synchronisieren und sauberen Ausgangszustand bestätigen.
2. **Alle Markdown-Dateien vollständig lesen**, insbesondere `DOCUMENTATION.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `Architecture.md`, `ModuleCreation.md`, `SYSTEM-MODULES.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `BACKUP-CONTRACT.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `ROADMAP.md`, `WORKFLOW.md`, `CHATGPT.md`, `CURRENT-TASK.md`, `CHANGELOG.md`, `PRODUCT-DECISIONS-2026-09-11.md`, `PRODUCT-DECISIONS-2026-09-11-FOLLOWUP.md` und diese Datei.
3. Aktuellen Code und die Commits `526291410a4d88c916c62e288613fbaacbd9182a` sowie `a9bccf807e7f0bd736e01c88404db613737cd82f` gegenlesen. Bereits implementierte Reparaturen nicht neu erfinden.
4. Arbeite testgetrieben und in logisch getrennten Commits. Nach jedem Teilbereich Regressionen prüfen.
5. Keine Secrets/PII committen. Keine destruktiven Produktionsaktionen. Kein Production-Restore.
6. Keine automatische Freeze-Erklärung: Der endgültige Freeze erfolgt erst nach der späteren Betreiber-Liveabnahme.

---

# 2. User Login Eye – bisherigen Ansatz ersetzen, nicht weiter flicken

## Verbindlicher neuer Livebefund

Nach Deployment bis `a9bccf807e7f0bd736e01c88404db613737cd82f` wurde der User Login real auf Betreiber-iPad/Chrome geprüft:

- normal: Eye **nicht sichtbar**;
- privat/Inkognito: Eye **nicht sichtbar**.

Der bisherige dynamische Ansatz über `NeutralUiFeedback.enhancePasswordFields(content)`, Wiederholungsrender/Self-Heal und verschärftes CSS hat damit erneut live versagt.

## Neue verbindliche Umsetzung

Orientiere dich am zuverlässig funktionierenden Admin-Login-Muster. Beim User Login müssen Passwortfeld und Eye-Button **gemeinsam direkt im gerenderten Login-Markup** vorhanden sein.

- `button.password-visibility-toggle` direkt im standardisierten Password-Control;
- `type="button"`;
- echtes open/crossed-eye SVG;
- ca. 44×44 Touchziel;
- `aria-label` + `aria-pressed`;
- Klick: `password` ↔ `text`, Icon/ARIA aktualisieren, Fokus sinnvoll erhalten;
- Light/Dark/Theme sichtbar;
- Existenz darf nicht von MutationObserver, `requestAnimationFrame` oder nachträglicher DOM-Anreicherung abhängen;
- gemeinsamen Password-Visibility-Vertrag weiterverwenden;
- falls nötig den gemeinsamen Helper minimal so erweitern, dass er **bereits vorhandene Markup-Toggles bindet**, statt einen zweiten Button zu erzeugen;
- `enhancePasswordFields()` für andere tatsächlich dynamische Formulare als Fallback erhalten, sofern benötigt;
- keine divergierende User-/Admin-Semantik.

Tests müssen DOM-nah beweisen: Control wird mit Button gerendert; genau ein Toggle; Klick ändert Input-Type; Icon/ARIA stimmen; eigenes CSS verbirgt ihn nicht. Reine Regex-Existenztests genügen nicht.

Nach Deployment weiterhin `OPERATOR RETEST REQUIRED`.

---

# 3. Bereits implementierte Reparaturen vollständig gegen Verträge prüfen und härten

Nicht blind neu implementieren. Prüfe den aktuellen Code gegen die Verträge und ergänze nur echte Lücken/Regressionen.

## Profile

- retry-safe Migration nach partieller MySQL-DDL;
- Activate/Deactivate/Re-activate lokal/integrationstestbar;
- Daten bei Deaktivierung erhalten;
- Profile bleibt optional; keine harte Media-/Sharing-Abhängigkeit;
- kontrollierte Fehler statt 500;
- Profile/Privacy User-UI nur bei aktiver Capability.

## Media & Upload

- `Load failed`-Ursache und korrigierter Serverentry müssen im tatsächlichen Produktionspaket enthalten sein;
- Install/Register/Activate/Deactivate/Re-activate lokal/integrationstestbar;
- keine vollständige Media-Fachfunktion behaupten, solange nur Lifecycle/Capability-Scaffolding existiert.

## Unlimited Devices

- JSON/DB `null` = Unlimited darf nirgends zu `0` werden;
- direct Package, License Package, User Override und License→Direct-Fallback prüfen;
- numerische Limits weiterhin erzwingen;
- UI niemals `0` für Unlimited.

## User Management

- List/Create/Edit als exklusive States;
- Save/Cancel/Back zurück zur Liste;
- Package/License/Roles/Device-Limits/Success-Dialog nicht regressieren;
- mobile/touchfreundlich.

## Module Administration

- Apps bleiben eigener Bereich;
- User Modules/System Modules aus deklarativer `category`;
- **eine** Registry/Runtime/Lifecycle;
- Kategorie beeinflusst weder Permission noch Visibility;
- rollenbezogene Visibility/Navigation getrennt von Permissions;
- Visibility erteilt niemals API-Rechte;
- Details/Lifecycleaktionen erhalten;
- Mobile-First.

---

# 4. Standalone-/Self-Test-System jetzt sauber abschließen

GPS besitzt derzeit als einziges reales Modul einen deklarierten Standalone-Test. Dieser Punkt soll vor Freeze nicht nur dokumentiert, sondern technisch sauber entschieden und soweit sinnvoll standardisiert werden.

## Ziel

Ein Modul darf optional einen **Self-Test/Standalone-Test-Entry** deklarieren. Der Core/Admin stellt nur den generischen Mechanismus bereit; fachliche Tests gehören dem Modul.

## Auftrag

1. Bestehenden GPS-Mechanismus vollständig analysieren: Manifestfeld, Validator, Registry, Admin Details, Loader, Security/Permissions.
2. In `ModuleCreation.md` und Code eindeutig definieren, ob/wie ein Modul einen Self-Test deklariert.
3. Wenn der aktuelle GPS-Weg bereits generisch ist, **nicht neu erfinden**; nur Lücken schließen und Vertrag festschreiben.
4. Wenn derzeit GPS-Sonderlogik existiert, diese minimal in einen neutralen generischen Modulvertrag überführen, ohne fachliche GPS-Logik in Core zu verschieben.
5. Self-Test bleibt optional. Systemmodule ohne sinnvollen Standalone-Test müssen keinen künstlichen Button erhalten.
6. Admin zeigt Testaktion nur, wenn das Modul gültig einen Testentry deklariert.
7. Ein Self-Test darf keine Berechtigungen umgehen, keine Secrets zeigen und keine destruktiven Produktionsaktionen ausführen.
8. Dokumentieren: Self-Test beweist nur den deklarierten isolierten Modulpfad; er ersetzt **nicht** Lifecycle-, API-, DB-, Permission-, Integration- oder Betreiber-Livetests.
9. Tests für Manifestvalidierung, Modul mit/ohne Self-Test und GPS-Regression ergänzen.

Ziel ist ein neutraler Vertrag, den zukünftige Module nutzen können, ohne Core-Sonderänderungen.

---

# 5. Field Notes jetzt als finalen code-seitigen No-Core-Change-Freeze-Proof bauen

Der Betreiber möchte nach diesem Agentenlauf möglichst nahe am Freeze sein. Daher soll **Field Notes in diesem Lauf als Referenz-/Beweismodul umgesetzt werden**, sofern der Preflight keine fundamentale offene Architekturblockade findet.

## Harte Regel

> Field Notes muss als neues unabhängiges User Module implementiert werden, **ohne bestehende Core-Dateien nur für seine fachliche Integration zu ändern**.

Vor Beginn den Git-Diff-Baselinepunkt festhalten. Nach Umsetzung explizit beweisen, welche Dateien geändert wurden.

## Zweck

Field Notes ist bewusst ein kleines neutrales Referenzmodul, kein CatchTrack-Modul. Es soll beweisen, dass ein Entwickler anhand von `ModuleCreation.md` ein neues User Module erstellen, installieren, aktivieren, nutzen, deaktivieren und wieder aktivieren kann, ohne Core-Sonderintegration.

## Minimaler Funktionsumfang

- Kategorie: `user`;
- eigene Namespace-/Modul-ID `field-notes` oder gemäß bestehender Naming-Regel;
- einfache persönliche Notizen des angemeldeten Users;
- mindestens Liste + neue Notiz + Bearbeiten + Löschen, sofern der bestehende Modulvertrag/DB-Migrationsweg dies ohne Coreänderung trägt;
- Notiz mindestens `title`, `body`, Zeitstempel, Owner/User-Zuordnung;
- serverseitige Ownership-/Permission-Prüfung; User darf niemals fremde Notes lesen/ändern/löschen;
- eigene Modulmigration/Tabelle gemäß bestehendem Modulvertrag;
- i18n/Theme/responsive UI gemäß Neutral-Vertrag;
- Backup/Restore nur über bereits vorhandenen generischen deklarierten Moduldatenvertrag; **keinen Core-Sonderfall für Field Notes hinzufügen**;
- Visibility/Navigation über bestehende generische Mechanismen;
- kein Media/Sharing/Profile als Pflichtabhängigkeit;
- optionaler Self-Test nur wenn er nach dem in Abschnitt 4 festgelegten Vertrag sinnvoll ist. Nicht künstlich erzwingen.

## Freeze-Proof-Kriterium

Wenn Field Notes für seine normale Integration eine Änderung an bestehenden Core-Dateien benötigt, **nicht einfach die Core-Datei ändern**. Stoppe diesen Teil, dokumentiere präzise den fehlenden generischen Extension Point als Freeze-Blocker und implementiere nur dann einen Core-Fix, wenn er nachweislich universell/generisch ist und nicht Field-Notes-spezifisch. Danach muss der Beweistest erneut von sauberer Basis erfolgen.

Tests: Modulmanifest, Install/Register/Activate/Deactivate/Re-activate, API/Ownership, Migration, User UI/Navigation, Backup-Discovery soweit relevant, keine Pflichtabhängigkeiten und automatischer Check, dass keine Field-Notes-spezifische Referenz in Core-Dateien eingeführt wurde.

---

# 6. Vollständiger Pre-Freeze-Audit nach Implementierung

Nach Eye + Self-Test-Vertrag + Field Notes und den bestehenden Reparaturen einen **kompletten technischen Pre-Freeze-Audit** durchführen.

Prüfe mindestens:

- Core↔Module-Grenzen;
- keine CatchTrack-/Field-Notes-Fachlogik in Core;
- Module Discovery/Manifest/Registry/Lifecycle;
- User/System category;
- Visibility vs Permissions;
- optional dependencies;
- Profile/Media/Systemmodule;
- Auth/User/Admin Login;
- Password controls;
- Packages/Licenses/Unlimited/Session limits;
- User Management;
- API/DB/Migrationen;
- Security/CSRF/Ownership;
- Backup contract;
- i18n/theme/mobile;
- Offline/Service Worker/production asset revisioning;
- Module Self-Test contract;
- Field Notes no-Core-change proof;
- Setup-Routine weiterhin nur Post-Freeze-Plan;
- Referral/Rewards weiterhin Zukunftsmodul.

Keine unnötigen Refactorings. Nur echte Freeze-Blocker beheben.

---

# 7. Dokumentation vollständig synchronisieren

Nach dem tatsächlichen Code-Endstand **alle Markdown-Dateien gegen Code und Tests synchronisieren**, nicht nur einzelne Statusdateien.

Mindestens ausdrücklich prüfen/aktualisieren:

- `DOCUMENTATION.md`
- `VISION.md`
- `CORE-1.0.md`
- `CORE-1.0-READINESS.md`
- `Architecture.md`
- `ModuleCreation.md`
- `SYSTEM-MODULES.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `USER-ACCOUNT-LICENSE-MODEL.md`
- `API.md`
- `Database.md`
- `Security.md`
- `Functions.md`
- `BACKUP-CONTRACT.md`
- `Install-README-Server.md`
- `Install-README-Web-App.md`
- `DEVELOPMENT.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `ROADMAP.md`
- `WORKFLOW.md`
- `CURRENT-TASK.md`
- `CHATGPT.md`
- `CHANGELOG.md` nur append-only/historisch korrekt
- `PRODUCT-DECISIONS-2026-09-11.md`
- `PRODUCT-DECISIONS-2026-09-11-FOLLOWUP.md` als Herkunftsnachweis, nicht konkurrierende Autorität.

Dokumentationsregeln:

- Code-/Teststatus und Betreiber-Livestatus strikt trennen.
- Das erneut fehlgeschlagene Eye niemals als live bestanden markieren, bis der Betreiber es bestätigt.
- Profile/Media/Unlimited/User Management/Visibility/Kategorien/Field Notes bleiben nach Deployment `OPERATOR RETEST REQUIRED`, soweit reale Produktion/Bedienung nötig ist.
- Self-Test-Vertrag klar als begrenzten Test definieren.
- Referral/Rewards nicht als implementiert darstellen.
- automatische Setup-Routine nicht als implementiert darstellen.
- Core Freeze noch **nicht** erklären.

---

# 8. Verifikation und Deployment

Vor Abschluss:

1. relevante fokussierte Tests während jeder Aufgabe;
2. vollständige Testsuite;
3. PHP-Lint;
4. JS-Syntax;
5. Security-/Ownership-/Permission-Regressionen;
6. `git diff --check`;
7. Production Package bauen und dessen Inhalt prüfen;
8. insbesondere beweisen, dass das User-Login-Markup den Eye-Button enthält und die ausgelieferten Assets die neue Revision tragen;
9. commit/push `main` gemäß `WORKFLOW.md`;
10. CI/CodeQL/FTPS terminal abwarten;
11. `HEAD == origin/main`, sauberer Tree;
12. Deploymentrevision und `migrationsReady:true` prüfen;
13. nur nicht-destruktive Production-Smokes;
14. keinen Production-Restore;
15. `CHATGPT.md` zuletzt mit präzisem Endstand und einer **einzigen gesammelten Betreiber-Retestliste** aktualisieren.

---

# 9. Gesammelte Betreiber-Retestliste vorbereiten – nicht selbst als bestanden markieren

Nach diesem Lauf soll `CHATGPT.md` eine kompakte Reihenfolge enthalten, damit der Betreiber alles möglichst einmal testet:

1. User Login Eye – iPad/Chrome normal + privat, Show/Hide tatsächlich bedienen.
2. Profile – Activate/Deactivate/Re-activate, Profile/Privacy sichtbar, Daten erhalten.
3. Media – Install/Register/Activate/Deactivate/Re-activate ohne `Load failed`.
4. Unlimited – Direct Package + mehrere Sessions; soweit praktisch License Package; niemals `0`.
5. User Management – List/Create/Edit/Save/Cancel/Back auf kleinem Screen.
6. Apps / User Modules / System Modules – Gruppierung korrekt.
7. Module Visibility/Navigation – Rollensteuerung getrennt von Permissions.
8. Self-Test – GPS Test sichtbar/funktional; Module ohne Test zeigen keinen falschen Testbutton.
9. Field Notes – Install/Activate, CRUD als User, Deactivate/Re-activate, Daten erhalten; Navigation/Visibility.
10. Moderation/Notifications/Postbox/Sharing – Lifecycle Regression.
11. GPS – normale Produktfunktion Regression.
12. falls laut bestehender Readiness noch offen: relevante Host/Backup/License/Session-Operatorgates in denselben Abnahmelauf aufnehmen.

Erst **nach** diesem Betreiber