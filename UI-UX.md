# NEUTRAL – UI/UX-Zielbild

**Status:** VERBINDLICHES LANGFRISTIGES DESIGN- UND UX-ZIELBILD  
**Einordnung:** Ergänzt `VISION.md`, `Architecture.md` und `ModuleCreation.md`. Umsetzung erfolgt ausschließlich über gesonderte freigegebene Aufgaben.

## 1. Qualitätsziel

NEUTRAL soll nicht nur technisch robust, modular und portabel sein, sondern als Grundlage für unterschiedliche Produkt-Apps eine außergewöhnlich hochwertige User Experience ermöglichen. Angestrebtes Qualitätsniveau ist 9,5/10 oder höher; die Zahl ist kein formales Releasekriterium, sondern beschreibt den Anspruch an Konsistenz, Geschwindigkeit, Verständlichkeit, Fehlertoleranz und visuelle Qualität.

Technische Möglichkeiten allein rechtfertigen keine zusätzliche Komplexität. Eine Verbesserung muss einen nachvollziehbaren Nutzen für Bedienbarkeit, Wartbarkeit, Sicherheit, Geschwindigkeit oder Wiederverwendbarkeit besitzen.

## 2. UI und UX

- **UI (User Interface):** sichtbare Gestaltung – Farben, Typografie, Buttons, Karten, Formulare, Abstände, Icons, Layout und visuelle Zustände.
- **UX (User Experience):** gesamte Nutzungserfahrung – Verständlichkeit, Orientierung, Geschwindigkeit, Rückmeldung, Fehlertoleranz, Erreichbarkeit wichtiger Aktionen und subjektive Reaktionsfähigkeit.

Beide werden getrennt bewertet, müssen aber als ein konsistentes Produkterlebnis zusammenwirken.

## 3. Produktdesign wird beim Setup festgelegt

NEUTRAL ist ein Framework für viele unterschiedliche Apps. Deshalb muss das Framework visuell flexibel sein, während eine konkrete Produkt-App nach ihrer Einrichtung grundsätzlich ein stabiles und konsistentes Erscheinungsbild besitzt.

- Grunddesign wird typischerweise beim Setup bzw. bei der Einrichtung einer Produkt-App festgelegt.
- Unterschiedliche Produkt-Apps dürfen unterschiedliche Farben, Typografie, Buttonformen, Radien, Abstände, Layouts und andere visuelle Eigenschaften besitzen.
- Nach dem Setup wird das Design im Normalbetrieb nicht laufend verändert.
- Admin/Developer dürfen Appearance später korrigieren oder gezielt anpassen, insbesondere bei Designproblemen, Konflikten oder einer bewussten Produktüberarbeitung.
- Designkonfiguration ist eine Betreiber-/Produktentscheidung, keine beliebige Endnutzer-Spielerei.
- Persönliche User-Präferenzen wie Light/Dark können davon getrennt existieren, sofern der jeweilige Produktvertrag sie zulässt.

## 4. Zentrales Designsystem

Das Framework stellt die gemeinsame Designsprache bereit. Ziel ist ein zentraler, versionierbarer Designvertrag statt unabhängiger Gestaltung jedes Moduls.

Langfristig sollen zentrale Design-Tokens bzw. äquivalente Variablen mindestens abbilden können:

- Farben und semantische Farbrollen
- Hintergründe und Oberflächen
- Typografie und Schriftfamilien
- Schriftgrößen und Hierarchie
- Abstände
- Radien
- Rahmen
- Schatten
- Buttons und Aktionszustände
- Formulare und Eingabefelder
- Karten/Container
- Fokus-, Hover-, Active-, Disabled- und Fehlerzustände
- responsive Layoutparameter

Die konkrete technische Implementierung wird separat entworfen. Dieses Dokument schreibt das Ziel fest, nicht eine bestimmte CSS-Technik.

## 5. Module übernehmen das Framework-Design

Verbindliches Zielprinzip:

**Module liefern ihre Fachfunktion, nicht ihr eigenes unabhängiges Produktdesign.**

- Module verwenden die zentralen UI-Komponenten, Design-Tokens, CSS-Variablen oder sonstigen veröffentlichten Designverträge des Frameworks.
- Module definieren keine eigenen Produktfarben, Standardschriftarten, allgemeinen Buttonstile oder globalen Abstände, wenn dafür ein Frameworkvertrag existiert.
- Änderungen am zentralen Produktdesign sollen sich automatisch konsistent auf Module auswirken.
- Modulspezifisches CSS ist erlaubt, wenn eine fachlich spezielle Darstellung erforderlich ist, die das Framework nicht sinnvoll allgemein bereitstellen kann.
- Modulspezifisches CSS ergänzt das Framework und überschreibt nicht unnötig dessen globale Designsprache.
- Ein Modul darf keine fremden Module oder private Framework-CSS-Interna manipulieren.

