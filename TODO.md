# NEUTRAL – Nächste Arbeiten

**Status:** AUSFÜHRUNGSREIHENFOLGE

**Geprüft:** 2026-09-01
**Ziel:** [`CORE-1.0.md`](CORE-1.0.md)

Diese Liste enthält nur offene, geordnete Arbeit. Sie darf keine neue Vision oder Architektur erfinden. Erledigte Pakete werden entfernt und in [`CHANGELOG.md`](CHANGELOG.md) dokumentiert.

## 1. Installation und Produktionssicherheit

- ~~leere PHP-/MySQL-Neuinstallation auf dem bestätigten Shared Hosting durchführen~~ (am 2026-09-02 nachgewiesen),
- öffentliche Pfade, Login, Logout, CSRF, Cookies, HTTPS und Dateischutz live prüfen,
- Secretfreiheit von Client, übrigen Antworten und Logs vollständig prüfen,
- API-Version 1 festschreiben.

**Abnahme:** datierter End-to-End-Bericht für eine leere Installation.

## 2. Modulvertrag vervollständigen

- allgemeine PHP-Routen- und Service-Registrierung je Modul,
- versionierte Modul-SQL-Migrationen mit Fehler- und Rollbackstrategie,
- serverseitig erzwungene Rechte und quantitative Limits,
- sichere Deinstallation ohne Verlust fremder Daten,
- Kompatibilitäts- und Versionsprüfung.

**Abnahme:** GPS und ein zweites fachlich unabhängiges Referenzmodul bestehen denselben Lifecycle- und Sicherheitstest.

## 3. Sichere Provider und Administration

- serverseitigen Provideradaptervertrag definieren,
- Secrets geschützt speichern und ausschließlich serverseitig verwenden,
- Provider im Admin anlegen, testen, auswählen und wechseln,
- dem Client nur bereinigte Funktionskonfiguration liefern.

**Abnahme:** Wechsel zwischen zwei Testprovidern ohne Clientänderung oder Secret-Leak.

## 4. Portabilität und Core-1.0-Abnahme

- Backup, Restore, Update und Rollback reproduzierbar machen,
- Serverumzug auf eine leere kompatible Umgebung testen,
- Installationspaket erzeugen und dokumentieren,
- alle Kriterien aus `CORE-1.0.md` gegen Code, Tests und Live-Bericht prüfen.

**Abnahme:** `STATUS.md` enthält für Core 1.0 ausschließlich `VORHANDEN`; Release wird als **BESTANDEN** markiert.
