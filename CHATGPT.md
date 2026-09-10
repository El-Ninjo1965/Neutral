# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-10
**Status:** IMPLEMENTIERT · `BACKUP CONTRACT COMPLETE` CODE-/ISOLIERT VERIFIZIERT · KEIN PRODUKTIONS-RESTORE

## Ergebnis

Backup v2 sichert die 21 Coretabellen, alle generisch über installierte Modulmanifeste deklarierten Tabellen und verwaltete Medienbinärdateien. Medien liegen nur als logische relative Pfade mit Größe/SHA-256/Base64 im vollständig AES-256-GCM-verschlüsselten Payload; Symlinks, Traversal, unbekannte Namen, Integritätsfehler, mehr als 100 MiB und nicht leere Restoreziele werden abgelehnt. V1 bleibt als historischer Core-only-Teilumfang lesbar. Code, `.env`/Secrets, Logs, Caches, Sessions und Login-Attempts bleiben bewusst ausgeschlossen.

Der isolierte Test bestätigt Core-/Modultabellen und echte Binärdatei bytegenau, Sessionleerung, falschen Key, Manipulation, fehlende Komponenten, Versionen, Limit und Rollback. Kein Produktions-Restore und keine Produktionsmutation erfolgten.

Birthday Save übernimmt jetzt das autoritativ zurückgelieferte Profil und meldet nur Erfolg, wenn das ISO-Datum bestätigt ist; Profilcache wird bei Identitätswechsel/Logout verworfen. Day/Month/Year ist auf iPad kompakt horizontal und bricht nur auf kleinen Viewports um. Anonym werden nur App Areas und Navigation gerendert; Privacy & Sharing/Profile erscheinen erst nach Login und verschwinden sofort beim Logout.

## Wahrheitsgrenze / Betreiber-Retest

`BACKUP CONTRACT COMPLETE` bezeichnet Code und isolierten Vertrag, nicht automatisch Core Freeze. Automatic Backup/Cron und weitere reale Host-/Move-Gates bleiben offen. Betreiber prüft: anonym/eingeloggt Tabs; Birthday Save→neu öffnen→Reload→Relogin→Delete und iPad-Layout; neues V2-Backup erstellen/downloaden. Restore weiterhin ausschließlich auf separatem Staging, niemals Produktion.


## Deployment

Implementation and documentation were pushed to `origin/main`. CodeQL and FTPS deployment completed successfully; the bounded read-only production smoke confirmed the deployed revision and `migrationsReady:true`. No production restore was run.
