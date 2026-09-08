# NEUTRAL – UI/UX-Zielbild

**Status:** VERBINDLICHES LANGFRISTIGES DESIGN- UND UX-ZIELBILD

## Grundprinzipien

NEUTRAL soll als Grundlage unterschiedlicher Produkt-Apps eine außergewöhnlich hochwertige User Experience ermöglichen. Ziel ist keine Punktzahl, sondern eine App, die sich schnell, klar, vertrauenswürdig, individuell passend und ohne unnötige Bedienhürden anfühlt.

**UI** bezeichnet die sichtbare Gestaltung. **UX** bezeichnet die gesamte Nutzungserfahrung einschließlich Orientierung, Geschwindigkeit, Rückmeldung und Fehlertoleranz.

## Produktdesign und zentrales Designsystem

Das Grunddesign einer konkreten Produkt-App wird typischerweise beim Setup festgelegt und bleibt danach grundsätzlich stabil. Unterschiedliche Produkt-Apps dürfen unterschiedliche Farben, Typografie, Buttonformen, Radien, Abstände und Layouts besitzen. Admin/Developer dürfen Appearance später gezielt korrigieren oder überarbeiten.

Das Framework stellt die gemeinsame Designsprache bereit. Zentrale Design-Tokens bzw. äquivalente Variablen sollen Farben, Hintergründe, Typografie, Abstände, Radien, Rahmen, Schatten, Buttons, Formulare, Karten, Zustände und responsive Layoutparameter abbilden.

**Module liefern ihre Fachfunktion, nicht ihr eigenes unabhängiges Produktdesign.** Module verwenden veröffentlichte UI-Komponenten und Designverträge des Frameworks. Modulspezifisches CSS ist nur für fachlich spezielle Darstellung vorgesehen und ergänzt das Framework, statt dessen globale Designsprache unnötig zu überschreiben.

Custom CSS kann als Expertenfunktion für Administrator/Developer vorgesehen werden, ist aber nicht der primäre Weg der normalen Designkonfiguration.

## Geschwindigkeit

Der bestehende Vertrag `UI zuerst → notwendiger minimaler Core → Hintergrundinitialisierung` bleibt verbindlich.

- App-Shell und lokal verfügbare Oberfläche erscheinen möglichst sofort.
- Netzwerk, Serverauthentifizierung, Synchronisation, Datenbankinitialisierung und Modul-Discovery blockieren den ersten sichtbaren Zustand nicht unnötig.
- Passwörter werden nicht dauerhaft im Client gespeichert.
- Langsame Hintergrundarbeit blockiert die Bedienung nicht unnötig.
- Performance wird auf realistischen Mobilgeräten gemessen.

## Visuelle Kommunikation vor unnötigem Text

NEUTRAL verfolgt das UX-Prinzip: **so wenig Text wie sinnvoll, so viel Information wie nötig.**

- International verständliche Symbole und etablierte visuelle Muster werden bevorzugt, wenn ihre Bedeutung eindeutig ist.
- Wiederkehrende Zustände verwenden frameworkweit dieselbe Symbolsprache.
- Module erfinden für gleiche Systemzustände keine eigenen Symbole.
- Kurze Tooltips, Hilfen oder eine zentrale Legende erklären Symbole bei Bedarf, statt dauerhaft lange Erklärungstexte anzuzeigen.
- Text bleibt dort erhalten, wo ein Symbol mehrdeutig wäre, bei kritischen Entscheidungen oder wo Accessibility/Verständlichkeit ihn erfordert.
- Farbe unterstützt die Bedeutung, ist aber niemals der einzige Informationsträger.
- Symbole benötigen geeignete semantische/Screenreader-Beschriftungen.
- Übersetzbare Texte bleiben für alle tatsächlich sprachabhängigen Inhalte vorgesehen.

Der Hauptnutzen dieses Prinzips ist bessere UX, schnellere Erfassbarkeit und geringere Sprachbarrieren. Eine relevante Reduzierung von App-Größe oder Datenvolumen durch weniger UI-Text wird ausdrücklich nicht als technischer Hauptgrund angenommen.

## Einheitliche Sync-Statussprache

Synchronisierbare Objekte sollen ihren Zustand kompakt und ohne wiederholte Erklärungstexte zeigen. Der Core soll dafür langfristig eine gemeinsame Statuskomponente bereitstellen, die alle Module verwenden.

