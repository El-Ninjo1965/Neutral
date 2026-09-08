# NEUTRAL – Abschlussbericht Codex → ChatGPT/Lea

**Datum:** 2026-09-08  
**Auftrag:** Local-first Warmstart-Performance und zentrale App-Navigation  
**Status:** **P4 WARMSTART-/NAV-FIX CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED**  
**P1:** **LIVE BESTANDEN**

## Synchronisation und Capture

- Zuerst wurde `origin/main` (`744db4b`) synchronisiert.
- Die neueren verbindlichen Fassungen von `CODEX.md` und `UI-UX.md`, insbesondere der Local-first-Warmstart-/Reload-Vertrag, wurden vollständig aus `origin/main` übernommen und nicht durch ältere lokale Fassungen ersetzt.
- Die divergierte lokale Arbeitslinie wurde ohne Reset im Merge-Commit `d1e9bfc` integriert.
- Der vollständige Auftrag wurde vor Implementierung in `CURRENT-TASK.md` erfasst. Prüfung: `CODEX.md == CURRENT-TASK-Anforderungen: JA`.

## Root Cause der circa zweisekündigen Loading-Phase

Die Homepageprojektion wurde bei jedem Reload ausschließlich über `/api/settings/homepage` vom Server bezogen. `homepageConfig` existierte nur im flüchtigen Arbeitsspeicher und `homepageResolved` startete immer mit `false`. Der erste sinnvolle Homepage-Render wartete daher bei jedem Aufruf erneut auf den Netzwerk-/PHP-Pfad. Service Worker, Session-Restore und Modul-Discovery waren nicht die Ursache der bereits bekannten HTML-Homepage-Wartezeit; sie liefen bereits unabhängig. Es gab schlicht keinen zulässigen synchronen lokalen Homepagezustand.

Der Delay wurde nicht versteckt, animiert oder durch einen kürzeren Timeout kaschiert. Der Datenfluss wurde Local-first geändert.

## Implementierung

### Öffentlicher Homepage-Warmstartcache

- Neues zentrales `NeutralHomepageCache` mit Storage-Key `neutral.public.homepage.v1`, `schemaVersion: 1` und festem Scope `public-homepage`.
- Persistiert wird ausschließlich die bereits öffentlich lesbare Homepageprojektion (`mode`, `title`, `content`, `moduleId`).
- Gültiges HTML wird beim Warmstart synchron vor dem Serverrefresh gelesen und kann beim ersten User-App-Render unmittelbar erscheinen.
- Nach erfolgreichem Serverfetch ersetzt die neue Projektion den älteren Cache kontrolliert und rendert sofort neu.
- Offline bleibt die letzte gültige öffentliche Projektion verfügbar.
- Kaltstart ohne gültigen Cache behält den ehrlichen Loading-/Fallback-Pfad.
- Leere, malformed, inkompatibel versionierte oder nicht als `public-homepage` markierte Records werden verworfen.
- Es werden keine Sessionidentitäten, Rollen, Permissions oder authentifizierten Modulkataloge in diesem Cache gespeichert.

Der Modulmodus verwendet ebenfalls die lokal bekannte öffentliche Homepageauswahl, rendert das Modul aber weiterhin erst aus der vorhandenen permission-aware Modul-Discovery. Viewer-/Access-Fail-Closed wurde nicht aufgeweicht.

### Messbarkeit

- `homepage-local-ready` markiert den synchron verfügbaren lokalen Homepagezustand.
- `homepage-refresh-ready` markiert die gültige Serveraktualisierung.
- Tests sichern zusätzlich die Reihenfolge Cache-Read → erster Render → verzögerter Serverrefresh.

### Zentrale Navigation

- `Start`, `GPS` und spätere sichtbare Produktbereiche verwenden weiterhin zentral `.user-app-nav-item`.
- Die zentrale Klasse besitzt jetzt mindestens 44px Touchhöhe, sichtbaren Rahmen, Fläche, Radius und Shadow.
- Der aktive Zustand verwendet eine klare gefüllte Darstellung statt eines bloßen Textlink-Unterstrichs.
- Hover ist nur Ergänzung; Bedienbarkeit hängt nicht davon ab.
- `:focus-visible` bleibt accessibility-konform sichtbar.
- Light- und Dark-Theme besitzen jeweils explizite Normal-, Hover- und Active-Farben.
- Keine Modul-eigenen Navigationsstile und keine automatische Veränderung des freien Administrator-HTMLs wurden eingeführt.

