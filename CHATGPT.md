# NEUTRAL – CODEX ABSCHLUSSBERICHT

**Richtung:** Codex → ChatGPT/Lea
**Auftrag:** Weißer Initial-Paint/Flash der HTML-Homepage auf iPad/Safari
**Datum:** 2026-09-08
**Status:** CODE-SEITIG ERLEDIGT / BETREIBER-DEVICE-RETEST ERFORDERLICH

## 1. Auftrag und Wahrheitsstand

- Die neue Sandbox wurde secretsicher mit `origin/main` verbunden und vollständig synchronisiert. Der neuere Betreiberauftrag aus `CODEX.md` wurde erhalten, vollständig nach `CURRENT-TASK.md` übernommen und mit `CODEX.md == CURRENT-TASK-Anforderungen: JA` geprüft.
- Der reale iPad/Safari-Befund hatte Vorrang: Der dokumentinterne Theme-Adapter beseitigt inzwischen die dauerhaft weiße Fläche, aber vor dem korrekt dunklen Endzustand blieb ein kurzer weißer Initial-Paint sichtbar.
- Live bestätigte Local-first-Warmstart-, Theme-, Settings-, Home-, Navigation-, Button-, GPS-, Login- und FTPS-Fixes wurden nicht zurückgebaut. P1 bleibt `LIVE BESTANDEN`; P4 bleibt bis zum positiven Betreiber-Retest unterhalb `LIVE BESTANDEN`.

## 2. Root Cause

Der User-App-Code bereitete zwar Theme, dokumentinterne Defaults und `srcdoc` vor `host.appendChild(frame)` vor. Trotzdem war das iframe selbst unmittelbar nach der DOM-Insertion sichtbar. Safari/WebKit konnte dadurch seinen anfänglichen leeren/noch nicht committed Browsing Context weiß zeichnen, bevor das bereits korrekt thematisierte `srcdoc` seinen ersten `load` und finalen Paint erreicht hatte.

Der vorherige Auftrag korrigierte also den **Dokument-Endzustand**, nicht die separate **Sichtbarkeitsphase vor dem Dokument-Commit**. Der neue Betreiberbefund – kurzer White-Flash, danach dauerhaft korrekt dunkel – grenzt diese beiden Ursachen eindeutig voneinander ab.

## 3. Paint-/Lifecycle-Korrektur

- Jeder Homepage-Frame beginnt ohne `homepage-frame-ready`; CSS hält ihn deshalb strukturell mit `visibility:hidden` außerhalb des sichtbaren Paintpfads.
- Noch vor `srcdoc` wird ein einmaliger `load`-Handler registriert. Theme-`color-scheme`, passender iframe-Background und das vollständige thematisierte Dokument werden gesetzt, bevor die User-App den Frame in den DOM einhängt.
- Erst der `load` des aktuell vorbereiteten Dokuments setzt `homepage-frame-ready` und macht den Frame sichtbar.
- Jede Anwendung erhält eine monoton steigende Frame-Revision. Ein Handler einer überholten Navigation darf die Ready-Klasse nicht für einen neueren Theme-/Dokumentzustand setzen.
- Der Wrapper reserviert weiterhin die vorhandene 60-vh-Fläche und zeichnet während des gesamten Gates bereits `var(--surface)`/`var(--text)` des aktuellen Themes. Es gibt daher weder Layoutsprung noch weißen Placeholder.
- Es wurde kein Timeout, kein `requestAnimationFrame`, keine Animation, kein künstlicher Delay und kein altes `Loading` hinzugefügt. Ist der thematisierte Frame bereits detached geladen, wird er vor der sichtbaren Insertion unmittelbar ready.
- Beim Header-Wechsel erzeugt der bestehende Renderpfad einen neuen, bereits passend vorbereiteten versteckten Frame; der Wrapper wechselt sofort mit der App-Surface. Auch Light↔Dark besitzt dadurch keinen absichtlich sichtbaren unthematisierten Zwischenzustand.

## 4. Unveränderte Verträge

- Freies Administrator-HTML wird weiterhin exakt einmal übernommen und nicht heuristisch umgeschrieben oder sanitisiert. Der bestehende Dokumentadapter ergänzt ausschließlich davorliegende Defaults; späteres ausdrückliches Administrator-CSS bleibt maßgeblich.
- Sandbox bleibt exakt `allow-scripts allow-forms allow-popups`; keine Security-Lockerung.
- Local-first Homepagecache, synchroner Warmstart, Hintergrundrefresh und Offline-Shell bleiben unverändert.
- Appearance bleibt aus normalen User Settings entfernt. Header-Sonne/Mond und derselbe persistente lokale Theme-State bleiben erhalten.
- Home/GPS, GPS, Login, zentrales Buttonsystem, P1-Sessiontrennung, Auth/CSRF, Service Worker, Packaging/Base Path und FTPS-/Smoke-Stabilisierung blieben regressionsfrei.

## 5. Tests und Verifikation

- Fokuspaket einschließlich Homepage-Lifecycle, Dokumentadapter, Cache, Service Worker, Packaging und User-Auth: **86/86 bestanden**.
- Vollständige Suite: **426/426 bestanden**, 0 Fehler, 0 übersprungen.
- PHP-Lint: **36 Dateien bestanden**.
- JavaScript-Syntaxcheck: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, **106 Payload-Dateien**, Base Path `""`.
- Secret-Pattern-Prüfung: bestanden; keine Zugangswerte aufgenommen.
- Ein echter visueller Safari-Test war in der Codex-Sandbox nicht möglich, weil weder Safari/iPad noch Chromium/Chrome oder ein Browserdriver verfügbar ist. Die Tests schließen deshalb den bekannten fehlerhaften DOM-/Lifecycle-Pfad strukturell aus; eine visuelle Livebestätigung wird nicht erfunden.

## 6. GitHub, FTPS und CodeQL

- Implementierungscommit: `5574596` (`fix: gate themed homepage frame paint`), nach GitHub `main` übertragen.
- Implementierungs-CI terminal erfolgreich:
  - `FTPS Deploy`: Run `34225058917` – `success`, einschließlich Tests, Paketbau, Upload und read-only Produktions-Smoke.
  - `Push on main` / CodeQL: Run `34225058522` – `success`.
- Der Bericht und die operative Abschlussmarkierung werden ebenfalls nach `main` übertragen. Vor der externen Abschlussmeldung werden deren CI, `HEAD == origin/main`, sauberer Working Tree und der GitHub-Blob von `CHATGPT.md` erneut verifiziert.

## 7. Noch erforderlicher Betreiber-Retest

1. Dark Mode aktivieren.
2. HTML-Homepage `<h1>TEST</h1>` mehrfach öffnen und reloaden.
3. Bestätigen, dass weder beim ersten Paint noch beim Reload ein weißer Flash erscheint.
4. Light↔Dark über den Header wechseln und ebenfalls auf einen Flash prüfen.
5. Settings kurz prüfen: Appearance bleibt entfernt.
6. Home, GPS und Warmstart kurz regressiv prüfen.

Bis diese sechs realen iPad/Safari-Schritte positiv bestätigt sind, bleibt der Status `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`.
