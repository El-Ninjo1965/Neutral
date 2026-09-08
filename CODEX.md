# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

## Verbindlicher Übergabevertrag

1. Lies diesen Auftrag vollständig.
2. Lies `WORKFLOW.md` und übernimm den Auftrag vollständig in `CURRENT-TASK.md`.
3. Prüfe vor Implementierung: `CODEX.md == CURRENT-TASK-Anforderungen`.
4. Erst danach implementieren.
5. Am Ende vollständigen Bericht nach `CHATGPT.md`, Commit/Push nach `main`, CI bis terminal und GitHub-Verifikation gemäß `WORKFLOW.md`.
6. Keine Secrets in Repository oder Bericht.

# Aktueller Auftrag

## P4 Live-Regression beheben + User-App von Developer-UI bereinigen

Dieser Auftrag basiert auf dem aktuellen Betreiber-Livetest vom 2026-09-08 nach dem P4-Deployment.

`UI-UX.md` wurde nach dem letzten Codex-Featurecommit aktualisiert und ist verbindlicher Bestandteil dieses Auftrags. Synchronisiere zuerst `origin/main` und bewahre diese neueren Betreiber-/ChatGPT-Änderungen vollständig.

## Betreiber-Livebefund – höchste operative Wahrheit

### Was funktioniert

- `Admin → Settings` und `Admin → Appearance` sind sichtbar getrennt.
- Appearance zeigt Theme/Layout und Global Start Page.
- Theme/Layout wirken im Adminbereich grundsätzlich korrekt.
- Startseitenwerte lassen sich im Admin auswählen/eingeben und speichern.
- P1 User-/Admin-Trennung zeigt im aktuellen Betreiberbefund keine neue Regression.

### Was NICHT funktioniert

**P4 ist im echten Browser nicht bestanden.**

Die gespeicherte globale Startseite wird in der User-App nicht tatsächlich angewendet:

1. Modus `Module`, Startmodul `GPS` gespeichert → User-App zeigt nach Reload weiterhin die bisherige neutrale Standardoberfläche statt GPS als Startziel.
2. Modus `Text / HTML`, HTML gespeichert → User-App zeigt nach Reload weiterhin die bisherige neutrale Standardoberfläche statt des konfigurierten HTML-Inhalts.

Automatisierte grüne Tests dürfen diesen aktuellen Betreiber-Livebefund nicht überschreiben.

## Ziel 1 – P4 Root Cause finden und real beheben

Nicht symptomatisch patchen und nicht einfach weitere Timeouts/Reloads hinzufügen.

Verfolge den realen Produktionsdatenfluss vollständig:

`Admin Save → Server/Persistenz → öffentliche Homepage-Projektion → User-App Fetch/Cache → Startup → Router/Home-Rendering`

Prüfe insbesondere:

- was Admin tatsächlich persistiert;
- was die produktive öffentliche Homepage-API tatsächlich zurückliefert;
- ob Keys/Struktur zwischen Node-Tests und produktivem PHP identisch sind;
- ob User-App den richtigen Endpoint unter dem realen Base Path verwendet;
- ob Response/Cache/Fallback die gültige Serverkonfiguration überschreibt;
- ob Startup-Reihenfolge die Homepage zwar lädt, aber danach wieder Default rendert;
- ob Modul-Discovery/Access-Timing GPS verhindert;
- ob HTML-Modus zwar geladen, aber nie in den sichtbaren Root eingebunden wird;
- ob Service Worker/Browsercache/Assetversionierung oder alte Assets beteiligt sind;
- ob Produktionspaket wirklich alle benötigten Dateien/Versionen enthält.

Die Root Cause muss in `CHATGPT.md` konkret benannt werden.

### Verbindliches Verhalten

**Module-Modus**
- gespeichertes, aktives und für den User zugängliches Startmodul wird nach dem erforderlichen Startup-Zustand tatsächlich geöffnet;
- GPS muss im Betreiberfall als Startziel funktionieren, sofern der aktuelle Zugriff es erlaubt;
- ungültig/nicht zugänglich → kontrollierter neutraler Fallback.

