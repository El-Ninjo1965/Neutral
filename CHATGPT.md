# NEUTRAL – CODEX ABSCHLUSSBERICHT

**Richtung:** Codex → ChatGPT/Lea
**Auftrag:** `Admin → Appearance` als produktiver User-UI-Designeditor V1
**Datum:** 2026-09-08
**Status:** CODE-SEITIG ABGESCHLOSSEN / BETREIBER-DEVICE-RETEST ERFORDERLICH

## 1. Scope und bestehende Liveverträge

- Der Auftrag wurde nach Synchronisation mit dem neuesten GitHub-`main` vollständig nach `CURRENT-TASK.md` übernommen. `CODEX.md == CURRENT-TASK-Anforderungen: JA`.
- P1 und P4 bleiben `LIVE BESTANDEN`. Start Page, Homepagecache, iframe-Adapter/-Gate, Warmstart ohne Loading-/White-Flash, Home/GPS, Login sowie getrennte User-/Admin-Sessions wurden nicht zurückgebaut.
- Admin-Header-Theme und persönliche lokale User-Theme-Auswahl bleiben unabhängig. Der Editor definiert ausschließlich, wie beide User-App-Modi aussehen.
- I18N, Language Settings, Remote Fonts, Branding-Upload, Page Builder, pro-Modul- und Store-App-Design wurden nicht begonnen.

## 2. Strukturierter Designvertrag

- Neuer gemeinsamer Vertrag `NeutralUserUiDesign`, Schema V1.
- Erlaubte Light-/Dark-Farben: App-Hintergrund, Surface, Primary, Text, Muted Text und Border; gespeichert als normalisierte sechsstellige Hexwerte.
- Gemeinsame Geometrie: Control-Radius 0–32 px, Surface-Radius 0–48 px und Content-Max-Width 320–1920 px.
- Robuste Typografie V1: Basisschriftgröße 12–24 px. Es wurde absichtlich keine freie Font-URL oder halbfertige Fontverwaltung eingeführt.
- Unbekannte Top-Level-Werte, unbekannte Tokens, falsche Objektformen, ungültige Farben, Werte außerhalb der Grenzen und inkompatible Schema-Versionen werden nicht blind übernommen.
- Fehlende oder ungültige öffentliche Cachewerte fallen auf die Frameworkdefaults zurück.

## 3. Appearance-Editor und Preview

- Der sichtbare Admin-Seitentitel ist konsistent `Appearance`.
- Die Seite enthält `Global Start Page`, `User UI Design` und `Advanced Custom CSS` ohne zusätzliche Navigationsebene.
- Light und Dark besitzen getrennte Farbcontrols; Geometrie und Basisschriftgröße sind gemeinsame Werte.
- Formularänderungen aktualisieren eine innerhalb der Appearance-Ansicht gekapselte Preview unmittelbar. Sie zeigt Header, Navigation, Card, Primary-/Secondary-Button, Text, Muted Text und Input und nutzt denselben Variablenmapper wie die User-App.
- Der Preview-Modus kann gezielt zwischen Light und Dark gewechselt werden. Es werden keine Variablen auf die Admin-Shell geschrieben.
- `Reset to Defaults` setzt nach einer klaren Bestätigung ausschließlich strukturierte Designwerte im Formular zurück. Start Page, Custom CSS und persönliche Themezustände bleiben unangetastet.
- `Clear Custom CSS` ist davon getrennt.

## 4. Persistenz, Projektion und Local-first

- Admin-Saves laufen weiter durch den bestehenden authentifizierten und CSRF-geschützten Settings-Pfad.
- Node- und PHP-Persistenz normalisieren denselben V1-Vertrag. Homepage und Appearance werden zusammengeführt; das Speichern eines Bereichs setzt den anderen nicht zurück.
- `GET /api/settings/appearance` liefert ausschließlich die freigegebene Designprojektion, keine Admin-, Session-, Permission- oder Securitydaten.
- Der öffentliche Designcache ist schema-versioniert und enthält nur diese Projektion.
- `index.html` lädt den Designvertrag vor dem render-blockierenden Stylesheet, liest synchron den letzten gültigen Cache und setzt die CSS Custom Properties vor dem ersten User-App-Paint. Custom CSS steht in einem nach dem Frameworkstylesheet angeordneten User-App-Styleelement.
- Serverrefresh von Design, Homepage, Core und Session läuft unabhängig im Hintergrund. Eine Designantwort blockiert den bereits live bestandenen Homepage-Warmstart nicht.
- Beim User-Theme-Wechsel wird derselbe gespeicherte Designzustand mit der jeweils passenden Light-/Dark-Palette erneut gemappt.

