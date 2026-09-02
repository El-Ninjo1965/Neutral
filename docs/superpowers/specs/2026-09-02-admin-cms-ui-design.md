# Neutral Admin/CMS UI – Design

**Datum:** 2026-09-02  
**Status:** zur Umsetzung freigegeben  
**Gewählte Richtung:** Variante A – Klassisches CMS

## Ziel

Die technische, einspaltige Admin-Oberfläche wird durch ein modernes, responsives CMS-Layout ersetzt. Die Oberfläche soll alle bereits vorhandenen Verwaltungsfunktionen auffindbar und bedienbar machen, ohne neue Produktionsanforderungen jenseits von PHP, MySQL, JavaScript und den vorhandenen Apache-Rewrite-Regeln einzuführen.

„Alles verwalten“ bedeutet in dieser Ausbaustufe: Jede vom produktiven PHP-Router bereits unterstützte Verwaltungsfunktion erhält einen eindeutigen Platz im Admin-UI. Eine nicht implementierte Serverfähigkeit wird nicht simuliert; sie wird als nicht verfügbar gekennzeichnet oder bleibt bis zur API-Implementierung ohne schreibende Aktion.

## Informationsarchitektur

Die linke Seitenleiste enthält genau eine Navigationsebene mit gruppierten Zielen:

1. **Übersicht**
   - Dashboard
2. **Plattform**
   - Apps und Module
   - Einstellungen
   - Darstellung
3. **Zugriff**
   - Benutzer
   - Rollen und Rechte
   - Sitzungen
4. **Infrastruktur**
   - Verbindungen und Provider
   - Server
   - Datenbank
   - Backups und Wiederherstellung
   - Wartung und Updates
5. **Überwachung**
   - Diagnose
   - Audit-Protokoll

Die Gruppierung ist rein darstellend. Autorisierung bleibt serverseitig; nicht erlaubte Bereiche werden nicht allein durch das Ausblenden von Navigation geschützt.

## Desktop-Aufbau

- Eine feste linke Seitenleiste zeigt Marke, Gruppen und Navigationsziele.
- Eine kompakte Kopfzeile zeigt Seitentitel, Breadcrumb, aktuellen Benutzer, Theme-Umschaltung und Abmeldung.
- Der Inhaltsbereich verwendet vorhandene Views, Tabellen, Formulare, Statuskarten und Dialoge.
- Die aktive Seite ist in der Seitenleiste eindeutig markiert.
- Die Seitenleiste kann auf schmaleren Desktopbreiten eingeklappt werden, ohne den aktuellen Bereich zu verlieren.

## iPad und kleine Bildschirme

- Unterhalb der Desktopbreite wird die Seitenleiste zu einem ausblendbaren Drawer.
- Ein klar beschrifteter Menüschalter öffnet und schließt den Drawer.
- Auswahl eines Navigationsziels schließt den Drawer und setzt den Fokus auf den neuen Seitentitel.
- Tabellen bleiben semantische Tabellen und erhalten bei Bedarf einen begrenzten horizontalen Scrollbereich.
- Formulare werden einspaltig; primäre Aktionen bleiben mindestens fingerfreundlich groß.
- Es gibt keine Funktion, die ausschließlich über Hover erreichbar ist.

## Dashboard

Das Dashboard zeigt nur echte, bereits abrufbare Daten:

- Server- und Datenbankstatus,
- Anzahl beziehungsweise Zustand von Benutzern, Sitzungen und Modulen,
- Backup- und Updatezustand,
- letzte relevante Audit-Ereignisse,
- direkte Sprungaktionen zu den zugehörigen Verwaltungsseiten.

Fehler einzelner Dashboard-Abfragen blockieren nicht die gesamte Oberfläche. Der betroffene Bereich zeigt eine verständliche Fehlermeldung und eine erneute Ladeaktion.

## Verwaltungsseiten

Bestehende CRUD-Views für Benutzer, Rollen, Einstellungen und Module werden in den neuen Rahmen übernommen. Die übrigen vorhandenen Routerfunktionen werden in klar abgegrenzten Views zusammengeführt:

- Rechtekatalog und Rollenzuordnung,
- Sitzungsübersicht und zulässige Sitzungsaktionen,
- Provider- und Verbindungsstatus,
- Server-, Datenbank- und Diagnosestatus,
- verschlüsselte Backups, Upload, Download und Wiederherstellung,
- Wartungsmodus und Updatezustand,
- filterbares Audit-Protokoll.

Destruktive oder schwer reversible Aktionen verlangen eine ausdrückliche Bestätigung und zeigen Ziel sowie Auswirkung. Geheimnisse werden nie in Listen, Antworten, Fehlermeldungen oder Formular-Rückwerten angezeigt.

## Datenfluss und Zustand

- `Server/public/admin.php` bleibt der serverseitig geschützte Einstiegspunkt.
- `Server/php/views/admin-ui.php` liefert den semantischen Shell-Rahmen.
- `Web-App/public/admin/index.js` steuert Navigation und Viewwechsel.
- Die vorhandenen View-Dateien bleiben fachlich getrennt und verwenden `ApiClient` mit `/api/v1`.
- Aktive Ansicht und Drawerzustand sind UI-Zustand; Rollen, Rechte und Sitzung kommen ausschließlich aus dem Serverkontext.
- Nach Logout werden Session- und CSRF-Kontext serverseitig invalidiert und die Oberfläche kehrt zum Login zurück.

## Fehler- und Ladeverhalten

- Jede View besitzt einen sichtbaren Lade-, Leer-, Fehler- und Erfolgszustand.
- API-Fehler werden nach Status unterschieden: 401 führt zum Login, 403 erklärt fehlende Berechtigung, 404 kennzeichnet nicht verfügbare Fähigkeiten, 5xx bietet erneutes Laden.
- Navigation bleibt bedienbar, wenn nur eine View fehlschlägt.
- Schreibaktionen verhindern Doppelklicks während der Anfrage und zeigen danach ein eindeutiges Resultat.

## Barrierefreiheit

- Navigation verwendet semantische `nav`-, Listen- und Button-Elemente.
- Drawer, Dialoge und aktive Navigation erhalten korrekte ARIA-Zustände.
- Fokusführung funktioniert per Tastatur und Touch.
- Status- und Fehlermeldungen werden über passende Live-Regionen angekündigt.
- Hell- und Dunkelmodus behalten ausreichenden Kontrast.

## Sicherheitsgrenzen

- Das UI erteilt keine Rechte und sendet keine Rollen- oder Admin-Header als Autoritätsersatz.
- Alle schreibenden geschützten Requests verwenden den produktiven Session- und CSRF-Kontext.
- Setup- und Recoveryfunktionen erscheinen im aktiven Betrieb nicht im normalen Admin-Menü.
- Zugangsdaten, Passwort-Hashes, CSRF-Secrets, Datenbankidentität und Serverpfade bleiben serverseitig.

## Umsetzung und Tests

Die Umsetzung erfolgt testgetrieben in drei Schichten:

1. Shell und responsive Navigation,
2. vollständige Zuordnung der vorhandenen Adminfunktionen zu Views,
3. produktive Browser- und Shared-Hosting-Abnahme.

Automatisierte Tests prüfen mindestens Navigationsstruktur, aktive Ansicht, Drawerzustand, Berechtigungsfehler, Logout mit CSRF, responsive Klassen sowie die Einbindung aller produktiven Assets. Danach folgen die vollständige Testsuite, CodeQL, FTPS-Deployment und eine Live-Prüfung auf Desktop- und iPad-Breite.

## Nicht Bestandteil

- Node.js oder dauerhafte Worker auf dem Produktionsserver,
- erfundene Kennzahlen oder nur optisch funktionierende Aktionen,
- eine zweite globale Iconleiste wie in Variante C,
- Änderungen an produktiven Zugangsdaten,
- neue fachliche Module außerhalb der vorhandenen Adminfähigkeiten.