Zielzustände:

- **Synchronisiert:** eindeutiges positives Symbol, z. B. Haken/Marker; Farbe darf unterstützend grün sein.
- **Lokal gespeichert / Synchronisierung ausstehend:** eigenes eindeutiges Pending-Symbol bzw. bewusst definierter visueller Zustand.
- **Synchronisierung läuft:** einheitliches Aktivitäts-/Sync-Symbol.
- **Synchronisierung fehlgeschlagen / Aufmerksamkeit nötig:** eindeutiges Warnsymbol.
- **Nicht synchronisierbar bzw. Sync nicht relevant:** kein Sync-Statussymbol.

Die endgültigen Icons werden im Designsystem festgelegt. Bedeutung darf nicht ausschließlich durch grün/orange/rot vermittelt werden.

## Offline-First aus Nutzersicht

Ein Nutzer darf fachliche Arbeit grundsätzlich auch ohne aktuelle Internetverbindung durchführen, soweit die Funktion keinen zwingend aktuellen Serverzustand benötigt.

Beispielziel für Daten und Medien:

`Aktion/Fotografie → lokal sicher speichern → persistente Sync-Queue → bei geeigneter Verbindung übertragen → Serverbestätigung → lokalen Sync-Status aktualisieren`

- Offline erzeugte Daten und Medien bleiben lokal erhalten.
- Wenn die App geöffnet ist und die Verbindung zurückkehrt, kann die Queue automatisch abgearbeitet werden.
- Eine spätere Store-App soll Betriebssystem-Hintergrundmechanismen für opportunistische Synchronisierung verwenden können.
- Das Betriebssystem entscheidet bei geschlossener App über tatsächliche Hintergrundausführung; sofortige Ausführung wird nicht garantiert.
- Spätestens beim nächsten geeigneten App-Start wird ausstehende Synchronisation wieder aufgenommen.
- Für datenintensive Medien sollen Optionen wie `WLAN + Mobilfunk`, `nur WLAN` oder `manuell` möglich sein, wenn das Produkt dies benötigt.
- Module implementieren nicht jeweils eigene Sync-Engines; sie nutzen einen universellen Core-Sync-/Background-Vertrag.

## Navigation und App-Gefühl

Die User-App soll sich wie eine eigenständige App anfühlen und nicht wie eine Webseite in einer App-Hülle.

- Navigation ist vorhersehbar, app-typisch und möglichst flach.
- Ein generischer sichtbarer „Zurück“-Button auf jeder Seite ist kein gewünschtes Standardmuster.
- Zurücknavigation wird kontextbezogen, zentral und später soweit sinnvoll über Plattformnavigation gelöst.
- Module integrieren sich in die zentrale Navigation.
- Browsertypische Seitennavigation, technische URL-Sprünge und sichtbar webseitige Hilfskonstruktionen dominieren die UX nicht.

## Progressive Disclosure und kontextbezogene Aktionen

Standardansichten zeigen die wichtigsten Informationen und Aktionen. Erweiterte Optionen, seltene Einstellungen und technische Details werden erst bei Bedarf gezeigt. Expertenfunktionen dürfen leistungsfähig sein, ohne normale Nutzer zu überladen.

Aktionen erscheinen möglichst dort, wo ihr Kontext verständlich ist. Unnötige globale Menüs und lange Wege werden vermieden. Destruktive Aktionen erhalten angemessene Schutzmechanismen.

## Feedback, Empty States und Fehlertoleranz

Der Nutzer muss relevante Zustände verstehen können: Laden, gespeichert, offline, Sync ausstehend/laufend/erfolgreich/fehlgeschlagen, Konflikt, Fehler, fehlende Berechtigung, leerer Datenbestand und Hintergrundarbeit.

Leere Ansichten erklären – soweit nötig und möglichst knapp – warum keine Daten vorhanden sind und welche Hauptaktion sinnvoll ist.

Benutzeraktionen dürfen bei Netzabbrüchen oder temporären Fehlern nicht unnötig verloren gehen. Wo fachlich sinnvoll werden Entwürfe, Wiederaufnahme, Retry oder Undo vorgesehen. Technische Rohfehler werden normalen Nutzern nicht als primäre UX präsentiert.

## Micro-UX

