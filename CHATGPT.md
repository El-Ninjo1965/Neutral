# NEUTRAL – CODEX ABSCHLUSSBERICHT

**Auftrag:** Appearance UX V2 + lokale Navigation-Personalisierung
**Datum:** 2026-09-09
**Status:** CODE-SEITIG ABGESCHLOSSEN / DEVICE-RETEST ERFORDERLICH

## Ergebnis

- P1 und P4 bleiben `LIVE BESTANDEN`; Homepage-, Auth-, Theme- und Warmstartverträge wurden erhalten.
- Appearance nutzt weiterhin den nativen Color Picker, zeigt aber je Farbe einen 38px großen runden, neutral gerahmten Swatch und den synchron aktualisierten normalisierten Hexwert.
- User UI Design ist progressiv in Base Colors, Actions & Buttons, Navigation, Forms sowie Geometry & Typography gegliedert. Advanced Custom CSS ist standardmäßig eingeklappt und als Expert-Funktion erklärt.
- Designschema V2 migriert V1 und ergänzt je Light/Dark getrennte Background/Text/Icon/Border-Werte für Primary, Secondary/Header, aktive/inaktive Navigation sowie Input Background/Text/Border/Focus.
- Dark-Defaults besitzen deutlich hellere Input-/Action-Borders und einen klaren, nicht übertriebenen Focus-Ring.
- Die isolierte Preview zeigt Header Action, Primary/Secondary, aktive/inaktive Navigation, Icon+Text, Card, Normal-/Focus-Input, Primary/Muted Text und Border mit demselben Mapper wie die User-App.
- User Settings bietet lokal/offline `Icon + Text` (Default), `Icons only` und `Text only` sowie reine Text-Label-Overrides bis 32 Zeichen für Home, Settings, Login und alle aktuellen/künftigen zentralen Modulnavigationen.
- Home, Settings, Login, GPS und generische Module verwenden lokale SVGs ohne Netzwerkabhängigkeit. Accessible Names und Tooltips bleiben in allen Darstellungsmodi erhalten.
- Einzelreset und `Reset all navigation labels` fallen auf den zur Renderzeit gelieferten offiziellen Text zurück. Technische Modul-IDs, Routen, Rechte und I18N-Schlüssel bleiben unverändert; I18N wurde nicht implementiert.

## Validierung und Migration

- V1-Designrecords werden als Eingabe akzeptiert, auf Schema V2 projiziert und um sichere V2-Defaults ergänzt.
- Unbekannte Tokens, ungültige Farben und inkompatible Cacheversionen bleiben fail-closed.
- Neue lokale Preferences werden synchron aus dem bestehenden versionierten User-Preferences-Record gelesen. Ungültige Modi fallen auf Icon+Text, ungültige Labels auf offizielle Texte zurück.
- Custom CSS behält Größen-/Securityvertrag, getrennten Clear und User-App-Isolation.

## Verifikation

- Fokussierte Appearance-/Design-/Navigation-/API-/PHP-/Auth-Suite: **107/107 bestanden**.
- Vollständige Suite: **442/442 bestanden**, 0 Fehler, 0 übersprungen.
- PHP-Lint: **37 Dateien bestanden**.
- JavaScript-Syntax, `git diff --check`, Secretprüfung bestanden.
- Produktionspaket: **108 Dateien**, Base Path `""`.
- Implementierungscommit `7ccae45` nach `main` übertragen.
- CodeQL Run `34300402856`: terminal `success`.
- FTPS Deploy Run `34300402921`: terminal `success`, inklusive Paket-/Upload-/Read-only-Smoke-Pfad.
- Kein Browser war in der Sandbox verfügbar; daher wurde kein Screenshot und keine erfundene visuelle Abnahme erstellt.

## Betreiber-Device-Retest

1. Appearance Light/Dark Farbswatches und Hexwerte prüfen.
2. Primary/Secondary/Nav/Input-Farben ändern; Preview und reale User-App prüfen.
3. Dark Input-Border und Focus prüfen.
4. Advanced CSS auf-/zuklappen, kleinen Override testen und clearen.
5. User Settings → Navigation: alle drei Display-Modi prüfen.
6. Home/Settings/Login/GPS lokal umbenennen und Reload prüfen.
7. einzelne Labels und alle Labels resetten.
8. Warmstart/Offline prüfen: keine Layoutsprünge, kein Loading/White-Flash.
9. Start Page, GPS, Login sowie User-/Admin-Theme regressiv prüfen.

Automatisierte Tests ersetzen diese reale visuelle iPad-Abnahme nicht.