Dieses Prinzip soll später als verbindlicher UI-Vertrag auch in `ModuleCreation.md` konkretisiert werden.

## 6. Erweiterte Appearance-Konfiguration

Langfristiges Ziel für Admin/Developer:

- zentrale Appearance-Konfiguration für die wesentlichen Designparameter;
- Produktdesign beim Setup komfortabel festlegen;
- spätere kontrollierte Korrekturen ermöglichen;
- optional ein fortgeschrittener Custom-CSS-Bereich für Developer/Administrator.

Custom CSS ist eine Expertenfunktion. Es darf nicht die primäre Methode für normale Designkonfiguration sein. Der bevorzugte Weg sind zentrale strukturierte Designparameter, damit Konsistenz und Updatefähigkeit erhalten bleiben.

## 7. Geschwindigkeit und wahrgenommene Performance

Der bestehende Vision-Vertrag `UI zuerst → notwendiger minimaler Core → Hintergrundinitialisierung` bleibt verbindlich.

UX-Ziel:

- App-Shell und lokal verfügbare Oberfläche erscheinen möglichst sofort.
- Netzwerk, Serverauthentifizierung, Synchronisation, Datenbankinitialisierung und Modul-Discovery blockieren den ersten sichtbaren Zustand nicht unnötig.
- Wiederkehrende Nutzer sollen nicht unnötig erneut anmelden müssen, solange eine gültige sichere Sessionstrategie dies erlaubt.
- Passwörter werden nicht dauerhaft im Client gespeichert.
- Langsame Hintergrundarbeit besitzt verständliche Zustände und blockiert nicht unnötig die Bedienung.
- Performance wird auf realistischen Mobilgeräten gemessen und nicht nur subjektiv beurteilt.

## 8. Visuelle Hierarchie und Konsistenz

Jede Produkt-App soll auf den ersten Blick verständlich wirken.

- Hauptaktionen sind visuell eindeutig wichtiger als Nebenaktionen.
- Titel, Inhalt, Status und Aktionen besitzen konsistente Hierarchien.
- Gleiche Funktionen sehen und verhalten sich überall gleich.
- Abstände, Komponenten, Dialoge, Formulare und Navigationsmuster werden nicht pro Modul neu erfunden.
- Informationsdichte passt sich sinnvoll an Telefon, Tablet und Desktop an.
- Die Oberfläche soll ruhig und verständlich bleiben, auch wenn der Funktionsumfang wächst.

## 9. Navigation

- Navigation bleibt vorhersehbar und möglichst flach.
- Der Nutzer muss jederzeit erkennen können, wo er sich befindet und wie er zurückkommt.
- Häufig benötigte Funktionen sollen mit möglichst wenigen Interaktionen erreichbar sein.
- Module integrieren sich in die zentrale Navigationslogik statt eigene konkurrierende Hauptnavigationen einzuführen.
- Sichtbarkeit und Navigation respektieren weiterhin die serverseitigen Modul-/Rechteverträge.

## 10. Progressive Disclosure

Komplexität wird nur dann gezeigt, wenn sie benötigt wird.

- Standardansichten zeigen die für den aktuellen Zweck wichtigsten Informationen und Aktionen.
- Erweiterte Optionen, seltene Einstellungen und technische Details werden nachgelagert angeboten.
- Eine Funktion soll nicht deshalb kompliziert wirken, weil intern viele Möglichkeiten existieren.
- Expertenfunktionen dürfen leistungsfähig sein, ohne die normale Bedienung zu überladen.

## 11. Kontextbezogene Aktionen

Aktionen sollen möglichst dort angeboten werden, wo ihr Kontext verständlich ist.

- Bearbeiten, Löschen, Teilen, Speichern oder ähnliche Aktionen erscheinen beim betreffenden Objekt oder in einem klar zugeordneten Aktionsbereich.
- Unnötige globale Menüs und lange Wege werden vermieden.
- Gefährliche/destruktive Aktionen benötigen angemessene Schutzmechanismen.

## 12. Feedback- und Systemzustände

Der Nutzer soll jederzeit verstehen können, was die App gerade tut.

Mindestens relevante Zustände:

- Laden
- gespeichert
- noch nicht gespeichert
- offline
- synchronisiert
- Synchronisation ausstehend
- Konflikt
- Fehler
- keine Berechtigung
- leerer Datenbestand
- Hintergrundarbeit

Statusmeldungen sollen informativ sein, ohne die Oberfläche unnötig zu dominieren.

## 13. Empty States

Leere Ansichten sind ein definierter UX-Zustand und kein unbehandelter Sonderfall.

Statt leerer Flächen oder bedeutungsloser Tabellen soll eine leere Ansicht – soweit sinnvoll – erklären:

- warum noch keine Daten vorhanden sind;
- was der Nutzer als Nächstes tun kann;
- welche Hauptaktion den Zustand beendet.

