# NEUTRAL – Changelog

Abgeschlossene materielle Änderungen werden hier chronologisch dokumentiert. Offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md).

## 2026-09-01 – Plattformübergreifende Baseline stabilisiert

- PHP-Admin-Session-Fixtures mit PHP 8.5 Strict Mode kompatibel gemacht, ohne die Produktionssicherheit abzuschalten,
- absolute Windows-Pfade für externe Modulmanifeste und GPS-Lifecycle unterstützt,
- statische Node-Auslieferung und PHP-Environment-Kandidaten plattformübergreifend normalisiert,
- Architekturprüfung auf exakte Verzeichnisnamen statt Windows-case-insensitiver Dateisystemauflösung umgestellt,
- vollständige Suite mit `125/125` bestandenen Tests und `0` Fehlern verifiziert,
- Hosting-Preflight ausgeführt; Allowlist und Deployment-Dry-Run bestehen, produktive Secrets bleiben außerhalb des Repositorys.

## 2026-09-01 – Windows-Entwicklungsumgebung hergestellt

- Git, GitHub CLI, Node.js LTS und PHP 8.5 installiert und verifiziert,
- Git-Autorenidentität, Credential Manager und sichere Git-Standards global konfiguriert,
- GitHub CLI über den Windows-Schlüsselbund autorisiert und Repository-/Pushzugriff geprüft,
- PHP-Erweiterungen für Shared-Hosting-Kompatibilität aktiviert,
- Node-Abhängigkeiten reproduzierbar installiert; Audit meldet keine bekannte Paketlücke,
- vollständige Testsuite erstmals ohne Werkzeugabbrüche ausgeführt und den tatsächlichen Stand `116/125` dokumentiert.

## 2026-09-01 – Dokumentationsordnung und Core-1.0-Vertrag

- verbindliche Dokumentationshierarchie und Konfliktregeln eingeführt,
- endlichen Core-1.0-Releasevertrag mit PHP-/MySQL-Shared-Hosting als Mindestplattform erstellt,
- nachgewiesenen Ist-Zustand von Ziel und Roadmap getrennt,
- Node, PWA und Store-Ausbau als optionale spätere Phasen eingeordnet,
- bekannte Baseline-Testprobleme wahrheitsgemäß dokumentiert,
- unmittelbare Arbeit auf eine kurze Core-1.0-Fertigstellungsreihenfolge reduziert.

## Historischer Stand bis 2026-08-29

Die früheren detaillierten Arbeitsprotokolle bleiben in [`WORKFLOW.md`](WORKFLOW.md) als historischer Nachweis erhalten. Neue Abschlussprotokolle werden nur noch hier ergänzt.
