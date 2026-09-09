# CURRENT TASK — P0 Live-Auth/GPS und Core-Freeze-Restlücken

**Quelle:** `CODEX.md`, 2026-09-09
**Status:** CODE-SEITIG ABGESCHLOSSEN · DEVICE RETEST REQUIRED · HOST/OPERATOR CHECK REQUIRED
**Grenzen:** Keine CatchTrack-Fachlogik, kein GPS Pro, Marketplace, Community oder Messaging; keine Secrets oder destruktiven Produktionsaktionen; P1/P4, Offline-First, I18N, Profile/Privacy, Entitlements und Session-Deduplizierung erhalten.

## Verbindliche Arbeitsliste

1. [x] Mit `origin/main` synchronisieren; Pflichtdokumente, Deployment-/Installationsverträge sowie betroffene Implementierungs- und Testdateien vollständig lesen.
2. [x] Capture geprüft: Die sechs Auftragsblöcke, Wahrheits-, Test-, Regression-, Deployment- und Übergabeverträge aus `CODEX.md` sind nachfolgend vollständig abgebildet — **`CODEX.md == CURRENT-TASK-Anforderungen` bestanden.**
3. [x] P0 User-Login vom ausgelieferten Shell-/Asset-/Rewrite-Vertrag über `ApiClient`, Handler, PHP-Bootstrap/Migrationen und Session/CSRF reproduzieren; Root Cause beheben; gültige/falsche Credentials und Deduplizierung echt integrieren.
4. [x] P0 Admin-Login separat über die ausgelieferte `admin.php`-Auth-Shell, gemeinsamen `ApiClient`, Admin-Cookie-/CSRF-Scope und PHP-Router integrieren; Root Cause beheben und Scope-Trennung erhalten.
5. [x] GPS-Web-Mercator test-first gegen unabhängige Referenzwerte einschließlich `7.105691769982597, 125.63707611554916` korrigieren; Mittelpunkt/Marker bei Zoom, Pan, Refresh, DPR und responsiver Größe konsistent halten.
6. [x] `In OpenStreetMap öffnen` sicher und ohne vorab geöffnetes `about:blank` in neuem Tab/Fenster öffnen; eingebettete Karte, Google Maps und System-Share nicht regressieren.
7. [x] Delegierten License-/Organization-Admin-Vertrag serverautoritativ vervollständigen: nur eigene Lizenz; scoped block/remove; Installationen listen/revoken; Used/Allowed/Last Activity; ausschließlich freigegebene Profilfelder; CSRF/Audit/Seat- und Device-Limits; fremde Lizenz und globale Adminflächen fail-closed.
8. [x] Neutrale Medien-/Moderationsgrundlage end-to-end vervollständigen: entitlement-/permission-geschützter Bild-Upload, sichere nicht ausführbare Ablage/kontrollierte Delivery, `pending`, approve/reject/delete mit Reason/Notiz/Historie, Ownership und sichere Userprojektion; kein Auto-Publishing/keine KI.
9. [x] Echte PHP-/JS-/DOM-/DB-Integrationstests für alle Mindestfälle ergänzen; widersprechende Alt-Tests verbessern; keine reine Source-RegEx-Abnahme.
10. [x] Vollständige Regression der Auth-/Session-/Passwort-/Profile-/Settings-/GPS-/Entitlement-/Device-/License-/Media-/P1-/P4-/Offline-Verträge sowie PHP-Lint, JS-Syntax und `git diff --check` ausführen.
11. [x] Produktionspaket vollständig bauen und auf Manifest, neue Dateien, Secrets und Artefakte prüfen.
12. [x] Architektur-/API-/DB-/Security-/Functions-/Module-/Status-/Todo-/Changelog-/Workflow-Dokumentation wahrheitsgemäß aktualisieren und falsche Freeze-/Erledigt-Aussagen korrigieren.
13. [x] Nach `main` committen/pushen; CodeQL/FTPS/weitere CI terminal abwarten; Deploymentrevision, `migrationsReady:true`, read-only Produktionssmoke, `HEAD == origin/main` und sauberen Tree verifizieren.
14. [x] Vollständigen Abschlussbericht nach `CHATGPT.md` übertragen und dessen aktuellen Inhalt auf GitHub `main` verifizieren.
15. [x] Vier Livefehler und administrativ testbare License-/Media-Flows in kurzer Betreiber-Retestliste als `DEVICE RETEST REQUIRED` kennzeichnen; Hostabhängiges als `HOST ACTION REQUIRED`; nichts unbelegt `LIVE BESTANDEN` nennen.
