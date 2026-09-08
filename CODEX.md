# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Dark-Theme konsistent fertigstellen + Theme-Schnellumschaltung + FTPS-Verifikation stabilisieren

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vor Implementierung vollständig:

- `WORKFLOW.md`
- `DOCUMENTATION.md`
- `CODEX.md`
- `CURRENT-TASK.md`
- `UI-UX.md`
- `I18N.md`
- `VISION.md`
- `CORE-1.0.md`
- `Architecture.md`
- `Functions.md`
- `ModuleCreation.md`
- `CONNECTIONS.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- alle relevanten User-App-, Theme-/Designsystem-, Navigation-, Settings-, GPS-, Homepage-, CSS-, FTPS-/Deployment-, Smoke-, Workflow- und Testdateien

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

## Betreiber-Device-Retest vom 2026-09-08

### Live bestanden

- Local-first Warmstart funktioniert jetzt.
- Bei wiederholtem Reload erscheint der gespeicherte HTML-Startinhalt unmittelbar; das vorherige sichtbare `Loading` ist verschwunden.
- Die neue zentrale Navigation `Start` / `GPS` ist deutlich als klick-/touchbare App-Navigation erkennbar.
- Aktiver/inaktiver Zustand von `Start` / `GPS` ist grundsätzlich verständlich.
- HTML-Startinhalt funktioniert weiterhin.
- GPS funktioniert weiterhin.

Diese Verbesserungen nicht zurückbauen.

# Arbeitspaket A – Theme / Dark Mode / Schnellumschaltung

Der Betreiber hat Light und Dark auf dem realen iPad geprüft.

## Livebefund

**Light:** Darstellung insgesamt brauchbar.

**Dark:** noch nicht konsistent umgesetzt.

Im Live-Test sichtbar:

1. `Settings`- und `Login`-Button im Header bleiben nahezu weiß und wirken im Dark Theme wie Fremdkörper.
2. GPS-Inhaltskarte bleibt weiß.
3. Texte innerhalb der GPS-Karte besitzen teilweise sehr schlechten Kontrast.
4. Mehrere Texte/Labels in den User-Settings sind im Dark Mode zu dunkel und teilweise kaum lesbar.
5. HTML-Startinhalt erscheint innerhalb einer großen weißen Fläche, obwohl die App im Dark Mode läuft.
6. Insgesamt werden Theme-Werte offenbar nicht konsequent über das zentrale Designsystem an alle Framework-/Modulkomponenten vererbt.

## Auftrag

Root Cause ermitteln. Keine punktuellen CSS-Hacks nur für die aktuell sichtbaren Screenshots einbauen.

Prüfe insbesondere:

- zentrale Theme-Tokens/CSS-Variablen;
- feste/hardcodierte Light-Farben in User-App und Modulen;
- Background-/Surface-/Card-/Input-/Button-/Text-/Muted-/Border-/Active-/Focus-Tokens;
- GPS-Modul;
- User Settings;
- Header-Actions;
- Navigation;
- HTML-Homepage-Container;
- Accessibility/Kontrast;
- Vererbung der zentralen Theme-Regeln an zukünftige Module.

### Ziel

Das Framework stellt Light und Dark zentral bereit. Module und Framework-Komponenten verwenden diese Theme-Verträge automatisch und benötigen nicht jeweils eigene Dark-Mode-Sonderlösungen.

WICHTIG zum HTML-Modus:

Vom Administrator frei eingegebenes HTML darf nicht willkürlich umgeschrieben werden. Der Framework-Container um diesen Inhalt darf aber nicht unnötig eine fest verdrahtete weiße Fläche erzwingen.

## Light/Dark-Schnellumschaltung

Der Betreiber möchte den Theme-Wechsel zusätzlich **direkt im oberen User-App-Bereich bei den Header-Aktionen** erreichen können.

Aktuell muss dafür `Settings → Appearance → Theme` geöffnet werden.

Implementiere eine kompakte, app-typische Light/Dark-Schnellumschaltung im oberen Bereich bei `Settings` / `Login`.

Anforderungen:

- unmittelbar erreichbar;
- eindeutig verständlich;
- touchgerecht;
- nicht unnötig textlastig;
- zentraler Theme-Vertrag;
- Änderung bleibt lokal persistent und offline verfügbar;
- `Settings → Appearance → Theme` bleibt erhalten und synchronisiert exakt denselben Zustand;
- keine zwei voneinander unabhängigen Theme-Zustände;
- Accessibility beachten;
- Light und Dark wechseln sofort sichtbar;
- keine unnötige Serverabhängigkeit.

Prüfe, ob ein etabliertes Sonne-/Mond- bzw. äquivalentes Symbolpaar die bessere UX ist. Keine kryptische Bedienung.

# Arbeitspaket B – Wiederkehrende `FTPS Deploy – Run failed`

Auf dem iPad erhält der Betreiber regelmäßig GitHub-Mitteilungen `FTPS Deploy – Run failed`, obwohl die Anwendung anschließend häufig korrekt aktualisiert ist und spätere Runs erfolgreich sind.

Dieser Punkt wurde anhand eines konkreten fehlgeschlagenen Runs bereits extern untersucht.

## Wichtige Feststellung

Beim untersuchten fehlgeschlagenen Run für Commit `f4437b4` waren:

- Checkout: SUCCESS
- vollständige Tests: SUCCESS
- Produktionspaket: SUCCESS
- FTPS-Client: SUCCESS
- FTPS-Upload: SUCCESS
- Upload-Ergebnis: `status OK`
- 106 Dateien erfolgreich übertragen

Erst danach schlug der Schritt `Produktionsstand rein lesend prüfen` fehl.

Der Smoke-Test meldete:

`Öffentliche Installation entspricht nicht der deployten Revision.`

Damit ist für diesen Fall ausdrücklich **nicht** Git-Commit, Git-Push oder der eigentliche FTPS-Upload die Fehlerursache.

## Auftrag

Untersuche die wiederkehrenden fehlgeschlagenen FTPS-Runs ursächlich und stabilisiere den Deployment-/Verifikationsvertrag.

Nicht fehlgeschlagene Runs blind erneut starten und keine echten Fehler unterdrücken.

Prüfe insbesondere:

1. mehrere historische erfolgreiche und fehlgeschlagene FTPS-Runs;
2. ob wiederholt dieselbe Smoke-/Revision-Stage verantwortlich ist;
3. ob der HTTP-Smoke unmittelbar nach dem Upload zu früh startet;
4. LiteSpeed-/HTTP-/Proxy-/OPcache-/Server-Cache bzw. kurzfristige Propagation;
5. Service-Worker-Einfluss, soweit serverseitige Smoke-Prüfung davon überhaupt betroffen sein kann;
6. Revision-/Manifest-/Deployment-Marker;
7. Reihenfolge der hochgeladenen Dateien;
8. ob `manifest.json` bzw. ein Revision-Marker bereits früh übertragen wird, obwohl der restliche Upload noch läuft;
9. ob ein Deployment-complete-Marker sinnvollerweise zuletzt/atomar geschrieben werden sollte;
10. ob eine begrenzte Retry-/Backoff-Verifikation nach vollständig erfolgreichem Upload fachlich sinnvoll ist;
11. ob kurz nacheinander gestartete `main`-Deployments miteinander kollidieren;
12. GitHub-Actions-Concurrency für Produktionsdeployments.

Besonders prüfen:

Der untersuchte Upload überträgt viele Dateien nacheinander und ersetzt vorhandene Dateien während des Deployments. Stelle sicher, dass der öffentlich sichtbare Revisionsvertrag während und unmittelbar nach diesem Vorgang keinen falschen Mischzustand erzeugt.

Falls Retry/Backoff eingesetzt wird:

- ausschließlich nach erfolgreichem Upload;
- begrenzte Anzahl;
- begrenzte Gesamtdauer;
- echte dauerhafte Revision-Mismatches bleiben FAILURE;
- Uploadfehler bleiben sofort echte Fehler;
- keine pauschale `sleep`-Lösung ohne Root-Cause-Verständnis.

### Ziel

Ein tatsächlich erfolgreicher Deploy darf nicht allein wegen eines kurzfristig noch alten öffentlichen HTTP-Zustands unnötig als FAILURE gemeldet werden.

Gleichzeitig darf die Lösung keine echten Deploymentfehler verstecken.

Bevorzugt prüfen/umsetzen, soweit Root Cause dies bestätigt:

- deterministische Upload-/Commit-Marker-Reihenfolge;
- gegebenenfalls atomarer Deployment-complete-Marker;
- begrenzte verifizierende Retries mit Backoff;
- Concurrency-Schutz gegen überlappende Deployments;
- nachvollziehbare, secret-freie Diagnose im Workflow.

# Tests

Regressionstests zuerst ergänzen/anpassen.

## Theme mindestens

- zentrale Komponenten verwenden Theme-Tokens statt hardcodierter Light-Farben;
- Header-Actions Light/Dark;
- Navigation Light/Dark;
- GPS Light/Dark;
- Settings Light/Dark;
- HTML-Homepage-Frameworkcontainer Light/Dark;
- Text-/Border-/Surface-Kontrast;
- Schnellumschaltung aktualisiert denselben persistenten Theme-State wie Settings;
- Reload erhält Theme;
- Offline erhält Theme;
- Accessibility/Fokus bleibt erhalten.

## FTPS mindestens

- erfolgreicher Upload + kurzfristig alte Revision + danach aktuelle Revision → begrenzte Verifikation kann SUCCESS ergeben;
- dauerhaft falsche/alte Revision → FAILURE;
- Uploadfehler → FAILURE ohne Smoke-Kosmetik;
- falsche Public URL/Base Path → FAILURE;
- überlappende Deployments erzeugen keinen falschen Success;
- Secrets bleiben maskiert;
- bestehende FTPS-, Packaging-, Smoke- und Securitytests bleiben grün.

## Regression

- Warmstart darf nicht zurückgebaut werden;
- HTML-Homepage;
- GPS;
- `Start` / `GPS`-Navigation;
- persönliche `App areas`;
- Login;
- P1 User-/Admin-Sessiontrennung;
- Auth/CSRF;
- Service Worker;
- Offline-Fallback;
- Packaging/Base Path.

# Abschluss

Dokumentiere die tatsächlichen Root Causes in `CHATGPT.md`.

Aktualisiere relevante dauerhafte Dokumentation nur dort, wo ein neuer allgemeiner Vertrag tatsächlich erforderlich ist.

Danach vollständig gemäß `WORKFLOW.md`:

- fokussierte Tests;
- vollständige Test-Suite unter unterstützter PHP-8.1+-Runtime;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- relevante Status-/TODO-/CHANGELOG-/Workflow-Dokumentation wahrheitsgemäß aktualisieren;
- Commit und Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS und CodeQL bis terminal abwarten;
- insbesondere feststellen, ob der korrigierte FTPS-Workflow beim eigenen Abschlussdeploy tatsächlich stabil SUCCESS erreicht;
- vollständigen Abschlussbericht nach `CHATGPT.md` schreiben;
- `CHATGPT.md` auf GitHub `main` verifizieren;
- erst danach Abschlussmeldung.

Keine selbst ausführbaren offenen Punkte zurücklassen.

P4 nicht allein aufgrund automatisierter Tests als vollständig `LIVE BESTANDEN` markieren. Die Theme-/UI-Änderungen benötigen anschließend erneut einen kurzen Betreiber-Device-Retest.