**Text/HTML-Modus**
- gespeicherter Inhalt wird nach App-Start/Reload tatsächlich als Startinhalt sichtbar;
- bestehender bewusster Vertrag für Administrator-HTML bleibt erhalten;
- kein stiller Rückfall auf Default bei gültiger Konfiguration.

## Ziel 2 – User-App konsequent von Developer-/Framework-UI bereinigen

Die User-App wirkt im aktuellen Livezustand noch wie ein Entwickler-Interface. Das widerspricht `UI-UX.md`.

Entferne aus der normalen User-App, sofern kein echter fachlicher Nutzerzweck nachgewiesen ist:

- dauerhafte Anzeige des eingeloggten Namens wie `Tester` im Header;
- `Active Application`;
- `Local Workspace`;
- Modulanzahl/technische Zahl wie `1`;
- technische Framework-/Discovery-/Workspace-Texte;
- generischen sichtbaren `Zurück`-Button als Standardnavigation.

Diese Informationen dürfen im Admin-/Developerkontext verbleiben, wenn dort sinnvoll.

WICHTIG: Nicht einfach alles verstecken und dadurch Navigation zerstören. Die User-App benötigt eine klare app-typische Navigation zu den für den aktuellen User sichtbaren/zugänglichen Modulen bzw. Hauptbereichen.

Prüfe die aktuelle Navigation vollständig. Im Betreiber-Screenshot fehlen sinnvolle sichtbare App-Buttons, während technische Elemente angezeigt werden. Stelle einen fachlich sauberen, touchgerechten User-App-Navigationszustand her, der den vorhandenen Permission-/Module-Access-Vertrag respektiert.

Keine neue große Navigationsarchitektur erfinden, wenn bereits eine zentrale Navigation vorgesehen ist; vorhandenen Vertrag korrekt sichtbar und nutzbar machen.

## Ziel 3 – Produktbranding statt fest verdrahtetem Neutral-Branding

Prüfe das aktuelle grüne `N` und `Neutral Platform` in der User-App.

Verbindliches Ziel gemäß `UI-UX.md`:

- `N` darf Neutral-Default/Platzhalter sein, aber nicht unveränderlich fest verdrahtet;
- sichtbarer Application Name muss produktbezogen konfigurierbar/verwendbar sein;
- Logo/Icon muss pro erzeugter Produkt-App sauber austauschbar sein;
- keine unnötige doppelte Branding-Architektur bauen;
- vorhandenen App-/Settings-/Generator-Vertrag nutzen bzw. minimal universell erweitern;
- spätere PWA-/Store-App-Portabilität berücksichtigen.

Falls ein vollständiger Logo-Upload/Asset-Manager einen unverhältnismäßig neuen Featureblock erfordern würde, implementiere in diesem Auftrag mindestens den universellen Branding-Vertrag und die saubere austauschbare Asset-/Konfigurationsstelle; dokumentiere einen echten noch extern/produktbezogen erforderlichen Asset-Schritt präzise. Keine erfundene Fertigmeldung.

## Ziel 4 – Login-/Session-UX

P1 darf nicht verändert oder zurückgebaut werden.

- User und Admin bleiben getrennte Sessions.
- Login darf serverseitig Zeit benötigen.
- Nach erfolgreichem User-Login darf der Header nicht automatisch einen technisch unnötigen Benutzernamen anzeigen.
- Keine Passwörter dauerhaft im Client speichern.
- bestehende sichere Sessionmechanik erhalten.

## Vor Implementierung vollständig lesen

Mindestens:

- `WORKFLOW.md`
- `CODEX.md`
- `CURRENT-TASK.md`
- `UI-UX.md`
- `VISION.md`
- `CORE-1.0.md`
- `Architecture.md`
- `Functions.md`
- `ModuleCreation.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `DOCUMENTATION.md`
- relevante User-App-, Startup-, Router-, Navigation-, Settings-, Appearance-, API-, PHP-, Generator- und Packaging-Dateien
- relevante bestehende Tests

## Teststrategie – Livefehler muss reproduzierbar werden

Vor der eigentlichen Korrektur Regressionstests ergänzen, die den beobachteten Produktionsfehler möglichst realitätsnah reproduzieren.

Nicht nur Mock-/Node-Pfade testen. Der produktive PHP-/Packaging-/Base-Path-Pfad muss soweit automatisierbar abgedeckt sein.

Mindestens testen:

### P4 End-to-End-Vertrag
- Adminpersistenz → öffentliche Projektion stimmt strukturell überein.
- PHP-Produktion liefert Modulmodus korrekt.
- PHP-Produktion liefert HTML-Modus korrekt.
- User-App konsumiert genau diese Struktur.
- Modulmodus führt nach notwendiger Discovery/Access-Auflösung tatsächlich zum Startmodul.
- HTML-Modus ersetzt den sichtbaren Default-Startinhalt tatsächlich.
- gültige Konfiguration wird nicht später durch Default-Rendering überschrieben.
- Wechsel `module → html → module` bleibt persistent.
- Base-Path/Produktionspaket-Pfad funktioniert.

### User-App UX
- kein technischer Username im normalen Header.
- kein `Active Application`.
- kein `Local Workspace`.
- keine technische Modulanzahl.
- kein generischer Back-Button als Standardnavigation.
- zugängliche Module/Hauptbereiche besitzen eine sinnvolle sichtbare Navigation.
- Navigation bleibt permission-aware/fail-closed.

### Branding
- Application Name wird aus dem vorgesehenen Produktvertrag bezogen.
- Default-Icon/Logo ist austauschbar und nicht als unveränderliches Neutral-`N` im User-App-Code fest verdrahtet.
- Generator/Produktkopie erhält den Brandingvertrag korrekt.

### Regression/Security
- P1 User-/Admin-Sessiontrennung.
- Auth/CSRF.
- anonymer Viewer-Zugriff.
- Offline-Fallback.
- bestehende Theme-Funktion.
- Modul-Lifecycle und Permissionfilter.

## Keine Scope-Ausweitung

Nicht jetzt implementieren:

- vollständige neue Sync-Engine;
- neue Offline-Queue;
- Store-App-Wrapper;
- komplettes neues Designsystem;
- sonstige neue Produktmodule.

Die neuen langfristigen Regeln in `UI-UX.md` bleiben dokumentierte Zielarchitektur und dürfen nicht versehentlich als Auftrag zur Komplettimplementierung interpretiert werden.

## Abschluss

Erst abschließen nach:

- Root Cause dokumentiert;
- fokussierte Regressionstests grün;
- vollständige `npm test`-Suite unter unterstützter PHP-8.1+-Runtime grün;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket erfolgreich;
- Secret-/Artefaktprüfung;
- Dokumentation auf tatsächlichen Status aktualisiert;
- Commit;
- Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS terminal SUCCESS/FAILURE;
- CodeQL terminal SUCCESS/FAILURE;
- sonstige erforderliche CI terminal;
- vollständiger Bericht in `CHATGPT.md` auf GitHub `main` verifiziert.

## Statusregel

P4 bleibt bis zum erneuten positiven Betreiber-Livetest:

`DEVICE RETEST REQUIRED / LIVE FEHLER NACHGEWIESEN`

Es darf aufgrund grüner automatisierter Tests nicht als `LIVE BESTANDEN` gemeldet werden.

## Neuer Betreiber-Retest nach Deploy

`CHATGPT.md` muss kurze konkrete Schritte liefern, mindestens:

1. Appearance → `Module` → GPS speichern → User-App neu laden → GPS muss Startziel sein.
2. Appearance → `Text / HTML` → sichtbaren Testinhalt speichern → User-App neu laden → Inhalt muss Startseite sein.
3. Wieder `Module` wählen → Reload → Persistenz/Startziel prüfen.
4. User-App prüfen: kein `Tester`, kein `Active Application`, kein `Local Workspace`, keine Modulzahl, kein generischer Zurück-Button.
5. Sichtbare app-typische Navigation prüfen.
6. Produktname/Logo-Default und Austauschbarkeit prüfen.
7. User-/Admin-Sessiontrennung erneut bestätigen.
