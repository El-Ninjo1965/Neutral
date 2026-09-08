# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Die am 2026-09-08 live bestätigten P4-Folgefehler ursächlich beheben: korrekte Startkontext-/Reload-Semantik ohne Default-Flash, HTML-Startseite ohne festen Welcome-Block, accessibility-konforme Fokusdarstellung, zuverlässiger Ein-Klick-User-Login, bereinigte persönliche Bereichsauswahl sowie menschenlesbare GPS-Werte. P1 bleibt unverändert `LIVE BESTANDEN`; die vollständige I18N-Architektur wird nicht implementiert.

## Nummerierte, überprüfbare Arbeitspunkte

1. `origin/main` vollständig synchronisieren und neue `CODEX.md`, `I18N.md` und `DOCUMENTATION.md` unverändert erhalten. **Status: ERLEDIGT**
2. Alle in `CODEX.md` verlangten Verträge, Status-, Implementierungs- und Testdateien vollständig lesen. **Status: ERLEDIGT**
3. Regressionstests zuerst für Startkontext, Reload, Default-Flash, HTML-Welcome-Block, Fokus, Ein-Klick-Login, Settings-Auswahl und GPS-Formatierung ergänzen/anpassen. **Status: ERLEDIGT**
4. Modul-Homepage innerhalb des aktiven `Start`-Kontexts rendern, ohne zum Modul-Tab zu wechseln; eigenständige Modulnavigation weiterhin ermöglichen. **Status: ERLEDIGT**
5. Initialen Default-Welcome-Flash verhindern, bis die zentrale Homepage-Projektion aufgelöst ist; Offline-/Fehlerfallback kontrolliert erhalten. **Status: ERLEDIGT**
6. HTML-Modus ausschließlich mit dem konfigurierten Startinhalt rendern; Welcome/Neutral nur als tatsächlichen Fallback anzeigen. **Status: ERLEDIGT**
7. Persistenten blauen GPS-Reload-Rahmen an seiner Focus-Ursache accessibility-konform beheben und Tastatur-`:focus-visible` erhalten. **Status: ERLEDIGT**
8. User-Login so korrigieren, dass eine gültige Submit-Aktion genau einmal genügt; P1, sichere Session, Auth und CSRF unverändert lassen. **Status: ERLEDIGT**
9. `Show all functions` samt Alert entfernen; individuelle persönliche Bereichsauswahl erhalten und strikt von Berechtigungen getrennt lassen. **Status: ERLEDIGT**
10. Angefasste Settings-Texte nutzerorientiert und für den späteren zentralen I18N-Vertrag offen formulieren, ohne vollständige I18N-Architektur/Insellösung. **Status: ERLEDIGT**
11. GPS-Genauigkeit nur sichtbar sinnvoll runden (`± … m`) und Rohpräzision intern erhalten. **Status: ERLEDIGT**
12. GPS-Zeit sichtbar lokal/menschenlesbar über vorhandene `Intl`-/Locale-Fähigkeit formatieren und Roh-/ISO-Zeit intern erhalten. **Status: ERLEDIGT**
13. P1, Auth/CSRF, Module Access, Offline-Fallback, Appearance, Theme und Modul-Lifecycle regressionsfrei halten. **Status: ERLEDIGT**
14. Keine Scope-Ausweitung auf vollständige I18N-/Provider-/Sprachpaketarchitektur, Designsystem, Sync/Queue, Store-Wrapper oder neue Module. **Status: ERLEDIGT**
15. Betroffene Verträge, `STATUS.md`, `TODO.md`, `CHANGELOG.md` und Workflow-Arbeitsprotokoll wahrheitsgemäß aktualisieren; P4 bleibt bis Betreiber-Retest unterhalb `LIVE BESTANDEN`. **Status: ERLEDIGT**
16. Fokussierte Tests, vollständige Suite unter PHP 8.1+, PHP-Lint, JS-Syntax, `git diff --check`, Produktionspaket sowie Secret-/Artefaktprüfung ausführen. **Status: ERLEDIGT**
17. Vollständigen Abschlussbericht in `CHATGPT.md` mit Root Causes, Änderungen, Tests, Commits, CI und konkreten Betreiber-Retestschritten erstellen. **Status: IN ARBEIT**
18. Committen, nach GitHub `main` pushen, `HEAD == origin/main`, sauberen Working Tree und `CHATGPT.md` auf GitHub verifizieren sowie FTPS, CodeQL und weitere CI terminal abwarten. **Status: AUSSTEHEND**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

## Operative Wahrheiten und Grenzen

- Aktueller Livebefund: P4-Modul- und HTML-Inhalt funktionieren grundsätzlich, die in diesem Auftrag benannten UX-/Reload-Fehler sind live nachgewiesen.
- P4 bleibt bis zum erneuten positiven Betreiber-Livetest unterhalb `LIVE BESTANDEN`.
- P1 bleibt `LIVE BESTANDEN`; User-/Admin-Sessiontrennung wird nicht verändert.
- Nutzerpräferenz zum Ausblenden von Bereichen ändert niemals serverseitige Rechte.
- Keine vollständige I18N-Implementierung.
