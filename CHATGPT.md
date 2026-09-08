# NEUTRAL – Abschlussbericht Codex → ChatGPT/Lea

**Datum:** 2026-09-08  
**Auftrag:** P4-Device-Retest-Folgefehler und User-UX bereinigen  
**Status:** **P4 FOLGEFIX CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED**  
**P1:** **LIVE BESTANDEN**

## 1. Synchronisation und Capture

- Die Sandbox wurde zuerst mit `origin/main` synchronisiert.
- Ausgangs-`origin/main`: `eae8b35098484a0eba1d5b8574adfe2b049fc68c`.
- Die neue verbindliche `I18N.md`, die aktualisierte `DOCUMENTATION.md` und der neue Betreiberauftrag in `CODEX.md` wurden vollständig aus `origin/main` übernommen und nicht durch ältere lokale Fassungen ersetzt.
- Der divergierte lokale Stand wurde ohne Reset über Merge-Commit `8314044` integriert; danach bestand gegenüber `origin/main` vor Implementierung kein inhaltlicher Unterschied außer der gemeinsamen Historie.
- Der Gesamtauftrag wurde vor Implementierung vollständig nach `CURRENT-TASK.md` übernommen. Capture-Ergebnis: `CODEX.md == CURRENT-TASK-Anforderungen: JA`.

## 2. Root Causes und Korrekturen

### Startkontext und Reload

Root Cause: Der Homepagepfad rief denselben `renderModule()`-Pfad wie eine bewusste Modulnavigation auf. Dieser setzte `state.activeView = module:*`, `activeModuleId` und fokussierte anschließend den gesamten Content-Container. Damit wurde die konfigurierte Homepage beim Reload semantisch zur eigenständigen Modulansicht.

Korrektur:

- `renderModule(moduleId, { asHomepage: true })` rendert das Modul als Inhalt von `Start`, ohne den aktiven Navigationskontext zu verändern.
- Eine bewusste Auswahl im Modulmenü verwendet weiterhin die eigenständige Modulansicht.
- Bis die öffentliche Homepageprojektion geladen ist, zeigt die Shell nur einen neutralen Ladezustand.
- Im Modulmodus bleibt dieser Ladezustand auch bis zum Abschluss der Discovery bestehen. Dadurch erscheint vor gültigem GPS-Inhalt kein falscher Welcome-Default.

### Blauer GPS-Rahmen

Root Cause: `renderModule()` rief nach jedem Modulrender `content.focus()` auf. Der fokussierbare Main-Container behielt dadurch den Browser-Fokusrahmen, bis eine weitere Pointeraktion stattfand.

Korrektur:

- Der erzwungene Containerfokus wurde entfernt.
- Echte Tastaturnavigation behält explizite `:focus-visible`-Indikatoren auf Navigation, Karten, Aktionen und GPS-Buttons. Fokusaccessibility wurde nicht global deaktiviert.

### HTML-Homepage

Root Cause: Der allgemeine Welcome-/Produkttitelblock wurde immer vor dem HTML-Frame aufgebaut. Der Frame ersetzte nur den inneren Inhaltscontainer, nicht den statischen Headingblock.

Korrektur:

- Gültiger HTML-Inhalt besitzt einen eigenen frühen Renderpfad und bestimmt den vollständigen Startseiteninhalt.
- Welcome/Produktname erscheint ausschließlich als kontrollierter Fallback ohne gültigen HTML- oder zugänglichen Modulinhaltsvertrag.

### Login mit zwei Klicks

Root Cause: Beim App-Start lief `restoreServerSession()` parallel. Wenn der Nutzer währenddessen anmeldete, konnte eine ältere anonyme `/auth/me`-Antwort nach dem erfolgreichen Login eintreffen, `serverUser` wieder löschen und die Ansicht erneut rendern. Dies erzeugte den beobachteten Eindruck, der erste Login habe nicht funktioniert.

Korrektur:

- Login ist jetzt ein semantischer Formular-Submit; Klick und Enter verwenden exakt denselben Handler.
- Während eines laufenden Submits wird der Submitbutton deaktiviert.
- Eine `sessionRevision` bindet Restore-Ergebnisse an den Zustand, in dem sie gestartet wurden. Eine vor dem Login gestartete Antwort darf die neuere Loginidentität nicht mehr überschreiben.
- User-/Admin-Cookies, serverseitige Authentifizierung, CSRF und P1 wurden nicht verändert.

### Settings und GPS

- `Show all functions` und der zugehörige Browser-Alert wurden vollständig entfernt.
- Die individuelle persönliche Sichtbarkeitsauswahl bleibt erhalten und verändert keine serverseitige Berechtigung.
- Der sichtbare Bereich heißt nutzerorientiert `App areas`; angefasste Texte besitzen stabile `data-i18n-key`-Marker, ohne eine eigene Übersetzungsengine oder die vollständige `I18N.md`-Architektur zu implementieren.
- GPS zeigt Genauigkeit locale-fähig und gerundet als `± … m`.
- GPS-Zeit wird über `Intl.DateTimeFormat` lokal und menschenlesbar angezeigt.
- Rohgenauigkeit und ISO-Zeit bleiben für Logik, Persistenz und Diagnose unverändert erhalten.

