# NEUTRAL: getrennte Web-App-/Admin-/Server-Deploymentarchitektur

**Datum:** 2026-09-01  
**Status:** Entwurf zur Freigabe  
**Grundlage:** `VISION.md`, `Architecture.md`, die bestätigte cPanel-/LiteSpeed-/PHP-Umgebung und der funktionsfähige FTPS-Zugang.

## 1. Ziel

NEUTRAL wird als zwei fachlich und betrieblich getrennte Hauptkomponenten ausgeliefert:

1. eine öffentliche, offline-first-fähige Web-App unter `/app/`;
2. ein serverseitig geschütztes Admin-/API-System unter `/app-admin/`.

Der PHP-Core, Runtimezustand, Logs und Secrets liegen außerhalb des öffentlichen Document Roots. Web-App und Server kommunizieren ausschließlich über einen dokumentierten HTTPS-/JSON-API-Vertrag. Ein späterer Wechsel auf getrennte Server oder Domains darf keinen fachlichen Umbau des Client-Cores erfordern.

## 2. Zielstruktur auf dem bestätigten Hosting

```text
/home/web1819/
├── neutral-server/
│   ├── php/                     # nichtöffentlicher PHP-Core
│   ├── runtime/                 # Logs, Setupzustand, generierte Laufzeitdaten
│   └── .env                     # hostlokale Secrets, niemals Deploymentartefakt
│
└── public_html/
    ├── .well-known/             # permanent bewahren und nie verwalten/löschen
    ├── .well-know/              # defensive zweite Ausnahme, falls vorhanden
    ├── app/                     # eigenständige öffentliche Web-App
    └── app-admin/
        ├── index.php            # geschützter Admin-Einstieg
        ├── setup.php            # nur während autorisiertem Setup nutzbar
        ├── api/                 # öffentliche API-Frontcontroller
        └── assets/              # eigenständige Admin-Assets
```

`.well-known` und `.well-know` gehören nicht zum NEUTRAL-Deployment. Kein Cleanup-, Mirror- oder Migrationsschritt darf sie verändern.

## 3. Öffentliche URLs

Erste Produktionsstufe als Same-Origin-Installation:

```text
https://www.turbolikes.com/app/
https://www.turbolikes.com/app-admin/
https://www.turbolikes.com/app-admin/api/
```

Same-Origin bleibt zunächst der unterstützte Standard. Dadurch funktionieren sichere Sessions, CSRF und Cookies ohne vorzeitige CORS-Komplexität. Die Web-App erhält dennoch eine konfigurierbare API-Basis, standardmäßig `/app-admin/api`.

Ein späterer Betrieb auf unterschiedlichen Hosts wird über Konfiguration und einen ausdrücklich implementierten Cross-Origin-Auth-/CORS-Adapter ergänzt. Er ist kein Abnahmekriterium dieser Migration.

## 4. Komponenten und Verantwortungsgrenzen

### 4.1 Web-App-Artefakt

Das Web-App-Artefakt enthält ausschließlich öffentliche Clientressourcen:

- sichtbare Shell und Styles;
- Browser-Core;
- App-Shell, Metadaten und Module;
- IndexedDB-/Offline-Funktionen;
- API-Client und öffentliche Laufzeitkonfiguration.

Es enthält keine PHP-Dateien, Datenbankzugänge, Admin-Tokens, FTP-Zugänge oder serverseitige Runtime. Alle Assets und Modulmanifeste müssen unter der Basis `/app/` funktionieren, ohne fest codierte Repository- oder Serverpfade.

### 4.2 Admin-/API-Artefakt

`/app-admin/` enthält ausschließlich öffentliche Server-Einstiegspunkte und die für das Admin-UI notwendigen öffentlichen Assets:

- serverseitig geschützter Admin-Einstieg;
- Setup-Einstieg mit Aktivierungs-/Abschaltschutz;
- API-Frontcontroller und Rewritekonfiguration;
- eigenständige Admin-JavaScript-/CSS-Ressourcen.

