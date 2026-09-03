# NEUTRAL – Changelog

Abgeschlossene materielle Änderungen werden hier chronologisch dokumentiert. Offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md).

## 2026-09-03 – Produktiven Admin-Funktionstest und neutrale Loginfelder abgeschlossen

- echten Betreiberlogin sicher im geschützten Browserdialog ausgeführt und die fortbestehende Sitzung über alle 15 Admin-Hauptansichten ausschließlich lesend bestätigt; keine alte Dashboardansicht, sichtbare Anwendungsfehlermeldung, Warnbox oder hängende Ladeanzeige festgestellt,
- 62 Konsolenmeldungen als einheitliche Browser-Extension-Metadatenfehler und nicht als Neutral-Anwendungsfehler klassifiziert,
- voreingestellte Kennungen `admin` und `Developer` sowie den clientseitigen `Developer`-Fallback test-first entfernt; gezielter Regressionstest zunächst rot und danach mit allen 14 Admin-CMS-Tests grün,
- Codecommit `d31c870e83922ac518f127d8eccdecc42d5ea62f` auf `main`, FTPS-Lauf `33807649560` und CodeQL-Lauf `33807649227` erfolgreich,
- abschließender öffentlicher Read-only-Lauf `33808897301` bestätigt Root/Asset/Status-API mit HTTP 200, den unautorisierten Admin-Einstieg mit 401, interne PHP-Datei mit 403 und produktiv leere Login-Kennungsfelder,
- Logout ausgelöst, wegen anschließendem CDP-/Browser-Recovery-Timeout jedoch nicht als erfolgreich gewertet; sichtbares Sitzungsende, negativer CSRF-Livefall, Login-Drosselung und reale responsive iPad-/Safari-Abnahme bleiben offen,
- keine produktiven Schreib-, Lösch-, Datenbank- oder E-Mail-Operationen und keine Ausgabe von Zugangsdaten; ausgeführt und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-03 – Zertifikatsgültiges Produktionsdeployment abgeschlossen

- produktiven Workflow test-first auf den zertifikatsgültigen FTPS-Host `server.cpprotect5.de` und Port 21 festgelegt; TLS-Zertifikats- und Hostnamenprüfung bleiben zwingend, Benutzer und Passwort ausschließlich GitHub Secrets,
- erstes erfolgreiches Deployment mit Lauf `33801527270` in das vorhandene geschützte Ziel ausgeführt; Betreiber-Screenshot bestätigte im geöffneten `public_html` die Ordner `Web-App` und `Server` sowie aktuelle Paketmetadaten,
- eine nach dem virtuellen FTP-Root-Nachweis getroffene falsche Codex-Annahme transparent korrigiert: Lauf `33802090900` zielte kurzzeitig auf Konto-Home `/`; anschließend wurde der Workflow test-first wieder auf `secrets.FTP_TARGET_DIR` zurückgestellt. Bestehende Konto-Home-Verzeichnisse wurden nicht gelöscht,
- Korrekturcommit `20583c251a9f6f5e069a6c089c01f99618aa2196` auf `main` übertragen; FTPS-Lauf `33802485499` und CodeQL-Lauf `33802485847` bestanden,
- abschließender separater Read-only-Lauf `33803384719` bestätigte Server, TLS, Authentifizierung, lesbares geschütztes Ziel und die drei Marker `.htaccess`, `Web-App` und `Server`; keine Upload-, Änderungs- oder Löschoperation im Diagnosejob,
- öffentliche Browserprüfung bestätigte „Neutral Platform“, die geschützte Admin-Anmeldeseite und das Fehlen der alten Ansicht „FRAMEWORK DASHBOARD“,
- fokussierte Deployment-/Paketprüfung mit 52/52 sowie abschließende PHP-freie Regression mit 230/230 bestanden; der ungekürzte lokale Testbefehl bleibt in dieser Cloud wegen fehlender PHP-Binary blockiert und wird nicht als grün ausgegeben,
- Zugangsdaten, Secretwerte und vollständige Verbindungsstrings wurden weder protokolliert noch dokumentiert,
- ausgeführt, korrigiert und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-03 – Portable Installationsbasis lokal abgeschlossen

