# NEUTRAL – Nächste Arbeiten

**Status:** AUSFÜHRUNGSREIHENFOLGE

**Geprüft:** 2026-09-03
**Ziel:** [`CORE-1.0.md`](CORE-1.0.md)

Diese Liste enthält nur offene, geordnete Arbeit. Sie darf keine neue Vision oder Architektur erfinden. Erledigte Pakete werden entfernt und in [`CHANGELOG.md`](CHANGELOG.md) dokumentiert.

## 1. Installation und Produktionssicherheit

- authentifizierten Login-/Logout-Durchlauf einschließlich produktiver Session- und CSRF-Cookies einmal mit Betreiberzugang abnehmen,
- PHP-Login-Drosselung einschließlich Retry-Zeit und Fail-closed-Verhalten im produktiven HTTPS-Betrieb datensparsam abnehmen,
- responsive Admin-CMS-Darstellung auf einem realen iPad beziehungsweise in Safari abnehmen,
- alle Admin-Hauptansichten und deren serverseitige Rechte mit dem Betreiberkonto produktiv abnehmen.

**Abnahme:** datierter End-to-End-Bericht für eine leere Installation.

## 2. Reproduzierbare Neuinstallation in neuem Repository und physischem Serverziel

**Arbeitsstand:** Bei der lokalen Task-6-Umsetzung durch **Codex (ChatGPT Work / GitHub-Connector)** blieben die folgenden externen Abnahmen ausdrücklich offen:

- einen neuen physischen Zielordner als eigenen HTTPS-DocumentRoot live installieren und getrennt von einem URL-Unterpfad abnehmen,
- PHP 8.x samt erforderlichen Erweiterungen sowie Apache-/LiteSpeed-Rewrite im neuen Zielhosting nachweisen; lokale `NICHT_GEPRUEFT`-Ergebnisse nicht als Freigabe behandeln,
- komplette leere Testinstallation in einem neuen physischen Document-Root und einer neuen Datenbank durchführen: Paket übertragen, `.env` hostlokal anlegen, Setup/Migration/Seed ausführen, Betreiber anmelden und Setup danach gesperrt nachweisen,
- denselben Ablauf zusätzlich unter einem URL-Unterpfad wie `/meine-app/` einschließlich API-, Asset-, SPA-, Login-, Session- und CSRF-Smoke-Tests ausführen,
- denselben Installationsablauf aus einem neu angelegten Testrepository reproduzieren und dokumentieren,
- den produktiven GitHub-Workflow vom nicht zertifikatsgültigen Alias auf den read-only bestätigten Host `server.cpprotect5.de` umstellen und das verifizierte Full-Stack-Paket in das ausdrücklich konfigurierte Ziel deployen; danach müssen `Web-App/`, `Server/`, Remoteinventar und HTTP-Smokes bestätigt werden. Die Hostnamenprüfung bleibt zwingend und finales CodeQL ist bereits bestanden.

**Abnahme:** Ein versionierter Commit kann ohne manuelle Codeänderung als neues Repository in einen frei gewählten physischen HTTPS-Document-Root sowie unter einen konfigurierten URL-Unterpfad installiert werden; der vollständige Ordner `Web-App/` und die produktiven Teile `Server/php/` sowie `Server/public/` bleiben getrennt erhalten und alle Smoke-/Sicherheitstests bestehen.

## 3. Modulvertrag vervollständigen

- allgemeine PHP-Routen- und Service-Registrierung je Modul,
- versionierte Modul-SQL-Migrationen mit Fehler- und Rollbackstrategie,
- serverseitig erzwungene Rechte und quantitative Limits,
- sichere Deinstallation ohne Verlust fremder Daten,
- Kompatibilitäts- und Versionsprüfung.

**Abnahme:** GPS und ein zweites fachlich unabhängiges Referenzmodul bestehen denselben Lifecycle- und Sicherheitstest.

## 4. Sichere Provider und Administration

- serverseitigen Provideradaptervertrag definieren,
- Secrets geschützt speichern und ausschließlich serverseitig verwenden,
- Provider im Admin anlegen, testen, auswählen und wechseln,
- dem Client nur bereinigte Funktionskonfiguration liefern.

**Abnahme:** Wechsel zwischen zwei Testprovidern ohne Clientänderung oder Secret-Leak.

## 5. Portabilität und Core-1.0-Abnahme

- Backup, Restore, Update und Rollback reproduzierbar machen,
- Serverumzug auf eine leere kompatible Umgebung testen,
- erzeugtes Installationspaket, Manifest und Prüfsummen gegen den Quellcommit verifizieren,
- Neuinstallation, Update, Backup/Restore und Umzug jeweils als automatisierten oder exakt reproduzierbaren Abnahmelauf dokumentieren,
- alle Kriterien aus `CORE-1.0.md` gegen Code, Tests und Live-Bericht prüfen.

**Abnahme:** `STATUS.md` enthält für Core 1.0 ausschließlich `VORHANDEN`; Release wird als **BESTANDEN** markiert.