Das Admin-UI darf nicht von Dateien unter `/app/` abhängen. Gemeinsame Verträge dürfen zur Build-/Stagingzeit aus einer kanonischen Quelle übernommen werden, müssen aber im ausgelieferten Admin-Artefakt vollständig vorhanden sein.

### 4.3 Nichtöffentlicher Server-Core

`/home/web1819/neutral-server/php/` enthält Bootstrap, Konfiguration, Datenbank-, Auth-, RBAC-, Migrations-, Audit- und Modulservices. Öffentliche Frontcontroller laden den Bootstrap über einen kleinen, validierten Hostpfad.

Der Rootpfad wird hostlokal konfiguriert. Er darf nicht als Browserwert ausgeliefert werden. Direkter HTTP-Zugriff auf Core, Runtime oder `.env` ist strukturell ausgeschlossen, nicht nur durch eine einzelne Rewrite-Regel.

## 5. API-Vertrag

Die Web-App verwendet einen zentralen `ApiClient`. Die API-Basis wird in einer kleinen öffentlichen Laufzeitkonfiguration gesetzt und nicht in Fachmodulen dupliziert.

Standard:

```text
/app-admin/api
```

Anforderungen:

- HTTPS und JSON;
- versionierbare Endpunkte;
- zentrale Timeoutbehandlung;
- Retry nur für sichere/idempotente Anfragen;
- serverseitige Authentifizierung, Autorisierung und Eingabevalidierung;
- sichere Sessioncookies;
- CSRF-Schutz für zustandsändernde Browseranfragen;
- keine Secrets oder internen Pfade in Antworten und Logs;
- Statusendpunkt für Deployment-/Kompatibilitätsprüfung.

Die Web-App greift niemals direkt auf MySQL/MariaDB oder Serverdateien zu.

## 6. Authentifizierung

Phase 1 nutzt Same-Origin-Sessions:

- Cookiepfad muss `/app-admin/` beziehungsweise den erforderlichen gemeinsamen Umfang abdecken;
- `Secure`, `HttpOnly` und ein passender `SameSite`-Wert sind verpflichtend;
- Schreibrequests verwenden den vorhandenen CSRF-Vertrag;
- das Admin-UI wird ausschließlich nach serverseitig bestätigter Identität ausgeliefert.

Cross-Origin-Cookies, CORS oder Tokenflows werden nicht implizit aktiviert. Eine spätere Trennung auf andere Domains benötigt einen eigenen dokumentierten Sicherheitsvertrag.

## 7. Repository- und Stagingmodell

Die bestehende Repositorytrennung `Web-App/` und `Server/` bleibt erhalten. Deployment erzeugt daraus drei getrennte Stagingbäume:

```text
staging/app/          <- Web-App
staging/app-admin/    <- öffentliche Server-/Admin-Einstiege und Assets
staging/server/       <- nichtöffentlicher PHP-Core
```

Die Produktion wird nicht mehr als vollständige Repositorystruktur in einen einzigen Document Root gespiegelt.

Deploymentziele:

- `FTP_APP_DIR=/public_html/app`
- `FTP_ADMIN_DIR=/public_html/app-admin`
- `FTP_SERVER_DIR=/neutral-server`

Die Werte bleiben konfigurierbar. Jeder Deploy validiert, dass die drei Ziele exakt innerhalb der erwarteten FTP-Root liegen. Ein leerer, fehlender oder zu breiter Zielpfad führt zum Abbruch.

## 8. Deploymentmodi

Es gibt getrennte, explizite Modi:

1. **Web-App deployen** – verändert nur `/public_html/app`;
2. **Admin/API deployen** – verändert nur `/public_html/app-admin`;
3. **Server-Core deployen** – verändert nur `/neutral-server/php`;
4. **Gesamtdeployment** – führt die drei Modi kontrolliert nacheinander aus.

