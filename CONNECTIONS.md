# NEUTRAL – Verbindungen und Wiederherstellung

**Status:** ENDE-ZU-ENDE VERIFIZIERT  
**Geprüft:** 2026-09-01  
**Repository:** `El-Ninjo1965/Neutral`  
**Produktionsweg:** `PC → GitHub → GitHub Actions → FTPS → Webserver → HTTPS`

Diese Datei ist die verbindliche, secretsichere Betriebsübersicht für lokale Codex-Sitzungen und Verbindungsdiagnosen. Sie enthält bewusst keine Passwörter, Tokens oder privaten Secret-Werte. Das Repository ist öffentlich.

## 1. Verbindliche Zuordnung

| Komponente | Verbindlicher Wert |
|---|---|
| GitHub-Konto | `El-Ninjo1965` |
| GitHub-Repository | `El-Ninjo1965/Neutral` |
| Hauptbranch | `main` |
| Git-Protokoll | HTTPS über Git Credential Manager |
| Deployment | GitHub Actions, Workflow `FTPS Deploy` |
| Produktionshost | `www.turbolikes.com` |
| FTP-/FTPS-Benutzer | `root@turbolikes.com` |

Nicht auf ein anderes GitHub-Konto, Repository oder einen anderen Branch ausweichen. Ein einzelner fehlgeschlagener Aufruf beweist nicht, dass Repository oder Verbindung fehlen.

## 2. Dauerhafte Secret-Speicherung

### GitHub

Die produktiven Übertragungswerte liegen als Repository-Secrets in `El-Ninjo1965/Neutral`:

- `FTP_HOST`
- `FTP_USER`
- `FTP_PASSWORD`
- `FTP_PORT`
- `FTP_TARGET_DIR`
- `FTP_SSL_CHECK_HOSTNAME`

GitHub zeigt gespeicherte Secret-Werte nach dem Anlegen nicht wieder an. Geprüft werden daher Secret-Namen, Aktualisierungszeit und ein realer Workflow-Lauf.

### PC

Die GitHub-CLI-Anmeldung liegt im Windows-Schlüsselbund. Lokale FTP-/FTPS-Zugangsdaten dürfen nur in einer ignorierten `.env`-Datei außerhalb der Versionskontrolle liegen. Die Vorlage ist [`.env.ftp.deploy.example`](.env.ftp.deploy.example).

Folgende Dateien dürfen niemals committed werden:

- `.env`
- `.env.ftp.deploy`
- Token-, Passwort- oder Credential-Exporte

## 3. Verifizierter Stand

Am 2026-09-01 wurde der vollständige Produktionsweg praktisch geprüft:

1. Eine zufällig benannte, temporäre PHP-Prüfdatei wurde lokal erstellt.
2. Test-Commit `3d61de7` wurde nach GitHub `main` gepusht.
3. GitHub Actions übertrug das Produktions-Staging erfolgreich per FTPS.
4. Der erste öffentliche HTTPS-Aufruf lieferte HTTP `200`, die erwartete Prüfkennung und `self_deleted=true`.
5. Die Datei löschte sich auf dem Server selbst; der zweite Aufruf lieferte HTTP `404`.
6. Cleanup-Commit `e2ca709` entfernte die Datei aus Git und GitHub.
7. Das Cleanup-Deployment war erfolgreich; die öffentliche URL lieferte abschließend weiterhin HTTP `404`.

Nachweise:

- [FTPS-Testdeployment](https://github.com/El-Ninjo1965/Neutral/actions/runs/33485515863)
- [FTPS-Cleanup-Deployment](https://github.com/El-Ninjo1965/Neutral/actions/runs/33485756322)
- [CodeQL des Cleanup-Commits](https://github.com/El-Ninjo1965/Neutral/actions/runs/33485756143)
- [FTPS-Deployment der Setup-Härtung](https://github.com/El-Ninjo1965/Neutral/actions/runs/33490787101)
- [CodeQL der Setup-Härtung](https://github.com/El-Ninjo1965/Neutral/actions/runs/33490786715)

Die temporäre Datei ist lokal, auf GitHub und auf dem Server entfernt.

## 4. Schnellprüfung

### PC und lokales Git

Im Repository ausführen:

```powershell
git status --short --branch
git remote -v
git rev-parse HEAD
git rev-parse origin/main
```

Erwartung:

- Branch `main`
- Remote `https://github.com/El-Ninjo1965/Neutral.git`
- keine unerwarteten Arbeitskopieänderungen
- `HEAD` und `origin/main` identisch, sofern keine bewusst unpublizierte Arbeit existiert

### GitHub-Anmeldung und Rechte

```powershell
gh auth status
gh repo view El-Ninjo1965/Neutral --json nameWithOwner,defaultBranchRef,viewerPermission,url
```

Erwartung:

- aktives Konto `El-Ninjo1965`
- Default-Branch `main`
- Berechtigung `ADMIN`

### GitHub-Secrets

```powershell
gh secret list --repo El-Ninjo1965/Neutral
```

Die in Abschnitt 2 genannten sechs Secret-Namen müssen vorhanden sein. Keine Secret-Werte in Terminalausgaben, Logs oder Dokumentation kopieren.

### Workflows und FTPS

```powershell
gh run list --repo El-Ninjo1965/Neutral --branch main --limit 10
```

Der neueste erwartete Lauf `FTPS Deploy` muss `completed/success` erreichen. Details eines Laufs:

```powershell
gh run view RUN_ID --repo El-Ninjo1965/Neutral
```

Ein erfolgreicher FTPS-Lauf bestätigt Anmeldung, TLS-Verbindung, Zielpfad und Upload aus GitHub Actions. Er bestätigt nicht automatisch eine direkte manuelle PC-zu-FTPS-Verbindung.

### Öffentliche Website

```powershell
curl.exe --silent --show-error --output NUL --write-out "%{http_code}" https://www.turbolikes.com/
```

Ein HTTP-Status allein bestätigt nur die öffentliche Erreichbarkeit. Ein echter Ende-zu-Ende-Deploymenttest benötigt zusätzlich eine eindeutige temporäre Prüfkennung und vollständiges Cleanup.

## 5. Wiederherstellung

### GitHub-CLI ist abgemeldet oder Token ungültig

Auf dem PC starten:

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

GitHub zeigt einen Gerätecode. Die Freigabe kann auf einem iPad oder einem anderen Gerät unter `https://github.com/login/device` für das Konto `El-Ninjo1965` erfolgen. Danach `gh auth status` und die Repositoryabfrage aus Abschnitt 4 wiederholen.

### Repository fehlt lokal

```powershell
git clone https://github.com/El-Ninjo1965/Neutral.git
Set-Location Neutral
npm ci
npm test
```

Vor einem neuen Clone lokale, nicht gepushte Commits sichern und mit `origin/main` vergleichen. Niemals einen alten Checkout ungeprüft überschreiben oder zurücksetzen.

### GitHub-Push funktioniert, FTPS-Workflow schlägt fehl

In dieser Reihenfolge prüfen:

1. aktuellen Workflow-Lauf und fehlgeschlagenen Schritt öffnen;
2. Vorhandensein der sechs Repository-Secrets prüfen;
3. keine Secret-Werte ausgeben oder in Kommentare kopieren;
4. `FTP_TARGET_DIR` und `FTP_SSL_CHECK_HOSTNAME` auf beabsichtigte Konfiguration prüfen;
5. fehlgeschlagenen Lauf erst nach Ursachenklärung erneut starten;
6. nach erfolgreichem Lauf die erwartete öffentliche URL per HTTPS prüfen.

### Workflow wartet auf Genehmigung

Status mit `gh run list` und `gh run view` belegen. Nur Läufe mit `queued`, `in_progress`, `waiting` oder einer angezeigten Environment-Freigabe benötigen weitere Aufmerksamkeit. Abgeschlossene fehlgeschlagene Läufe blockieren neue Arbeit nicht.

## 6. Sicherheitsregeln

- Keine Passwörter oder Tokens in Git, Markdown, Issues, Pull Requests oder Chatantworten wiedergeben.
- Keine produktiven Secrets in Testdateien einbetten.
- Temporäre öffentliche Prüfdaten zufällig benennen, inhaltlich harmlos halten und nach dem Test lokal, auf GitHub und auf dem Server entfernen.
- Vor einer Erfolgsmeldung lokalen Status, Remote-Commit, Workflow-Endstatus und öffentliche URL frisch verifizieren.
- Der PC muss eingeschaltet, online und der lokale Codex-Host erreichbar sein, damit lokale PC-Arbeit möglich ist.
- GitHub-Secrets bleiben nutzbar, bis Zugangsdaten geändert, widerrufen oder vom Hostinganbieter ersetzt werden.

## 7. Aussagegrenzen

Bestätigt ist der Weg `PC → GitHub → GitHub Actions → FTPS → Webserver → HTTPS`. Eine direkte manuelle Übertragung `PC → FTPS` muss separat mit einer lokalen, nicht versionierten Deploy-Konfiguration geprüft werden. Fehlender Zugriff einer einzelnen Codex-Task-Sandbox auf eine `.env` bedeutet nicht, dass die Datei oder der Serverzugang fehlen.