## 14. Fehlertoleranz und Recovery

- Benutzeraktionen dürfen bei Netzabbrüchen oder temporären Fehlern nicht unnötig verloren gehen.
- Wo fachlich sinnvoll: Entwürfe, Wiederaufnahme, Retry oder Undo vorsehen.
- Destruktive Aktionen werden angemessen bestätigt oder rückgängig machbar gestaltet.
- Fehlertexte erklären die Auswirkung und möglichst den nächsten sinnvollen Schritt.
- Technische Rohfehler werden normalen Nutzern nicht als primäre UX präsentiert.

## 15. Micro-UX

Kleine Interaktionen tragen wesentlich zur wahrgenommenen Qualität bei.

Zu berücksichtigen sind insbesondere:

- unmittelbare Reaktion auf Touch/Klick;
- sinnvolle Ladeindikatoren statt eingefrorener Oberfläche;
- stabile Layouts ohne unnötige Sprünge;
- Fokusführung;
- Tastaturverhalten;
- ausreichend große Touch-Ziele;
- sinnvolle Übergänge/Animationen, aber keine Animation um ihrer selbst willen;
- Vermeidung unnötiger Warte- und Bestätigungsdialoge.

## 16. Accessibility

Accessibility wird als Qualitätsmerkmal behandelt, nicht als nachträglicher Zusatz.

Zielpunkte:

- ausreichender Kontrast;
- skalierbare und lesbare Schrift;
- ausreichende Touch-/Klickflächen;
- sichtbare Fokuszustände;
- semantische Struktur;
- Tastaturbedienbarkeit, soweit für die Weboberfläche relevant;
- Screenreader-kompatible Beschriftungen bei interaktiven Elementen;
- Information nicht ausschließlich über Farbe vermitteln.

Ein konkreter WCAG-Zielstandard und eine Prüfmatrix werden vor der finalen Qualitäts-/Hardening-Phase festgelegt.

## 17. Responsive Informationsdichte

Mobile-first bedeutet nicht, Tablet/Desktop künstlich wie ein Telefon zu behandeln.

- Telefon: klare Priorisierung, große Touchziele, reduzierte Informationsdichte.
- Tablet: zusätzlichen Platz für Kontext und effizientere Bedienung nutzen.
- Desktop: höhere Informationsdichte zulassen, ohne mobile Verträge zu brechen.
- Responsive Verhalten wird zentral und komponentenbezogen definiert, nicht unabhängig pro Modul improvisiert.

## 18. Onboarding

Onboarding ist optional und soll nur eingesetzt werden, wenn es echten Nutzen bringt.

- keine dauernden Tutorials;
- kurze kontextbezogene Hinweise bei erstmaliger Nutzung komplexer Funktionen;
- neue Module können einen einmaligen Einstieg anbieten;
- erfahrene Nutzer dürfen nicht durch wiederholte Hilfen ausgebremst werden.

## 19. Favoriten, Quick Actions und Suche

Diese Punkte sind mögliche spätere UX-Erweiterungen und noch keine Pflicht für Core 1.0:

- Favoriten für häufig verwendete Module/Funktionen;
- konfigurierbare Quick Actions;
- zentrale Suche über Module/Funktionen/Inhalte;
- optional eine Command-Palette für Power User.

Sie werden nur umgesetzt, wenn der reale Funktionsumfang ihren Nutzen rechtfertigt.

## 20. Qualitäts-/Hardening-Phase vor Final Freeze

Vor einem endgültigen Final Freeze soll eine gesonderte UI-/UX-/Qualitätsprüfung stattfinden.

Für jeden relevanten Bereich wird gefragt:

1. Was verhindert aktuell ein Qualitätsniveau von 9,5/10?
2. Ist das Problem technisch, visuell oder UX-bezogen?
3. Ist die Verbesserung universell für Neutral oder produktspezifisch?
4. Verbessert sie die reale Nutzung ausreichend, um zusätzliche Komplexität zu rechtfertigen?
5. Ist sie auf realistischen Mobilgeräten überprüft?

Dabei werden mindestens geprüft:

- Startperformance
- Navigation
- visuelle Konsistenz
- Designvererbung an Module
- responsive Darstellung
- Accessibility
- Offline-/Sync-Zustände
- Empty States
- Fehlertoleranz
- wichtige Nutzerflüsse
- subjektive und gemessene Reaktionsgeschwindigkeit

## 21. Grundsatz

Das Ziel ist nicht, möglichst viele UI-Funktionen einzubauen. Das Ziel ist ein Framework, aus dem unterschiedliche Apps entstehen können, die trotz großer funktionaler Möglichkeiten **schnell, ruhig, konsistent, verständlich und hochwertig** wirken.

Neue Produktmodule sollen dieses Qualitätsniveau automatisch erben können, statt es jeweils neu entwickeln zu müssen.
