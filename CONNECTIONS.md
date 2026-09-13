# NEUTRAL – Verbindungen und Wiederherstellung

**Status:** VERBINDLICHE BETRIEBSÜBERSICHT  
**Geprüft:** 2026-09-13

Diese Datei beschreibt den secretsicheren Betriebsweg für Repository-, CI-, Deployment- und Verbindungsdiagnosen. Historische Testcommits, einmalige Prüfläufe und alte Zugangszustände bleiben über Git nachvollziehbar und werden hier nicht fortgeschrieben.

## Verbindlicher Weg

`Arbeitsumgebung → GitHub main → GitHub Actions → FTPS → Webserver → HTTPS`

Repository und Hauptbranch sind `El-Ninjo1965/Neutral` und `main`. Produktionsdeployments laufen über den Workflow `FTPS Deploy`. Der konkrete physische Zielpfad kommt ausschließlich aus der host-/GitHub-seitigen Deploymentkonfiguration und wird nicht im Repository erraten oder festgeschrieben.

## Secret-Grenze

Secret-Werte dürfen niemals in Repositorydateien, Issues, Pull Requests, Logs, Befehlszeilen-URLs oder Chatantworten geschrieben werden.

Verwendete Konfigurationsnamen können dokumentiert werden, insbesondere:

- `GH_TOKEN` für autorisierten GitHub-Zugriff in Agent-/Codex-Umgebungen;
- `FTP_HOST`, `FTP_PORT`, `FTP_USER`, `FTP_PASSWORD`;
- `FTP_PROTOCOL`, `FTP_TARGET_DIR`, `FTP_SECURE`;
- GitHub-Repository-Secrets für den produktiven FTPS-Workflow.

Werte werden nur auf Vorhandensein und durch reale autorisierte Operationen geprüft, niemals ausgegeben. Lokale Deploymentwerte gehören in ignorierte hostlokale Environmentdateien; `.env` und reale Deploymentdateien werden nicht committed.

## Git-/Repository-Prüfung

Vor Änderungen oder Recovery:

```bash
git status --short --branch
git remote -v
git rev-parse HEAD
git rev-parse origin/main
```

Erwartet werden der beabsichtigte Branch, das korrekte Repository und keine unerwarteten lokalen Änderungen. Vor Reset, Clone oder Remote-Korrektur werden nicht veröffentlichte Änderungen und Commits gesichert bzw. verglichen.

Ein fehlendes `origin` oder fehlende persistente CLI-Anmeldung in einer austauschbaren Sandbox ist kein Projektdefekt. Zuerst Umgebung, Tokenverfügbarkeit, Repositoryzuordnung und Authentifizierung prüfen.

## CI-/Deployment-Prüfung

Bei einem fehlgeschlagenen Workflow:

1. den konkreten fehlgeschlagenen Schritt lesen;
2. unterscheiden, ob Tests/Paketbau oder erst FTPS scheitern;
3. Secret-Namen und Konfiguration auf Vorhandensein prüfen, Werte niemals ausgeben;
4. `FTP_TARGET_DIR` nur aus autoritativer Konfiguration verwenden;
5. Hostnamen-/Zertifikatsprüfung nicht abschwächen;
6. erst nach Ursachenklärung erneut ausführen;
7. anschließend den öffentlichen HTTPS-Zustand read-only prüfen.

Ein erfolgreicher Workflow bestätigt nur den tatsächlich ausgeführten Weg. Eine direkte manuelle FTPS-Verbindung oder andere Umgebung muss separat geprüft werden.

Dokumentations-only-Commits lösen keinen Produktionsdeploy aus.

## Wiederherstellung des Arbeitszugriffs

Wenn ein lokaler Checkout fehlt, Repository neu klonen und anschließend Abhängigkeiten und Tests ausführen. Einen vorhandenen alten Checkout nicht ungeprüft überschreiben.

Wenn GitHub-Authentifizierung fehlt, den vorgesehenen autorisierten Login-/Tokenweg der jeweiligen Umgebung wiederherstellen und danach Repository sowie Berechtigung erneut prüfen.

Wenn GitHub-Push funktioniert, FTPS jedoch scheitert, ausschließlich Workflow, Deploymentkonfiguration und Zielpfad diagnostizieren; keine alten Accounts oder historischen Fallback-Zugänge reaktivieren.

## Runtime-Wahrheit

Aktuelle hostlokale Environment-, Datenbank-, Session- und Auth-Konfiguration ist autoritativ. Historische Konfigurationswerte dürfen nicht als aktuelle Wahrheit übernommen werden.

User- und Admin-Authentifizierung verwenden getrennte Scopes. Ein Login darf den jeweils anderen Scope nicht überschreiben.

Admin-Verbindungsansichten zeigen nur autoritative, sanitiserte Betriebsinformationen. Passwörter, Tokens, rohe Environmentwerte und Beispiel-URLs dürfen nicht als aktive Konfiguration erscheinen. Nicht konfigurierte optionale Provider werden ausdrücklich als nicht konfiguriert dargestellt.

## Sicherheitsregeln

- keine Passwörter oder Tokens in Git oder Dokumentation;
- keine produktiven Secrets in Tests;
- temporäre öffentliche Prüfdaten harmlos und vollständig entfernbar halten;
- vor Erfolgsmeldungen Remote-Commit, Workflowstatus und Zielzustand frisch prüfen;
- fehlender Zugriff einer einzelnen Sandbox beweist nicht, dass Server- oder Repositoryzugang grundsätzlich fehlt.

Aktueller Implementierungs- und Live-Stand steht in `STATUS.md`; diese Datei enthält nur den dauerhaften Betriebs- und Recoveryvertrag.