# CURRENT TASK — Core-Freeze: User/Account/Lizenz und Live-Fixes

**Quelle:** `CODEX.md`, 2026-09-09
**Status:** ABGESCHLOSSEN · DEVICE RETEST REQUIRED · HOST ACTION REQUIRED
**Grenzen:** Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace-/Community-/Messaging-Feature; P1/P4 und bestätigte Session-Deduplizierung erhalten; keine Secrets oder destruktiven Produktionsaktionen.

## Verbindliche Arbeitsliste

1. [x] Mit `origin/main` synchronisieren und alle vorhandenen Pflicht-, Architektur-, Status-, Install-/Deployment- sowie betroffenen Implementierungs-/Testdateien vollständig lesen; fehlende `Modules.md`, `Install-README-User.md` und `README.md` als nicht vorhandene Referenzen festgestellt.
2. [x] Capture prüfen: Abschnitte 1–19 einschließlich Test-, Deploy- und Wahrheitsvertrag sind vollständig abgebildet; **`CODEX.md == CURRENT-TASK-Anforderungen` — bestanden.**
3. [x] Bestätigte Session-Deduplizierung erhalten; UTC/ISO serverseitig bewahren, Session-/Userzeiten lokal rendern und iPad/Chrome ohne `MacIntel` bzw. falsche macOS-Gewissheit darstellen.
4. [x] GPS vollständig über den vorhandenen I18N-Vertrag einsprachig machen und Öffnen/Teilen-Texte übersetzbar halten.
5. [x] OSM-Karte test-first tatsächlich zoombar/verschiebbar machen, Marker und Attribution erhalten, externe Navigation nur über Button, keine Trackingfunktion.
6. [x] Responsive Settings-Unter-Navigation mit App Areas, Navigation, Privacy & Sharing und Profile ergänzen; exakt einen lokalen Active-State, sinnvollen Default und keine globale Nav-Erweiterung.
7. [x] Settings-Save auf der aktiven Unterseite halten, Erfolg kurz melden und Reset-Texte benutzerfreundlich/lokalisiert formulieren.
8. [x] Globale Navigation so korrigieren, dass genau die tatsächlich dargestellte globale View aktiv ist und Login nie parallel zu Start/GPS/Settings aktiv bleibt.
9. [x] Neutrales Profile-/Privacy-Fundament gemäß `USER-ACCOUNT-LICENSE-MODEL.md` implementieren: Username, Passwortwechsel, optionale E-Mail/Login, optionale Profilfelder und default-off feldweise Organisationsfreigaben, serverseitig autoritativ.
10. [x] Einheitliche Passwortpolitik für Anlage/Initial-/Änderungs-/Resetpfade durchsetzen: 8–25 Zeichen, keine Leerzeichen, keine Kompositionspflicht, niemals Klartext speichern/loggen/erneut anzeigen; UI und `Security.md` angleichen.
11. [x] User Management vereinfachen/erweitern: Username+Initial Password+Role verpflichtend, E-Mail/Display Name optional, primär Active/Blocked, lokale Created/Last Activity, Used/Allowed Devices und Session-Drill-down.
12. [x] Generisches Package-/Entitlement-/License-/Organization-Datenmodell samt Capability-/Modulfreigaben, quantitativen/unlimited Limits und serverautoritativem available/locked/hidden-Vertrag implementieren; keine Verkaufsnamen.
13. [x] Delegierten License/Organization Admin strikt auf eigene Lizenz, User, Seats/Geräte und freigegebene Profildaten begrenzen; keine globalen Rollen/Corepermissions/Server/Backups/Audit/fremden Lizenzen.
14. [x] Device-Limits an Lizenz/Entitlement binden: Used/Allowed, 1-Gerät-Ablehnung, Revoke-Freigabe, unlimited und strikt scoped Organization-Admin testen; UA/Plattform nie Identität.
15. [x] Datensparsame serverkontaktbasierte Installationsstatistik (total/heute/7/30 Tage, anonym/authentifiziert) ohne IP-Historie, Fingerprint, GPS oder erfundene Offlinezahlen ergänzen.
16. [x] Nur notwendige generische User-Mediengrundlage ergänzen: Entitlement/Permission, sicher validierter Bildupload/Größenlimits, pending/approved/rejected/deleted, Reason/Notiz/Historie/Zähler, kein Auto-Publishing; anonyme Uploads verboten, lokale Bilder lokal.
17. [x] Messaging/Marketplace nur als Zukunftsvertrag prüfen/dokumentieren; keine UI, Community oder spekulativen Hooks implementieren.
18. [x] Core-Freeze erneut gegen Auth/User, Profile/Privacy, Roles/Permissions, Entitlements/Licenses, Device Limits, scoped Administration, Modulzustände, responsive Settings, Installationsmetriken und Medienmoderation auditieren.
19. [x] Echte JS-/DOM-/PHP-/DB-Integrationstests für sämtliche CODEX-Mindestfälle test-first ergänzen; reine Source-RegEx nicht als Abnahme verwenden.
20. [x] Vollständige Suite, PHP-Lint, JS-Syntax, `git diff --check`, Produktionspaket sowie Secret-/Artefaktprüfung ausführen.
21. [x] `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `UI-UX.md`, `ModuleCreation.md`, Status-/Todo-/Changelog-Dokumente und vollständigen `CHATGPT.md`-Bericht wahrheitsgemäß aktualisieren.
22. [x] Implementierung nach `main` übertragen; CodeQL `34340369880` und FTPS `34340370687` terminal erfolgreich; Deploymentrevision, idempotente Migration `0005`, `migrationsReady:true` und sicherer read-only Produktionssmoke bestätigt. Abschlussbericht separat übertragen und danach `HEAD == origin/main`, sauberer Tree und GitHub-`CHATGPT.md` abschließend verifizieren.
23. [x] Kurze iPad/Chrome-Retestliste liefern; nicht real geprüfte Flächen als `DEVICE RETEST REQUIRED`, Hostabhängiges als `HOST ACTION REQUIRED` kennzeichnen und nichts unbelegt `LIVE BESTANDEN` nennen.
