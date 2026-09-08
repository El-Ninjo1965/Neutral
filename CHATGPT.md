# NEUTRAL – CODEX ABSCHLUSSBERICHT

**Richtung:** Codex → ChatGPT/Lea
**Auftrag:** User-App Visual Cleanup nach Betreiber-Device-Retest
**Datum:** 2026-09-08
**Status:** CODE-SEITIG ERLEDIGT / BETREIBER-DEVICE-RETEST ERFORDERLICH

## 1. Übergabe und Scope

- Die Sandbox wurde zuerst mit `origin/main` synchronisiert. Der neuere Betreiberauftrag aus `CODEX.md` wurde erhalten, vollständig nach `CURRENT-TASK.md` übernommen und mit `CODEX.md == CURRENT-TASK-Anforderungen: JA` geprüft.
- Der Scope blieb auf dem beauftragten visuellen User-App-Folgepaket. Es wurde keine vollständige I18N-/Übersetzungsarchitektur, keine allgemeine Modul-Icon-Architektur, keine neue Sync-/Queue-Lösung und keine weitere P4-Featurearbeit begonnen.
- Die live bestätigten Warmstart-, Theme-, GPS-, HTML-, Navigations- und FTPS-Stabilisierungen wurden nicht zurückgebaut. P1 bleibt `LIVE BESTANDEN`; P4 erhält ohne den unten beschriebenen Betreiber-Retest keine erfundene Live-Freigabe.

## 2. Root Causes

### Button- und Navigationshierarchie

Die User-App hatte mehrere historisch übereinanderliegende Komponentenregeln. Header-Actions und Navigation besaßen jeweils eigene Radien, Konturen, Flächen und Zustände; eine späte Regel setzte den aktiven Navigationszustand wieder auf eine sehr weiche hellgrüne Fläche. Besonders im Light Mode fehlte deshalb eine verbindliche, kontrastreiche gemeinsame Hierarchie.

### Große helle Fläche der freien HTML-Homepage

Der gespeicherte Betreiberwert ist laut aktuellem Auftrag das schlichte `<h1>TEST</h1>`; im Renderpfad wird dieser Wert weiterhin exakt als `frame.srcdoc = homepage.content` gesetzt. Die auffällige Fläche stammt damit nicht aus einem vom Administrator gespeicherten Background-Style und auch nicht aus einem Sanitizer.

Die Frameworkursache lag an der isolierten Browsing-Context-Fläche des sandboxed `srcdoc`-iframes: Der Container war zwar transparent und deklarierte allgemein `color-scheme: light dark`, aber die Einbettung wählte nicht ausdrücklich das aktive App-Theme. Der unabhängige User-Agent-Canvas konnte daher auch unter Dark Theme im Light-Farbraum bleiben. Der Frame erhält nun bei seiner Erstellung den aktuellen lokalen `color-scheme`. Das gespeicherte HTML wird weder umgeschrieben noch sanitisiert; ausdrücklich im freien Inhalt gesetzte Administrator-CSS bleibt maßgeblich.

Eine direkte Live-API-Abfrage aus dieser Sandbox wurde vom vorgeschalteten CONNECT-Proxy mit HTTP 403 blockiert. Diese Umgebungsgrenze ändert nicht die Codepfad- und Betreiberwertanalyse und wurde nicht durch Credentials oder einen unsicheren Umgehungsweg kaschiert.

## 3. Änderungen

### Zentraler Buttonvertrag

- Neue zentrale Tokens definieren Mindesthöhe, Radius, Border-Stärke, horizontalen Innenabstand sowie Secondary-, Active- und Fokusfarben für Light und Dark.
- `.ui-button` bildet die gemeinsame Basis; `--primary`, `--secondary`, `--navigation` und `--icon` bilden nachvollziehbare Varianten.
- Header-Theme, Settings, Login/Logout und zentrale Navigation verwenden denselben Vertrag.
- Jede Aktion bleibt mindestens 44 px hoch. Pointer-Hover liegt in einer passenden Hover/Pointer-Media-Query; Touch ist davon unabhängig. `:focus-visible` bleibt klar erkennbar.
- Der aktive Navigationszustand verwendet eine eindeutige zentrale Fläche/Kontur/Textfarbe. Inaktive Light-Buttons haben eine sichtbar stärkere Kontur, während Dark Mode seine bestehende Qualität behält.

### Lokales Home-Icon