## Tests und Verifikation

- Fokussierte Homepage-/Warmstart-/Navigation-/P4-/Login-/Packaging-Tests: 61/61 bestanden.
- Vollständige Suite: 412/412 bestanden, 0 Fehler, 0 übersprungen.
- PHP-Lint aller Server-PHP-Dateien: bestanden.
- JavaScript-Syntaxprüfung: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, 105 Dateien, Base Path `""`; `homepage-cache.js` ist Entry-, Rewrite-, Service-Worker- und Package-Bestandteil.
- Secretprüfung: keine Token-, FTPS-, DB- oder sonstigen Secret-Werte eingebracht.
- Keine künstliche Testdatei, neue Sync-/Queue-Architektur oder vollständige I18N-Implementierung.
- Ein Screenshot konnte mangels ausführbarem Browser in dieser Containerumgebung nicht erzeugt werden; Playwright-CDN/Snap-Chromium stehen hier nicht zur Verfügung. Es wurde kein Artefakt committed.

## Dokumentation

Aktualisiert wurden `Architecture.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md`, `WORKFLOW.md`, `CURRENT-TASK.md` und dieser Bericht. Die neue `UI-UX.md` und `CODEX.md` wurden nicht überschrieben.

## GitHub und CI

Implementierungscommit: `719a90f` (`fix: make homepage warmstarts local-first`).

Terminale Ergebnisse nach Push auf `main`:

- FTPS Deploy Run `34205494123`: **SUCCESS**.
- Push on main / CodeQL Run `34205494188`: **SUCCESS**.

Der Abschlussbericht wird ebenfalls nach `main` übertragen; dessen CI wird vor der externen Abschlussmeldung vollständig abgewartet. Danach wird `CHATGPT.md` per GitHub-Blob-Hash verifiziert.

## Betreiber-Retest

1. HTML-Startseite einmal online laden.
2. Mehrfach reloaden und App neu öffnen: der bekannte HTML-Inhalt soll ohne sichtbare circa zweisekündige Loading-Phase unmittelbar erscheinen.
3. Verbindung deaktivieren und denselben Offline-Warmstart prüfen.
4. Wieder online gehen, Homepage serverseitig ändern und prüfen, dass der lokale Inhalt zunächst erscheint und anschließend kontrolliert auf die neue Serverversion aktualisiert wird.
5. `Module → GPS` setzen und warmstarten: `Start` bleibt aktiv; GPS erscheint so früh wie der permission-aware lokale Discoveryzustand es sicher erlaubt.
6. `Start` und `GPS` per Touch prüfen: beide müssen eindeutig wie App-Navigationsaktionen wirken, Active-Zustand klar.
7. Light-/Dark-Theme und Tastaturfokus prüfen.
8. Persönliche `App areas`-Auswahl prüfen; ausgeblendete oder nicht erlaubte Bereiche dürfen nicht erscheinen.
9. User-App und Admin parallel öffnen und P1-Sessiontrennung bestätigen.

Bis zu diesem positiven Test bleibt P4 **WARMSTART-/NAV-FIX CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED**. Die zuvor positiv getesteten P4-/GPS-/HTML-/Loginpunkte und P1 bleiben erhalten.

## Scope

Nicht implementiert: vollständige I18N-/Sprachpaket-/Providerarchitektur, Sync-Engine, Offline-Queue, Store-App-Wrapper, neues Produktmodul, Admin-Redesign oder vollständiger Designsystemersatz.

## Abschlussdokumentationslauf

Auch der erste Berichtslauf endete terminal erfolgreich: FTPS Deploy Run `34206023852` und Push on main / CodeQL Run `34206023656` jeweils **SUCCESS**. Der nachfolgende reine Checklist-Abschlusslauf wird vor der externen Antwort ebenfalls bis zum terminalen Status abgewartet.