## 5. Advanced Custom CSS und Sicherheit

- Custom CSS ist optional; leer bedeutet kein Override.
- Limit: 20.000 Zeichen. `</style`, `@import`, `javascript:` und nicht-stringförmige Inhalte werden abgewiesen; HTML-/Script-Ausbruch und zusätzliche Remote-Stylesheet-Infrastruktur werden nicht ermöglicht.
- Es wird kein irreführender CSS-Sanitizer behauptet. CSS wird über `style.textContent` ausschließlich im User-App-Dokument nach dem strukturierten Design eingesetzt.
- Die Admin-UI lädt den Override nicht als Adminstylesheet. CSP, iframe-Sandbox, Auth und CSRF wurden nicht gelockert.
- Syntaktisch wirkungsloses CSS kann den darunterliegenden strukturierten Tokenvertrag nicht am Laden hindern und kann separat geleert werden.

## 6. Verifikation

- Fokussierte Suite für Designvertrag, PHP-Parität, Admin UI/API, Homepage, Warmstart, Service Worker, Packaging und Auth: **169/169 bestanden**.
- Vollständige Suite nach Einbeziehung der neuen versionierten Dateien in generierte Appkopien: **438/438 bestanden**, 0 Fehler, 0 übersprungen.
- PHP-Lint: **37 Dateien bestanden**.
- JavaScript-Syntaxcheck, `git diff --check`, Produktionspaket und Secret-Pattern-Prüfung bestanden.
- Produktionspaket: **108 Dateien**, Base Path `""`.
- Screenshot-Versuch: In der Sandbox war kein Browser vorhanden. Die Installation des Ubuntu-Snap-Platzhalters konnte ohne funktionsfähigen Snap-Daemon keinen Chromium-Browser bereitstellen; daher wird keine visuelle Browserabnahme erfunden.

## 7. GitHub und CI

- Implementierungscommit `b8c1e20` (`feat: add user UI design editor`) wurde nach GitHub `main` übertragen.
- CodeQL / `Push on main`: Run `34287584612` – terminal `success`.
- FTPS Deploy: Run `34287585014` – terminal `success`, einschließlich Test-, Paket-, Upload- und Read-only-Smoke-Pfad.
- Dieser Bericht und die finale Checklist-Markierung werden ebenfalls nach `main` übertragen. Ihre CI wird vor der Abschlussmeldung terminal abgewartet; anschließend werden GitHub-Blob, `HEAD == origin/main` und sauberer Tree geprüft.

## 8. Betreiber-Device-Retest

1. `Admin → Appearance` öffnen: Titel `Appearance`, Bereiche Start Page / User UI Design / Advanced Custom CSS sichtbar.
2. Eine deutlich erkennbare Light-Farbe ändern, Preview prüfen, speichern und User-App in Light prüfen.
3. Eine Dark-Farbe ändern, Preview prüfen, speichern und User-App in Dark prüfen.
4. Radius oder Contentbreite ändern und reale User-App-Wirkung prüfen.
5. Reload/Warmstart und offline soweit praktikabel prüfen: Design bleibt erhalten, kein Loading-/White-Flash.
6. `Reset to Defaults` prüfen; Start Page und Custom CSS müssen dabei erhalten bleiben.
7. Kleines harmloses Custom-CSS-Override setzen, Wirkung nur in User-App prüfen und anschließend `Clear Custom CSS` testen.
8. Start Page in HTML- und/oder Modulmodus speichern und kurz regressiv prüfen.
9. Admin-Theme und persönliche User-Theme-Auswahl getrennt regressiv prüfen.

Automatisierte Tests ersetzen diese reale visuelle Device-Abnahme nicht. Bis zu diesem Retest gilt der neue Designeditor als code-seitig abgeschlossen; P1 und P4 bleiben aufgrund ihrer bereits erfolgten separaten Liveabnahmen `LIVE BESTANDEN`.
