# NEUTRAL – Changelog

Abgeschlossene materielle Änderungen werden hier chronologisch dokumentiert. Offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md).

## 2026-09-02 – Portable Installationsarchitektur freigegeben

- die portable Installationsbasis als eigenständiges erstes Core-1.0-Arbeitspaket spezifiziert,
- Domain-Root, eigener physischer Document-Root und URL-Unterpfad über einen validierten `NEUTRAL_BASE_PATH` eindeutig getrennt,
- Produktionspaket, wertfreie Konfiguration, lokaler App-Bootstrap, Preflight, Sicherheitsgrenzen und testbare Abnahmekriterien verbindlich beschrieben,
- Modulvertrag, Providerverwaltung und Betriebsportabilität bewusst als nachgelagerte eigenständige Arbeitspakete abgegrenzt,
- spezifiziert und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-02 – Core-1.0-Neuinstallationslücken präzisiert

- nachgewiesenen Domain-Root-Deploy, einen neuen physischen Document-Root und eine noch nicht bestandene Installation unter URL-Unterpfaden klar getrennt,
- root-absolute Client-, Admin- und API-Pfade als Blocker für URL-Unterpfade dokumentiert; das physische FTPS-Ziel bleibt eine separate Konfiguration,
- fehlendes Produktionspaket, Environment-Bootstrap, Neu-Repository-Verfahren sowie leere End-to-End-Installation als konkrete Abnahmepakete in `TODO.md` aufgenommen,
- verbindlich festgehalten, dass Root-`.htaccess`, der vollständige Ordner `Web-App/`, `Server/php/` und `Server/public/` gemeinsam und ohne Abflachung übertragen werden müssen,
- analysiert und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-02 – Admin-CMS-Browserstart repariert

- sechs Admin-Komponenten veröffentlichen ihre bereits vorhandenen Implementierungen jetzt als die von `admin-init.js` erwarteten Browser-Globals,
- der moderne Admin-Router kann dadurch nach erfolgreichem Login die alte Dashboard-Fallbackansicht ersetzen,
- lokale Runtime-Konfiguration unter `Server/config/` wird wegen möglicher Sitzungs-, CSRF- und Passwort-Hash-Daten nicht mehr von Git erfasst,
- ein browsernaher VM-Regressionstest prüft alle erforderlichen Exporte; der gezielte Admin-Test besteht mit `11/11`, die in dieser Cloud ohne PHP ausführbare Suite mit `132/132` Tests,
- Commit `156e6e90768b797e49f921df62975272111eb1a9`, CodeQL-Lauf `33681855268` und FTPS-Lauf `33681855656` wurden erfolgreich verifiziert,
- ein authentifizierter Aufruf von `https://www.turbolikes.com/admin.php` zeigte die neue CMS-Shell mit den Bereichen Overview, Platform, Access, Infrastructure und Monitoring; die alte Ansicht „FRAMEWORK DASHBOARD“ war nicht vorhanden und die Navigation zu Users sowie zurück zum Dashboard reagierte,
- der vollständige Login-/Logout-/CSRF-Durchlauf und die reale responsive iPad-/Safari-Abnahme bleiben offen,
- ausgeführt und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-01 – Aktive Produktion gegen Setupzugriffe gehärtet

- Setupoberfläche und direkte Setup-API-Kompatibilitätsendpunkte nach Aktivierung standardmäßig mit HTTP 404 verborgen,
- Setup-Sperre gegen Verlust oder Beschädigung der Runtime-Markierung durch DB-gestützte Installationserkennung und Fail-closed-Verhalten bei nicht prüfbarer konfigurierter Datenbank gehärtet,
- kurzzeitige Wiederherstellung ausschließlich über hostlokales Flag plus mindestens 32 Zeichen langes HTTP-Basic-Recoverytoken ermöglicht,
- öffentlichen Status auf Service-, App- und reinen DB-Erreichbarkeitszustand reduziert,
- Environmentpfade, Datenbankkennungen und interne Fehlermeldungen aus öffentlichen Statusantworten entfernt,
- positive und negative PHP-HTTP-Regressionstests für Sperre, authentifizierten Recoverymodus, Methodenverhalten, DB-Evidenz und Statusbereinigung ergänzt.

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

Die detaillierten Arbeitsnachweise bleiben zusätzlich in [`WORKFLOW.md`](WORKFLOW.md) erhalten. Das Changelog bleibt die kompakte Chronik abgeschlossener Änderungen; offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md).
