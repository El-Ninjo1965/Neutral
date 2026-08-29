# NEUTRAL – TODO

Stand: 2026-08-29. Diese Liste bildet die tatsächliche weitere Entwicklungsreihenfolge ab. Erledigt wird nur markiert, was durch aktuellen Code, Dokumentation oder Tests nachgewiesen ist.

## P1 – Dokumentation und Architektur

- [x] `VISION.md` als widerspruchsfreie langfristige Zielarchitektur für NEUTRAL neu aufbauen.
- [x] Ist- und Zielarchitektur in `Architecture.md` trennen und mit IST/GEPLANT/FEHLT kennzeichnen.
- [x] tatsächliche Core-Funktionen, APIs, Datenhaltung und Sicherheit dokumentieren.
- [x] getrennte Installationsanleitungen für Web-App und PHP-Server erstellen.
- [x] verbindlichen aktuellen Modulerstellungsvertrag dokumentieren.
- [x] Workflow auf Arbeitsregeln und vollständiges Arbeitsprotokoll bereinigen.
- [x] Laufzeit vollständig in die zwei Hauptordner `Web-App/` und `Server/` migrieren und parallele Root-Laufzeitstrukturen entfernen.
- [x] veraltete Diagnose-/Setup-Seiten, Platzhalter, doppelte Konfiguration, erzeugte Runtimeartefakte und ungenutzte Hilfsskripte evidenzbasiert entfernen.
- [ ] Dokumentation bei jeder Vertragsänderung zusammen mit Code und Tests fortschreiben.
- [x] GitHub-FTPS-Workflow auf die Produktionsquellen `Web-App/`, `Server/php/` und `Server/public/` umstellen.

## P2 – Core

- [ ] öffentliche Core-, Event- und Serviceverträge versionieren und globale/private APIs eindeutig trennen.
- [x] universellen, fachfreien Online-/Offline-Statusservice mit `network:changed` bereitstellen.
- [ ] Fehler-, Logging-, Konfigurations- und Storageverträge vereinheitlichen und mit Migrationstests absichern.
- [ ] Abhängigkeiten zwischen `Core`, `MasterFramework` und globalen Browserobjekten reduzieren, ohne funktionierende APIs unkontrolliert zu brechen.

## P3 – Startperformance

- [ ] First Paint und Interaktionsbereitschaft auf realistischen Mobilgeräten messen und Budgets festlegen.
- [x] sichtbare Shell vor Netzwerk, Authprüfung, IndexedDB und Modul-Discovery rendern; doppelte Discovery entfernen.
- [ ] Hintergrundinitialisierung weiter in einzeln beobachtbare Phasen teilen und Lade-/Fehlerzustände vervollständigen.

## P4 – Web-App / Server / API

- [ ] PHP-Produktionsvertrag und Node-Testvertrag endpointweise abgleichen; Abweichungen bewusst dokumentieren oder schließen.
- [ ] API-Versionierungsstrategie definieren.
- [ ] zentralen API-Timeout und sichere Retryregeln (nur idempotent bzw. mit Idempotenzschlüssel) implementieren.
- [x] zentrale konfigurierbare API-Basis im `ApiClient` und portable Zwei-Ordner-Pfade automatisiert testen.
- [ ] verbleibende direkte UI-Fetches vollständig über den zentralen Transportservice führen.

## P5 – Authentifizierung

- [ ] PHP-Login-Drosselung/Missbrauchsschutz implementieren und testen.
- [ ] produktive Cookieflags (`Secure`, `HttpOnly`, `SameSite`) unter HTTPS automatisiert verifizieren.
- [ ] entscheiden, ob Remember/Refresh benötigt wird; nur dann Rotations-/Widerrufsvertrag entwerfen.
- [ ] lokale Auth-Hilfen klar vom produktiven Serververtrauen isolieren.

## P6 – Offline-First / Synchronisation

- [ ] persistente Sync-Queue mit Änderungsstatus, Idempotenz, Retry/Backoff und Wiederanlauf implementieren.
- [ ] Daten-/Schema-Versionierung sowie Tombstones/Löschung definieren.
- [ ] Konflikterkennung, Konfliktstrategien und Benutzerauflösung dokumentieren und testen.
- [ ] Clientmigrationen, Cacheinvalidierung und Datenschutz für lokale Daten umsetzen.

## P7 – GPS

- [ ] GPS ausschließlich als technische Referenzerweiterung gegen Berechtigungen, Lifecycle, Storage und Offlinezustände validieren.
- [ ] Geräteberechtigungswechsel und Geolocationfehler auf realen Mobilgeräten testen.
- [ ] erst nach allgemeinem Syncvertrag GPS-Synchronisation/API/DB anbinden; keine GPS-Fachlogik in den Core verschieben.

## P8 – Mobile-Kompatibilität

- [ ] unterstützte Android-/iOS-/iPadOS-/Tablet-Browsermatrix festlegen.
- [ ] Touch, responsive Layouts, Storagegrenzen, Offlinewechsel und Hintergrundverhalten auf älteren sinnvoll verbreiteten Geräten testen.
- [ ] Accessibility- und Performancekriterien in die Abnahme aufnehmen.

## P9 – Serverwechsel / Skalierung

- [ ] Konfiguration und Adapter für API, Datenbank, Storage und Provider auf Hostkopplung prüfen.
- [ ] dokumentierten Backup-/Restore-, Umzugs- und Rollbacktest in einer disponiblen Umgebung durchführen.
- [ ] Skalierung erst anhand gemessener Anforderungen planen; Shared Hosting bleibt erste Produktionsbasis ohne Node-Dauerprozess.

## P10 – Erweiterungs-/Modularchitektur

- [ ] Manifest-, Capability-, Event- und Serviceverträge formal versionieren.
- [ ] allgemeinen sicheren Modulupdate-/Migrationspfad mit Rollback umsetzen.
- [ ] Modul-API-/Hook-Erweiterungspunkte entwerfen, ohne direkten Eingriff in den zentralen Router.
- [ ] Lifecycle, Permissions, Settings und Uninstall mit einer weiteren realen Erweiterung validieren, sobald eine fachlich erforderliche Erweiterung vorliegt.
- [ ] Modul-Isolation und Fehlerbegrenzung schrittweise verbessern.