- unmittelbare Reaktion auf Touch/Klick;
- sinnvolle Ladeindikatoren statt eingefrorener Oberfläche;
- stabile Layouts ohne unnötige Sprünge;
- sinnvolle Fokusführung und Tastaturbehandlung;
- ausreichend große Touch-Ziele;
- Übergänge/Animationen nur mit erkennbarem UX-Nutzen;
- unnötige Warte- und Bestätigungsdialoge vermeiden.

## Accessibility

Accessibility ist Qualitätsmerkmal und kein nachträglicher Zusatz.

- ausreichender Kontrast;
- skalierbare, lesbare Schrift;
- ausreichende Touch-/Klickflächen;
- sichtbare Fokuszustände;
- semantische Struktur;
- Tastaturbedienbarkeit, soweit relevant;
- Screenreader-kompatible Beschriftungen;
- Information niemals ausschließlich über Farbe.

Ein konkreter WCAG-Zielstandard und eine Prüfmatrix werden vor der finalen Qualitäts-/Hardening-Phase festgelegt.

## Responsive Informationsdichte

Mobile-first bedeutet nicht, Tablet/Desktop künstlich wie ein Telefon zu behandeln.

- Telefon: klare Priorisierung, große Touchziele, reduzierte Informationsdichte.
- Tablet: zusätzlichen Platz für Kontext und effizientere Bedienung nutzen.
- Desktop: höhere Informationsdichte zulassen, ohne mobile Verträge zu brechen.
- Responsive Verhalten wird zentral definiert und nicht pro Modul improvisiert.

## Onboarding, Favoriten und Suche

Onboarding wird nur eingesetzt, wenn es echten Nutzen bringt: kurze kontextbezogene Hinweise statt dauernder Tutorials.

Favoriten, Quick Actions, zentrale Suche und optional eine Command-Palette bleiben mögliche spätere UX-Erweiterungen. Sie werden nur umgesetzt, wenn der reale Funktionsumfang ihren Nutzen rechtfertigt.

## Store-App als verbindliches Langfristziel

Die heutige Web-App ist Entwicklungs- und Laufzeitbasis; das langfristige Produktziel umfasst ausdrücklich Store-Apps.

- Neue Architektur-, UI- und Modulentscheidungen werden auf spätere Store-Portabilität geprüft.
- Browser-/Plattformdetails werden möglichst hinter Core-Facaden, Capabilities, Services oder Adaptern gekapselt.
- Module nutzen veröffentlichte Framework-/Core-Verträge.
- Navigation, Lifecycle, Storage, Netzwerkstatus, Authentifizierung, Gerätefunktionen, Background Tasks und Notifications bleiben adapterfähig.
- Direkte Browser-API-Nutzung bleibt lokal begrenzt und ersetzbar, wenn noch kein Coreadapter existiert.
- Eine spätere Store-App soll keinen vollständigen Rewrite des fachlichen Cores oder der Produktmodule erfordern.
- Die konkrete Store-Technik wird erst bei ausreichenden realen Anforderungen entschieden.

## Qualitäts-/Hardening-Phase vor Final Freeze

Vor dem Final Freeze erfolgt eine gesonderte UI-/UX-/Qualitätsprüfung. Mindestens geprüft werden:

- Startperformance;
- Navigation und App-Gefühl;
- visuelle Konsistenz;
- Designvererbung an Module;
- visuelle Kommunikation und Symbolsprache;
- responsive Darstellung;
- Accessibility;
- Offline-/Sync-Zustände;
- Empty States;
- Fehlertoleranz;
- wichtige Nutzerflüsse;
- subjektive und gemessene Reaktionsgeschwindigkeit;
- Store-Portabilität.

Für jeden Bereich wird gefragt, welche reale Verbesserung noch fehlt, ob sie universell oder produktspezifisch ist und ob ihr Nutzen zusätzliche Komplexität rechtfertigt.

## Grundsatz

Das Ziel ist nicht, möglichst viele UI-Funktionen einzubauen. Das Ziel ist ein Framework, aus dem unterschiedliche Apps entstehen können, die trotz großer funktionaler Möglichkeiten **schnell, ruhig, konsistent, verständlich und hochwertig** wirken.

Neue Produktmodule sollen dieses Qualitätsniveau möglichst automatisch erben können, statt es jeweils neu entwickeln zu müssen.
