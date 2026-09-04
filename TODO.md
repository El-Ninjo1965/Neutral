# NEUTRAL – Nächste Arbeiten

**Status:** AUSFÜHRUNGSREIHENFOLGE

**Geprüft:** 2026-09-04
**Ziel:** [`CORE-1.0.md`](CORE-1.0.md)

Diese Liste enthält nur offene, geordnete Arbeit. Sie darf keine neue Vision oder Architektur erfinden. Erledigte Pakete werden entfernt und in [`CHANGELOG.md`](CHANGELOG.md) dokumentiert.

## 1. Installation und Produktionssicherheit

- ersten GitHub-FTPS-Lauf mit dem permanenten Post-Deployment-Smoke als vollständig grün belegen; der Smoke selbst ist test-first implementiert und prüft ausschließlich lesend Root, Rewrite, Adminschutz, PHP-Status, Viewer-GPS, Modulkatalog, internen Dateischutz und den Referenzmodulvertrag,
- produktiven Logout samt Sitzungsende sowie einen negativen CSRF-Fall einmal mit Betreiberzugang abnehmen; der produktive Login, die fortbestehende Sitzung und sämtliche 15 Admin-Hauptansichten sind bereits rein lesend bestätigt,
- PHP-Login-Drosselung einschließlich Retry-Zeit und Fail-closed-Verhalten im produktiven HTTPS-Betrieb datensparsam abnehmen,
- responsive Admin-CMS-Darstellung auf einem realen iPad beziehungsweise in Safari abnehmen,
- die im Konto-Home sichtbaren zusätzlichen `Server`-/`Web-App`-Einträge gegen `public_html` abgrenzen; nur eindeutig dem kurzzeitigen Lauf `33802090900` zuordenbare Artefakte nach separater Freigabe sichern oder entfernen, keine pauschale Löschung,

**Abnahme:** datierter End-to-End-Bericht für eine leere Installation.

## 2. Reproduzierbare Neuinstallation in neuem Repository und physischem Serverziel

**Arbeitsstand:** Bei der lokalen Task-6-Umsetzung durch **Codex (ChatGPT Work / GitHub-Connector)** blieben die folgenden externen Abnahmen ausdrücklich offen:

- einen neuen physischen Zielordner als eigenen HTTPS-DocumentRoot live installieren und getrennt von einem URL-Unterpfad abnehmen,
- PHP 8.x samt erforderlichen Erweiterungen sowie Apache-/LiteSpeed-Rewrite im neuen Zielhosting nachweisen; lokale `NICHT_GEPRUEFT`-Ergebnisse nicht als Freigabe behandeln,
- komplette leere Testinstallation in einem neuen physischen Document-Root und einer neuen Datenbank durchführen: Paket übertragen, `.env` hostlokal anlegen, Setup/Migration/Seed ausführen, Betreiber anmelden und Setup danach gesperrt nachweisen,
- denselben Ablauf zusätzlich unter einem URL-Unterpfad wie `/meine-app/` einschließlich API-, Asset-, SPA-, Login-, Session- und CSRF-Smoke-Tests ausführen,
- denselben Installationsablauf aus einem neu angelegten Testrepository reproduzieren und dokumentieren,
- den bereits erfolgreich ausgerollten Full-Stack-Stand zusätzlich mit mutierenden, kontrollierten Smokes für Logout und negativen CSRF abnehmen; öffentlicher Client, Adminschutz, Asset, Status-API und interner Dateischutz sind durch den rein lesenden HTTP-Lauf `33808897301` bestätigt, Host, zwingende Hostnamenprüfung, geschütztes Ziel, `Web-App/`, `Server/` und Read-only-Remoteinventar durch die Läufe `33802485499` und `33803384719`.

**Abnahme:** Ein versionierter Commit kann ohne manuelle Codeänderung als neues Repository in einen frei gewählten physischen HTTPS-Document-Root sowie unter einen konfigurierten URL-Unterpfad installiert werden; der vollständige Ordner `Web-App/` und die produktiven Teile `Server/php/` sowie `Server/public/` bleiben getrennt erhalten und alle Smoke-/Sicherheitstests bestehen.

## 3. Sichere Provider und Administration

- serverseitigen Provideradaptervertrag definieren,
- Secrets geschützt speichern und ausschließlich serverseitig verwenden,
- Provider im Admin anlegen, testen, auswählen und wechseln,
- dem Client nur bereinigte Funktionskonfiguration liefern.

**Abnahme:** Wechsel zwischen zwei Testprovidern ohne Clientänderung oder Secret-Leak.

## 4. Portabilität und Core-1.0-Abnahme

- Backup, Restore, Update und Rollback reproduzierbar machen,
- Serverumzug auf eine leere kompatible Umgebung testen,
- erzeugtes Installationspaket, Manifest und Prüfsummen gegen den Quellcommit verifizieren,
- Neuinstallation, Update, Backup/Restore und Umzug jeweils als automatisierten oder exakt reproduzierbaren Abnahmelauf dokumentieren,
- alle Kriterien aus `CORE-1.0.md` gegen Code, Tests und Live-Bericht prüfen.

**Abnahme:** `STATUS.md` enthält für Core 1.0 ausschließlich `VORHANDEN`; Release wird als **BESTANDEN** markiert.
