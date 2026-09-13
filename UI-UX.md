# NEUTRAL – UI/UX-Zielbild

**Status:** VERBINDLICHER ZIELVERTRAG  
**Geprüft:** 2026-09-13

Aktueller Implementierungs- und Live-Stand steht ausschließlich in `STATUS.md` und `CHATGPT.md`. Diese Datei enthält keine historische Fehlerchronik.

## Grundprinzipien

NEUTRAL ermöglicht Produkt-Apps, die schnell, klar, konsistent und touchfreundlich funktionieren. Module liefern Fachfunktion und verwenden die zentrale Designsprache. UI-Zustände müssen Navigation, Route und sichtbaren Content konsistent halten.

## Produktdesign und Branding

Das Framework stellt zentrale Verträge für Farben, Typografie, Abstände, Radien, Rahmen, Buttons, Formulare, Karten und Zustände bereit. Light und Dark dürfen getrennte Paletten besitzen; Admin-Theme und persönliche User-Theme-Auswahl bleiben unabhängig. Application Name, Logo/Icon und Appearance-Werte sind produktbezogen austauschbar. Neutral-Branding ist nur Default.

`Admin → Appearance` definiert die Gestaltung der Produkt-/User-App, nicht das Admin-Theme und nicht den persönlichen Light-/Dark-State des Users. Strukturierte Design-Tokens sind der normale Weg; kompatible Module erben diese Werte.

Mindestens zentral steuerbar bzw. versionierbar sind Hintergrund/Surface, Primary/Secondary, Text/Muted/Border, relevante Statusfarben, Control-/Surface-Radien, Basisabstände, Content-Breite, Basistypografie sowie aktive/inaktive/fokussierte Navigations-, Button- und Formularzustände.

Custom CSS ist ausschließlich eine optionale Advanced-/Developer-Funktion. Es darf zentrale Sicherheitsgrenzen nicht aufweichen, muss kontrolliert versionier-/zurücksetzbar sein und darf die Wiederherstellbarkeit der Produktkonfiguration nicht verhindern. Remote-Fonts oder andere zusätzliche Netzwerkabhängigkeiten sind keine Voraussetzung für den ersten Paint.

Eine Appearance-Einstellung gilt nur dann als echte Funktion, wenn sie einen realen Consumer besitzt und in der User-App sichtbar wirkt. Funktionslose Alt-Controls sollen nicht als scheinbar aktive Konfiguration bestehen bleiben.

## User-App

Technische Framework-, Manifest-, Runtime-, Discovery- und Entwicklungsinformationen gehören nicht in die normale User-App, sofern sie keinen unmittelbaren Nutzwert besitzen. Die App zeigt die konfigurierte Startseite, Produktfunktion oder einen neutralen Produktzustand.

## Offline-First und Startperformance

`UI zuerst → notwendiger minimaler Core → Hintergrundinitialisierung` bleibt verbindlich. Netzwerk, Session-Refresh, Synchronisation und Discovery blockieren lokal sicher darstellbare Inhalte nicht unnötig.

Ein aktives `publicOffline`-Modul kann aus der versionierten, sanitisierten lokalen Aktivierungsprojektion bereits im ersten stabilen Navigationsrender erscheinen. Catalog-Synchronisierung erfolgt danach im Hintergrund und darf Welcome/Homepage nicht unnötig vollständig neu rendern. Authentifizierte permission-sensitive Module bleiben getrennt.

Bekannte gültige lokale Homepage-/Shell-Zustände werden bei Warmstart/Reload sofort dargestellt, soweit keine aktuelle Sicherheitsentscheidung erforderlich ist.

## Navigation

- Navigation ist vorhersehbar, flach und touchgerecht.
- Active-State, Route und sichtbarer Content müssen übereinstimmen.
- `Start` rendert bei Auswahl tatsächlich den konfigurierten Home-/Start-Content.
- Back wird kontextbezogen gelöst, nicht durch einen generischen Framework-Link auf jeder Seite.
- Module integrieren sich in die zentrale Navigation.
- Aktive Systemmodule dürfen absichtlich ohne User-Navigation existieren.

## Startseite und Appearance

Appearance-Einstellungen müssen nach Save tatsächlich in der User-App wirken. Ein zulässiges aktives Modul kann Startziel sein; konfigurierter Text/HTML wird als Startinhalt dargestellt. Ungültige oder unzugängliche Konfiguration fällt kontrolliert zurück. Reload/Warmstart respektiert den Persistenzvertrag.

Eine Admin-Live-Preview darf denselben Token-Vertrag verwenden, darf aber den echten Userzustand nicht still verändern. Reset stellt definierte Produkt-/Frameworkdefaults wieder her und verändert nicht unbeabsichtigt Startseite oder persönliche Theme-Auswahl.

## User Settings