- Die sichtbare Beschriftung `Start` wurde nur in der Navigation durch ein lokales Inline-SVG-Haus ersetzt; es gibt keine externe Netzwerkabhängigkeit und keine Emoji-Renderingabhängigkeit.
- `aria-label="Start"`, `title="Start"`, Tastaturfokus und `aria-current="page"` sichern Verständlichkeit und Accessibility.
- Die zugrunde liegende ID bleibt `home`; Click-, Route-, Homepage- und aktive Zustandslogik sind unverändert. `GPS` bleibt absichtlich Text.

### HTML-Homepage

- Der Sandbox-Frame wählt den aktuellen Light-/Dark-Farbraum über die Einbettung.
- Der freie Administratorinhalt bleibt bytegetreu und wird nicht heuristisch manipuliert.
- Sandboxattribute, Local-first-Cache, Hintergrundrefresh und Warmstartpfad bleiben unverändert.

### Reduzierte Loginseite

- `ACCOUNT ACCESS`, `Use your local workspace account to unlock available features.` und `Sign in with your configured account.` wurden aus der normalen anonymen Ansicht entfernt.
- Sichtbar bleiben `Login`, Username, Password und die Login-Aktion.
- Labels, Autocomplete, semantischer Formular-Submit, `role=status`/`aria-live`, Zwischenstatus, echte Server-/Verbindungsfehler und die bestehende Session-Race-Sicherung bleiben erhalten.

## 4. Tests und Verifikation

- Fokusregressionen für Homepagecache, Start/Navigation, gemeinsamen Buttonvertrag, Home-SVG/A11y, Theme-Canvas und Login: **42/42 bestanden**.
- Vollständige Suite: **418/418 bestanden**, 0 Fehler, 0 übersprungen.
- PHP-Lint: **36 Dateien bestanden**.
- JavaScript-Syntaxcheck: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, **105 Payload-Dateien**, Base Path `""`.
- Secret-Pattern-Prüfung des Diffs: bestanden; keine Secrets oder Zugangswerte aufgenommen.
- Visueller lokaler Screenshot war in der Sandbox nicht ausführbar, weil weder Chromium/Chrome noch ein Browserdriver installiert ist. Die Änderung ist deshalb zusätzlich durch DOM-/CSS-Vertragsregressionen abgesichert; die reale visuelle Abnahme bleibt bewusst beim Betreiber-Device-Retest.

## 5. GitHub, FTPS und CodeQL

- Implementierungscommit: `8b2fdee5577906ee9891a48d62a7b83b54e029ab` (`fix: refine user app visual controls`).
- GitHub-Authentifizierung und Schreibzugriff für `El-Ninjo1965/Neutral` wurden secretsicher bestätigt; der Commit wurde nach `main` übertragen.
- Erster Implementierungs-CI-Lauf terminal erfolgreich:
  - `FTPS Deploy`: Run `34214340128` – `success`.
  - `Push on main` / CodeQL: Run `34214339451` – `success`.
- Der abschließende Bericht und die operative Checkliste werden in einem eigenen Dokumentationscommit ebenfalls nach `main` übertragen; dessen terminale CI und die GitHub-Blob-Verifikation sind Bestandteil der finalen Abschlussprüfung.

## 6. Betreiber-Device-Retest

1. **Light Mode:** Header-Theme/Settings/Login bzw. Logout sowie Home/GPS-Navigation auf klare, ruhige Hierarchie, Kontur, gleiche Höhe und aktive/inaktive Zustände prüfen.
2. **Dark Mode:** dieselben Elemente regressiv prüfen; insbesondere Lesbarkeit, Fokus und aktiven Navigationszustand bestätigen.
3. **Home-Icon:** Haus-Symbol antippen und unveränderte Start-/Homepage-Funktion bestätigen; optional Tastatur/Screenreader mit Accessible Name `Start` prüfen.
4. **HTML:** in Appearance `<h1>TEST</h1>` speichern, Dark aktivieren und bestätigen, dass kein künstlicher großer weißer Frameworkblock erscheint. Danach optional explizites eigenes Background-CSS prüfen; dieses muss unverändert wirken.
5. **Login:** abmelden/anonymous öffnen und bestätigen, dass nur Login, Username, Password und Login-Aktion als Standardinhalt erscheinen; einen echten Fehlversuch auf klare Fehlermeldung prüfen.
6. **Kurzregression:** Warmstart/Reload ohne früheres sichtbares Loading, GPS-Funktion und unmittelbaren persistenten Theme-Switch bestätigen.

Bis dieser reale Retest positiv gemeldet wird, bleibt der wahrheitsgemäße Status `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`.
