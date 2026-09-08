# NEUTRAL – CURRENT TASK

## Gesamtauftrag

P4 und `Admin → Appearance` vollständig umsetzen. `Settings` und `Appearance`
werden fachlich und technisch getrennt; die globale Startseite wird zentral in
Appearance konfiguriert. P1 und die getrennten User-/Admin-Sessions bleiben
unverändert `LIVE BESTANDEN`.

## Nummerierte, überprüfbare Arbeitspunkte

1. Repository synchronisieren, Git-Stand prüfen und alle in `CODEX.md` verpflichtend genannten Verträge, Statusdateien, Codepfade und relevanten Tests vollständig lesen. **Status: ERLEDIGT**
2. Bestehenden Settings-, Appearance-, Registry-, Persistenz-, API-, Startup-, Router-, Navigation-, Offline- und Auth/CSRF-Datenfluss vollständig analysieren. **Status: ERLEDIGT**
3. Regressionstests zuerst ergänzen: Settings und Appearance sind unterschiedliche Views; nur Appearance enthält die globale Startseiten-Konfiguration. **Status: ERLEDIGT**
4. `Admin → Settings` auf ausschließlich System-/Technikeinstellungen begrenzen, ohne bestehende funktionierende Einstellungen zu verlieren. **Status: ERLEDIGT**
5. Eigenständige `Admin → Appearance`-View für Theme, Layout und globale Startseiten-Konfiguration umsetzen; kein gemeinsames Copy/Paste-Rendering mit Settings. **Status: ERLEDIGT**
6. Modulmodus umsetzen: dynamische Auswahl aller aktivierten und als Startziel verfügbaren Module aus der bestehenden Registry-/Manifestquelle; deaktivierte, fehlende und ungültige Module ausschließen. **Status: ERLEDIGT**
7. Modulmodus dauerhaft über den bestehenden zentralen Settings-/Config-Vertrag speichern und laden; neue passende Module automatisch berücksichtigen. **Status: ERLEDIGT**
8. HTML-Modus umsetzen: freie Text-/HTML-Eingabe einschließlich vollständigem HTML, Inline-CSS, Links, Bildern und JavaScript unverändert ohne neu eingeführte Sanitization speichern/laden; passende Vorschau vorsehen. **Status: ERLEDIGT**
9. Wechsel zwischen `module` und `html` konsistent speichern und nach Reload wiederherstellen. **Status: ERLEDIGT**
10. Globale Startseitenänderungen ausschließlich über geschützte Admin-/CSRF-Pfade erlauben; normale User dürfen sie nicht ändern und Secrets gehören nicht in die Konfiguration. **Status: ERLEDIGT**
11. User-App-Start integrieren: Konfiguration zuverlässig laden, gültiges Modul öffnen oder HTML-Inhalt als Startseite rendern; ungültige/fehlende Konfiguration robust auf bisherigen Default zurückfallen lassen. **Status: ERLEDIGT**
12. Reload, bestehende Navigation und Offline-first-Fallback/Cache über vorhandene Mechanismen kompatibel halten; keinen parallelen Konfigurationssonderweg einführen. **Status: ERLEDIGT**
13. P1-Sessiontrennung, Admin-Auth und CSRF unverändert erhalten und durch Regressionstests absichern. **Status: ERLEDIGT**
14. Mindesttests vollständig abdecken: dynamische aktive Modulliste, Ausschluss deaktivierter/ungültiger Module, Persistenz, Modulstart, Default-Fallback, unverändertes HTML/CSS/JS, HTML-Start und beide Moduswechsel. **Status: ERLEDIGT**
15. Relevante Vertrags-, Status-, TODO- und Changelog-Dokumentation auf den tatsächlichen Endstand aktualisieren; P4 höchstens `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`. **Status: ERLEDIGT**
16. Fokussierte Tests, vollständige `npm test`-Suite unter PHP 8.1+, PHP-Lint betroffener Dateien, `node --check` betroffener JS-Dateien, `git diff --check`, Secret-/Artefaktprüfung und Produktionspaket ausführen. **Status: ERLEDIGT**
17. `CHATGPT.md` mit vollständigem Abschlussbericht und konkreten Betreiber-Retestschritten aktualisieren. **Status: ERLEDIGT**
18. Finalen Projektstand committen und authentifiziert nach GitHub `main` pushen. **Status: ERLEDIGT**
19. `CHATGPT.md` auf GitHub `main` verifizieren sowie `HEAD == origin/main` und sauberen Working Tree prüfen. **Status: ERLEDIGT**
20. FTPS, CodeQL und weitere erforderliche CI bis zum terminalen Status abwarten und wahrheitsgemäß dokumentieren. **Status: ERLEDIGT**

## Verbindliche Design- und Persistenzentscheidung

- `Admin → Appearance`: Theme, Layout und globale Startseiten-Konfiguration.
- `Admin → Settings`: ausschließlich System-/technische Einstellungen.
- Persistente Felder mindestens: Modus `module` oder `html`, gewähltes Modul im
  Modulmodus und freier HTML-/Textinhalt im HTML-Modus.
- Bestehenden zentralen Settings-/Config-Vertrag verwenden; keine parallele
  Konfigurationsarchitektur.
- Freies Admin-HTML/JS ist eine bewusste Betreiberentscheidung und darf nicht
  automatisch verändert oder sanitisiert werden.

## Sicherheits- und Statusgrenzen

- Keine Secrets oder Zugangsdaten in Settings/Appearance speichern.
- Keine unrelated Refactorings und keine Verträge wegen lokaler Runtimeprobleme zurückbauen.
- Keine Änderung an P1 oder Übertragung eines Admin-Kontexts in die User-App.
- P4 bleibt bis zum echten Betreiber-Gerätetest `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`; niemals vorzeitig `LIVE BESTANDEN` melden.

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

## Betreiber-Retest nach erfolgreichem Deploy

1. Admin → Settings öffnen; dort darf keine Appearance-/Startseiten-Doppelansicht erscheinen.
2. Admin → Appearance öffnen.
3. Modus `Modul` wählen, aktives Modul speichern, App neu laden und Startziel prüfen.
4. Modus `Text/HTML` wählen, einfachen HTML-Inhalt speichern, App neu laden und Darstellung prüfen.
5. Zurück auf Modulmodus wechseln und Persistenz prüfen.
6. Parallel P1 prüfen: User-App-User und Admin-Login bleiben getrennt.
