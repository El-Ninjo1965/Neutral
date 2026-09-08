# NEUTRAL – User-UI-Designvertrag

**Status:** VERBINDLICHES LANGFRISTIGES ZIELBILD

## Ziel

Die Gestaltung der User-App soll über `Admin → Appearance` zentral konfigurierbar sein, ohne dass Module jeweils eigene Produktdesigns implementieren müssen.

Die Admin-UI und die User-App bleiben dabei getrennte Oberflächen mit getrennten Zuständigkeiten.

## Trennung der Theme- und Designzustände

- **Admin-Theme:** steuert ausschließlich die Admin-Oberfläche und bleibt unabhängig vom User-App-Design.
- **User-Theme-Auswahl:** der Endnutzer wählt in der User-App lokal zwischen Light und Dark. Diese Auswahl bleibt offlinefähig und persistent.
- **User-UI-Designkonfiguration:** Administrator/Developer definiert über `Admin → Appearance`, **wie** Light und Dark sowie die zentralen UI-Komponenten der Produkt-App aussehen.
- Die Admin-Konfiguration darf keinen zweiten konkurrierenden User-Theme-State einführen und die persönliche Light/Dark-Auswahl nicht ersetzen.

## Primärer Konfigurationsweg: strukturierte Design-Tokens

Der normale Designweg ist ein strukturierter, zentraler Designvertrag auf Basis von CSS Custom Properties/Design-Tokens oder einer technisch äquivalenten zentralen Abstraktion.

Mindestens vorgesehen sind:

### Farben

- App-Hintergrund
- Surface/Karten
- Primary/Secondary
- Text
- gedämpfter Text
- Rahmen
- Erfolgs-/Warn-/Fehler-/Statusfarben

### Typografie

- zentrale Schriftfamilie
- Basisschriftgröße
- zentrale Größen-/Gewichtsskala

### Buttons

- Höhe/Touchfläche
- Radius
- Rahmen
- Padding
- Primary
- Secondary
- Navigation
- Icon-Buttons
- aktive/inaktive/fokussierte Zustände

### Layout

- zentrale Abstände
- Inhaltsbreite
- Flächen-/Kartenradien
- responsive Parameter, soweit sinnvoll konfigurierbar

### Navigation

- Maße und Abstände
- aktiver/inaktiver Zustand
- visuelle Hierarchie
- zentrale Vererbung an Module

### Karten und Formulare

- Surface
- Rahmen
- Radius
- Schatten
- Eingabeflächen
- Fokuszustände

### Light und Dark

Der Administrator/Developer kann die Design-Tokens für Light und Dark definieren bzw. aus gemeinsamen Basiswerten ableiten. Der Endnutzer entscheidet weiterhin selbst, welcher Modus aktiv ist.

## Modulvertrag

Module liefern Fachfunktion und verwenden die veröffentlichten zentralen UI-/Designverträge des Frameworks.

Eine Änderung des User-UI-Designs in `Admin → Appearance` soll deshalb Framework-Komponenten und kompatible Module automatisch erreichen. Module sollen für allgemeine Farben, Buttons, Karten, Formulare oder Navigation keine eigenen konkurrierenden Produktdesigns definieren.

Fachlich notwendiges modulspezifisches CSS bleibt erlaubt, muss den zentralen Designvertrag ergänzen statt ihn unnötig zu ersetzen.

## Admin → Appearance

Langfristige Zielstruktur:

- **Global Start Page**
- **User UI Design**
- optional **Advanced Custom CSS**

Controls, die nur Werte speichern, aber keine reale produktive Wirkung besitzen, gelten nicht als fertige Funktionen und sollen nicht als scheinbar funktionierende Einstellungen angeboten werden.

Die aktuell vorhandenen historischen `settings.theme`-/`settings.layout`-Controls sind deshalb vor einer weiteren Verwendung gegen reale Consumer zu prüfen. Funktionslose Alt-Controls sollen entfernt oder durch den neuen Designvertrag ersetzt werden.

## Vorschau und Reset

Für User-UI-Designänderungen ist eine Live-Vorschau im Adminbereich vorgesehen, sofern sie ohne unnötige Architekturkopplung umgesetzt werden kann.

Zusätzlich soll ein kontrollierter Reset auf definierte Framework-/Produktdefaults möglich sein.

## Advanced Custom CSS

Freies Custom CSS ist eine optionale Expertenfunktion und **nicht** der primäre Designweg.

Anforderungen:

- ausdrücklich als Advanced/Developer-Funktion kennzeichnen;
- strukturierte Design-Tokens bleiben der normale Weg;
- Override muss kontrolliert gespeichert und versioniert werden;
- Reset auf sichere Defaults muss möglich sein;
- keine Sicherheitsgrenzen oder Sandbox-Verträge aufweichen;
- fehlerhaftes Custom CSS darf nicht die Wiederherstellbarkeit der Admin-/Produktkonfiguration verhindern.

## Qualitätsvertrag

Admin-konfiguriertes User-UI-Design muss mindestens folgende bestehende Verträge respektieren:

- Accessibility und ausreichende Kontraste;
- sichtbare Fokuszustände;
- touchgerechte Bedienflächen;
- Light-/Dark-Konsistenz;
- Offline-/Warmstartfähigkeit;
- keine zusätzliche Netzwerkabhängigkeit für den ersten Paint;
- zentrale Designvererbung an Module;
- Store-/PWA-Portabilität;
- keine Vermischung von Admin-Theme und User-App-Theme.

## Grundsatz

`Admin → Appearance` definiert die **Gestaltung der Produkt-/User-App**. Die Admin-Oberfläche besitzt ihren eigenen unabhängigen Darstellungsvertrag. Der Benutzer wählt seinen aktiven Light-/Dark-Modus; der Administrator definiert die visuelle Designsprache, die beide Modi verwenden.