Kein Modus verändert `.well-known`, `.well-know`, hostlokale `.env`, Datenbanken, Backups oder fremde Dateien. Das bestehende FTPS-Zertifikats- und Hostnamenprüfungsverhalten bleibt erhalten. FTP-Secrets werden weder rotiert noch gelöscht.

## 9. Migration

Die Migration erfolgt in überprüfbaren Schritten:

1. Repositorytests und aktuelle Verträge inventarisieren.
2. Zielpfadkonfiguration und Stagingtests zuerst ergänzen.
3. Web-App auf Basis `/app/` portabel machen.
4. Admin-Assets aus der Web-App-Abhängigkeit lösen.
5. öffentliche Server-Entrypoints auf den privaten Bootstrap umstellen.
6. drei getrennte Deploy-Stagingbäume erzeugen.
7. GitHub-Actions- und Codespace-Deployment auf dieselben Regeln bringen.
8. auf dem leeren Webspace zuerst Server-Core, dann Admin/API, dann Web-App deployen.
9. API-Status, Setup, Datenbank, Auth, CSRF, Adminschutz und Clientstart prüfen.
10. erst nach erfolgreicher Abnahme Setupzugang sperren und temporäre Diagnoseartefakte entfernen.

## 10. Sicherheitsregeln

- Keine Secrets im Repository, Staging, Client oder Actions-Log.
- `.env` wird ausschließlich hostlokal angelegt.
- Kein pauschales `777`; nur notwendige Runtimepfade erhalten Schreibrechte.
- PHP-Core und Runtime liegen außerhalb von `public_html`.
- Admin/API-Fehler geben keine Stacktraces oder internen Dateipfade aus.
- Uploadverzeichnisse erlauben keine PHP-Ausführung.
- Cleanup arbeitet nur mit exakt validierten Zielpfaden und bewahrt cPanel-/Zertifikatsverzeichnisse.
- Bestehender FTPS-Zugang und zugehörige Secrets dürfen durch diese Migration nicht gelöscht werden.

## 11. Tests und Abnahme

### Repositorytests

- Staging enthält nur die je Modus erlaubten Dateien.
- Web-App enthält keine PHP-/Secretdateien.
- Admin-Artefakt ist ohne `/app/`-Dateiabhängigkeit vollständig.
- Server-Artefakt enthält keine öffentlichen Clientdateien.
- Pfadvalidierung lehnt `/`, leere Werte und unerwartete Ziele ab.
- `.well-known` und `.well-know` sind in allen Lösch-/Mirrorregeln ausgeschlossen.
- API-Basis ist konfigurierbar und besitzt keine feste Produktionsdomain.

### Live-Abnahme

- `/app/` zeigt die Shell auch bei nicht erreichbarer API.
- `/app-admin/api/status` liefert valides JSON.
- `/app-admin/` verweigert anonymen Zugriff.
- Setup ist nur autorisiert erreichbar und nach Aktivierung geschützt.
- MySQL-Verbindung und Migration funktionieren.
- Login, `auth/me`, Logout und CSRF funktionieren.
- Clientdateien, Antworten und Logs enthalten keine Secrets.
- direkter Zugriff auf privaten PHP-Core, Runtime und `.env` ist unmöglich.
- `.well-known` bleibt unverändert.

## 12. Rollback

Vor dem ersten Deployment werden Commit-SHA, Datenbanksicherungsstatus und Zielpfade protokolliert. Code-Rollback erfolgt durch erneutes Deployment eines bekannten Commits. Datenbankrollback erfolgt nur über getestete Migration-/Backupverfahren. FTP-Secrets und cPanel-Validierungsordner werden nicht als Rollbackmittel verändert.

## 13. Nichtziele dieser Migration

- kein zwingender Node-Produktionsprozess;
- keine sofortige Cross-Origin-Authentifizierung;
- keine neue Fachfunktion;
- keine Neugestaltung des Client-Cores;
- keine automatische Datenbanklöschung;
- keine Änderung oder Entfernung des bestehenden FTP-/FTPS-Zugangs.