- zertifikatsgültigen Hostingnamen `server.cpprotect5.de` über Reverse-DNS, identische Ziel-IP und einen separaten expliziten FTPS-Read-only-Lauf bestätigt; Lauf `33800747981` akzeptierte TLS und Authentifizierung und las den virtuellen Startpfad `/`,
- vorhandenen Serverroot ohne Inhaltsausgabe klassifiziert: 64 sichtbare Einträge und `.htaccess`, jedoch keine Ordner `Web-App/` oder `Server/`; damit ist die alte Deploymentstruktur und der noch fehlende portable Upload belegt,
- Diagnose durch **Codex (ChatGPT Work / GitHub-Connector)** ohne Upload, Änderung, Löschung oder Secret-Ausgabe durchgeführt,

- öffentlicher Basispfad für Domain-Root, eigenen physischen DocumentRoot und URL-Unterpfad zentral in PHP und Browser umgesetzt; direkt abschließendes API-Rewrite, konfigurationsbasiertes PHP-Routing und paketiertes `<base href>` halten auch tiefe SPA-Routen unter demselben Vertrag,
- reproduzierbares Produktionspaket mit Produzenten-/Formatkennung, `sourceDirty`, exakter Allowlist, wertfreier `.env.example`, sortiertem Manifest und `SHA256SUMS` sowie gemeinsamem, maskierendem Secret-Scanner einschließlich verschlüsselter Private Keys eingeführt; fremde oder unvollständig verifizierte Ausgaben werden nicht ersetzt,
- FTPS-Deployment verlangt ein ausdrückliches Ziel, erzwingt Zertifikats-/Hostnamenprüfung, bindet verwaltete Löschungen per SHA-256-Fingerprint an Ziel und Paketformat, löscht keine historischen HTML-Dateien pauschal, überträgt das Paket ohne `--only-newer` vollständig und reicht das lftp-Skript nur über stdin weiter,
- lokaler App-Bootstrap für validierte Appmetadaten, optionale GPS-Auswahl und optionales `git init` ohne Remote ergänzt,
- paketbasierter Preflight prüft Hashes, Inventar, Symlink-/Traversalgrenzen, beide Resolver-Einstiege, exakte Meta-/`base`-Markierungen sowie eine rohe, whitespacefreie, case-insensitive `https://`-Basis mit nichtleerer Authority, bevor WHATWG-, Credential-, Query-, Fragment- und exakte Basispfadprüfungen folgen; Statuswerte sind ausschließlich `PASS`, `BLOCKED` und `NICHT_GEPRUEFT`,
- fehlende lokale PHP-Binary und externes Rewrite werden nicht als bestanden ausgegeben; Paket-/Inventar-/Hash-/Basispfad- und Secretfehler blockieren mit maskierten Ausgaben,
- alle finalen Reviewbefunde test-first reproduziert; die abschließende PHP-ausgeschlossene Gesamtsuite mit 239 bestandenen, zwei erwarteten PHP-Skips und 0 Fehlern verifiziert; keine Server-, DB-, FTP-, GitHub- oder sonstige externe Operation ausgeführt,
- den einzigen Restbefund der fokussierten Nachprüfung durch **Codex (ChatGPT Work)** geschlossen: auch Adminformulare, Connection-/Provider-Normalisierung und Setupzustände beziehen öffentliche API-Defaults nun aus `NeutralPublicPath`; der erweiterte Regressionstest und die unveränderte Gesamtsuite bestehen,
- Web-App- und Serveranleitung beschreiben denselben verbindlichen Full-Stack-Paketweg; die Web-App-Anleitung behandelt dessen Browseranteil und erfindet kein separates Client-only-Artefakt,
- GitHub-`main` über den Connector integriert; nach zwei test-first Deploymentkorrekturen ist `6b59ec68f980517fbbd49a5e8604a45b5acc1cdc` der finale Codecommit und CodeQL-Lauf `33716675598` erfolgreich,
- Hostnamenprüfung im GitHub-Workflow unveränderlich auf `true` gesetzt und lftp-Skript weiterhin geheimnisfrei über den vom installierten Client unterstützten argumentfreien stdin-Aufruf übergeben,
- finaler FTPS-Lauf `33716676051` baute das Paket und erreichte den Server, brach aber wegen nicht übereinstimmender Zertifikats-/Hostname-Identität vor Authentifizierung und Upload sicher ab; kein Deploymenterfolg wird behauptet,
- PHP-/Apache-/Live-/Datenbank-/neues-Repository- und erfolgreicher FTPS-Nachweis bleiben ausdrücklich offen,
- ausgeführt und dokumentiert durch **Codex (ChatGPT Work)**.

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