Anonymous Settings enthält nur ohne Authentifizierung zulässige Bereiche, insbesondere Apps und Navigation. Profile/Privacy erscheinen nur bei passender authentifizierter Capability.

Settings-Änderungen werden ohne Umleitung auf Start gespeichert und unmittelbar übernommen. Erfolgreiche Saves verwenden den gemeinsamen Frameworkdialog `Successfully saved.` mit `OK`; er bleibt bis zur Benutzeraktion sichtbar.

Lokale Navigation darf Icon+Text, nur Icons oder nur Text sowie begrenzte sichtbare Label-Overrides unterstützen. Accessible Names, technische IDs, Routen und I18N-Defaults bleiben davon getrennt.

## Passwortfelder

Passwortfelder sind standardmäßig verborgen. User Login verwendet genau ein autofillfähiges `type="password"` und genau ein statisches Eye im selben Control. Ein einzelner normaler Klick/Tap toggelt denselben Wert `password ↔ text`; kein Doppelklick, kein Hold, kein Observer und keine gerätespezifische Sonderlösung.

Touchziel mindestens 44×44 px. Accessible Name und `aria-pressed` folgen dem Zustand. Die Darstellung ändert niemals Serverauthentifizierung, Hashing, HTTPS oder Autocomplete-Vertrag.

## Feedback und Dialoge

Erfolgreiche Save/Create/Update-Aktionen verwenden den gemeinsamen Frameworkdialog. Destruktive Aktionen verwenden kontrollierte Framework-Bestätigungen; native Browserdialoge sind nicht der gewünschte Standardpfad. Lade-, Offline-, Sync-, Fehler-, Berechtigungs- und Empty-Zustände müssen verständlich sein.

## Responsive und Accessibility

Telefon priorisiert klare Hauptinhalte und große Touchziele; Tablet nutzt zusätzlichen Platz; Desktop darf höhere Informationsdichte bieten. Keine gerätemodellspezifischen Pixel-Sonderfälle. Zentrale responsive Grid-/Layoutverträge werden gegenüber Modulinseln bevorzugt.

Erforderlich sind sichtbare Fokuszustände, semantische Struktur, Accessible Names, Screenreader-Beschriftungen, ausreichender Kontrast, skalierbare Schrift, stabile Layouts und sinnvolle Ladeindikatoren. Farbe allein trägt keine Bedeutung.

## Karten und GPS

OpenStreetMap bleibt die eingebettete interaktive Karte; externe Navigation/Öffnen und Teilen sind getrennte Aktionen. Ohne Reverse-Geocoding-Provider werden präzise kompakte Koordinaten angezeigt. Vorhandene lokale Position erscheint sofort. Eine automatische neue Positionsabfrage ist zulässig, wenn Browserberechtigung bereits erteilt ist; ein erstmaliger Permission-Dialog benötigt Benutzeraktion.

## Profile

Profile ist optional. Wenn aktiv und für den authentifizierten User zulässig, öffnet dessen Navigation den Profile-Workflow. Username bleibt technische Identität/read-only. Optionale persönliche Felder und Organization-Sharing folgen dem Privacy-Vertrag. Geburtstag wird als Tag/Monat/Jahr erfasst und kanonisch als ISO-Datum gespeichert.

## Admin UX

- App Modules und System Modules sind getrennte Admin-Ziele derselben Registry/Lifecycle-Architektur.
- Modulübersicht und Detailansicht sind getrennte States.
- User-, Package-, License/Organization- und Role-Listen sind von Create/Edit als exklusive States getrennt.
- Save/Cancel/Back führt kontrolliert zur Liste zurück.
- Dashboard ist kompakte Summary und dupliziert keine Verwaltungsseiten.
- Sessions zeigt standardmäßig nur verlässliche Angaben; unsichere Device-/OS-/Browser-Ableitungen gehören nicht in die normale Tabelle.
- Diagnostics unterscheidet gemessene von nicht verfügbaren Werten.
- Audit-Filter, Retention und destruktive Aktionen sind getrennt.

Permissions und Visibility/Navigation sind getrennt. Visibility steuert Präsentation, nicht Autorisierung.

## Store-Portabilität und Final Freeze

Web ist aktuelle Basis; spätere Store-Apps bleiben Langfristziel. Browser-/Plattformdetails werden möglichst hinter Core-Facaden, Capabilities, Services oder Adaptern gekapselt. Vor Final Freeze werden mindestens Startperformance, Navigation, Branding, Appearance-Wirkung, Designvererbung, Responsive, Accessibility, Offline/Sync, Empty States, Fehlertoleranz, wichtige Nutzerflüsse und Store-Portabilität geprüft.

Ziel ist kein maximaler Funktionsumfang, sondern ein Framework, aus dem unterschiedliche Apps entstehen können, die schnell, ruhig, konsistent und verständlich wirken.