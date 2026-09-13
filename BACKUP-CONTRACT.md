# NEUTRAL Core 1.0 – Backup- und Restore-Vertrag

**Status:** VERBINDLICHER DETAILVERTRAG
**Geprüft:** 2026-09-13

Neue Backups verwenden ausschließlich den aktuellen V2-Vertrag. Der Restore-Pfad akzeptiert zusätzlich validierte V1-Backups zur Rückwärtskompatibilität; neue V1-Backups werden nicht erzeugt.

## Umfang

V2 sichert den verwalteten Core-Tabellensatz, Tabellen installierter Module aus deren validiertem Manifestvertrag und reguläre Dateien der verwalteten Medienablage. Der Core enthält keine fest verdrahteten Fachmodulnamen.

Der Core-Tabellensatz umfasst Rollen, Permissions, Benutzer, Zuordnungen, Settings, Modulzustand und Modulmigrationen, Setup/Audit/Release, Profile, Packages, Licenses, Installation Presence, Medienmetadaten und Schema-Migrationen.

Modultabellen nehmen ausschließlich über den generischen `database.tables`-Vertrag teil. Profile-Daten einschließlich verarbeitetem Avatarwert reisen als Tabellenwerte mit; Originaluploads werden nicht aufbewahrt.

## Ausschlüsse

Nicht enthalten sind Sessions, Loginversuche, Environment/Secrets, Anwendungscode, Git-Historie, Deploymentdateien, Logs, Caches, temporäre Dateien, nicht deklarierte Tabellen und Dateien außerhalb der verwalteten Medienablage. Nach Restore sind neue Logins erforderlich.

## Sicherheit

Das Artefakt ist authentifiziert verschlüsselt. Der Schlüssel bleibt hostlokal. Vor Restore werden Kryptografie, Payload, Schema, Tabellenvertrag sowie Medienpfade, Größen und Hashes geprüft. Fehler müssen vor Mutation erkannt werden.

Der Datenbankimport erfolgt transaktional. Medien werden vor Finalisierung in einem privaten Stagingbereich validiert und vorhandene Dateien nicht still überschrieben.

## Download, Upload und Pfad

Download und Upload sind Admin-/Permission-geschützt; Mutationen benötigen CSRF. Der Browser erhält keinen entschlüsselten Backupinhalt. Upload wird begrenzt und erst nach vollständiger Validierung übernommen.

Der Backup-Pfad ist hostlokale Konfiguration. Ein Path-Test ist nicht destruktiv und ist keine dauerhafte Health-Garantie.

## Restore-Abnahme

Ein Produktions-Restore ist kein Smoke-Test. Restore-Abnahmen erfolgen ausschließlich auf einer getrennten Test-/Staginginstallation mit separater Datenbank und separatem Storage.

Ein portabler Wiederaufbau benötigt ein kompatibles Release, passende hostlokale Konfiguration und Schlüssel, ausgeführte Migrationen, geschützten Storage und anschließende Prüfung der wiederhergestellten Daten. Nach erfolgreichem Restore wird die aktuelle Adminsession beendet.

## Klassifikation

Der aktuelle V2-Vertrag ist für den deklarierten verwalteten Core-, Modul- und Medienumfang **COMPLETE (code-/isoliert verifiziert)**. Aktueller Live-/Freeze-Stand steht ausschließlich in `STATUS.md`.