## 3. Tests und lokale Verifikation

- Fokussierte User-App-/Login-/GPS-Regressionen: 32/32 bestanden.
- Vollständige Suite: 406/406 bestanden, 0 Fehler, 0 übersprungen.
- PHP-Lint aller Server-PHP-Dateien: bestanden.
- JavaScript-Syntaxprüfung aller relevanten Projektdateien: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, 104 Dateien, Base Path `""`.
- Secretprüfung: keine Token-, FTPS-, DB- oder sonstigen Secret-Werte in Änderungen oder Commit aufgenommen. Der gefundene Quelltextbegriff `password` ist ausschließlich die erwartete lokale Passwortfeldvariable.
- Keine künstliche Testdatei und keine neue Produkt-/I18N-Architektur wurden erzeugt.
- Screenshotprüfung wurde versucht. Die Umgebung besitzt keinen ausführbaren Browser; Playwright-CDN und Snap-basierter Chromium-Bezug waren durch die Umgebung blockiert. Es wurde kein Screenshotartefakt in das Repository geschrieben.

## 4. Dokumentation

Aktualisiert wurden:

- `CURRENT-TASK.md`: vollständige operative Liste und Abschlussstatus,
- `Architecture.md`: Startkontext- und Ladevertrag,
- `Functions.md`: Login-Race-, Homepage- und GPS-Formatierungsverhalten,
- `STATUS.md`, `TODO.md`, `ToDoNow.md`: tatsächlicher P4-Folgefix-/Device-Retest-Status,
- `CHANGELOG.md`: Root Causes und Änderungen,
- `WORKFLOW.md`: datiertes Arbeitsprotokoll mit Ausführendem Codex.

`I18N.md`, `DOCUMENTATION.md`, `CODEX.md` und `UI-UX.md` wurden nicht überschrieben.

## 5. GitHub, Deployment und CI

Implementierungscommit: `3b666dd` (`fix: refine P4 start and user experience`).

Nach Push auf `main` wurden die erforderlichen Workflows bis terminal abgewartet:

- FTPS Deploy Run `34198466106`: **SUCCESS**.
- Push on main / CodeQL Run `34198465658`: **SUCCESS**.

Die Dokumentationsübergabe wird ebenfalls nach `main` übertragen; der dadurch ausgelöste reine Dokumentationslauf wird vor der externen Abschlussmeldung terminal abgewartet. `CHATGPT.md` wird anschließend per GitHub-Blob-Hash gegen die lokale Datei verifiziert.

## 6. Externer Betreiber-Retest

Keine selbst ausführbare Entwicklungs- oder Verifikationsarbeit bleibt offen. Der folgende echte Device-Test bleibt absichtlich extern:

1. `Appearance → Module → GPS` speichern und User-App neu laden.
2. Prüfen: `Start` bleibt aktiv; GPS erscheint als Inhalt von `Start`; der GPS-Modultab wird nicht automatisch aktiv.
3. Prüfen: Vor GPS erscheint kein alter Welcome-/Neutral-Inhalt.
4. GPS bewusst über seinen Navigationseintrag öffnen und neu laden; kein persistenter blauer Containerrahmen darf erscheinen. Per Tastatur müssen Bedienfelder weiterhin sichtbar fokussierbar sein.
5. `Appearance → Text / HTML` mit `<h1>TEST</h1>` speichern und neu laden; ausschließlich der konfigurierte Inhalt darf erscheinen, ohne festen Welcome-/Neutral-Block.
6. User abmelden, Passwort eingeben und Login genau einmal klicken bzw. Enter drücken; die authentifizierte Ansicht muss mit einer Aktion erscheinen.
7. Settings öffnen: kein `Show all functions`; persönliche App-Areas-Auswahl speichern und prüfen, dass nur die Navigation angepasst wird.
8. GPS prüfen: Genauigkeit als gerundetes `± … m`, Zeitpunkt lokal und lesbar.
9. User-App und Admin parallel öffnen und P1-Sessiontrennung erneut bestätigen.

P4 darf erst nach diesem positiven Betreiberbefund `LIVE BESTANDEN` werden. Bis dahin bleibt der Status **FOLGEFIX CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED**. P1 bleibt **LIVE BESTANDEN**.

## 7. Scope

Nicht implementiert wurden die vollständige I18N-/Sprachpaket-/Providerarchitektur, ein neues Designsystem, Sync-Engine, Offline-Queue, Store-App-Wrapper oder neue Produktmodule.
