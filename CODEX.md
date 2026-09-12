# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** ARCHITECTURE RECOVERY – OFFLINE-FIRST GPS START  
**Datum:** 2026-09-12  
**Core Freeze:** NICHT erklärt

# ZUERST LESEN

1. `docs/superpowers/specs/2026-09-12-offline-first-module-start-design.md`
2. `docs/superpowers/plans/2026-09-12-offline-first-module-start.md`
3. `VISION.md`
4. `Architecture.md`
5. `CORE-1.0.md`
6. danach aktuellen Code und relevante Tests.

Der Betreiber hat die Architekturentscheidung ausdrücklich bestätigt. Dieser Auftrag ersetzt die bisherige Annahme, GPS müsse vor seiner sichtbaren Navigation auf einen autoritativen Online-Catalog-/RBAC-Request warten.

---

# VERBINDLICHER PRODUKTVERTRAG

## GPS

GPS ist das **öffentliche Offline-First-Basismodul** und technische Referenzmodul.

Wenn GPS administrativ **installiert + aktiviert** ist:

- beim ersten stabilen Render sofort sichtbar;
- kein Serverroundtrip vor der Anzeige;
- keine User-Rollenprüfung für Sichtbarkeit/Nutzung;
- keine User-Permission-Prüfung für Sichtbarkeit/Nutzung;
- keine Package-/Entitlement-Prüfung;
- Admin/Developer/User/Viewer/anonymous unterscheiden sich für die reine GPS-Basis-Sichtbarkeit nicht;
- kein nachträgliches Einblenden nach 2–4 Sekunden;
- kein dadurch ausgelöstes doppeltes `Welcome to Neutral`-Rendering.

Admin kontrolliert weiterhin Installation, Aktivierung/Deaktivierung und Modulkonfiguration. Deaktiviertes GPS darf nicht erscheinen.

Serverseitig geschützte Aktionen bleiben selbstverständlich serverseitig geschützt. Lokale Sichtbarkeit erteilt keine Serverrechte.

## Serverabgleich

Serverabgleich erfolgt nach dem stabilen initialen UI-Render im Hintergrund. Er darf den lokal validierten öffentlichen Offline-First-Zustand aktualisieren, aber nicht die Startseite mehrfach komplett neu rendern.

## Profile / Moderation

Diese bleiben permission-sensitive authentifizierte Module. **Die GPS-Entscheidung nicht auf sie übertragen.**

Profile ist Account-Modul, kein kommerzielles Package-Modul. Active + effektive `profile.view/profile.update` müssen nach authentifizierter Discovery zu einem erreichbaren Profile-Bereich führen.

---

# WARUM JETZT ARCHITEKTUR-RECOVERY STATT FIX NR. 4

Mehrere technische Reparaturen am Online-Catalog-/Race-Pfad waren testseitig grün, aber Production blieb falsch:

- GPS anonym erst nach ca. 3–4 Sekunden;
- `Welcome to Neutral` blinkt/rendert währenddessen etwa zweimal;
- nach Ralf/Tester Login GPS teilweise erst nach manuellem Reload;
- Profile weiterhin nicht sichtbar;
- Admin/Developer hatten Catalog-/Module-Load-Probleme;
- realer 10s Request-Timeout trat auf.

Die Dokumentation enthielt zugleich den älteren Zielvertrag `UI zuerst → notwendiger minimaler Core → Hintergrundinitialisierung`. Die neue bestätigte Spec löst diesen Widerspruch eindeutig zugunsten des Offline-First-Starts.

Nicht erneut weitere Race-Patches auf den bestehenden Online-First-Sichtbarkeitspfad stapeln. Den Vertrag strukturell vereinfachen.

---

# AUFTRAG

Führe den Implementation Plan task-by-task aus.

Besonders:

1. Aktuellen Startpfad vollständig gegen die Spec auditieren.
2. Failing Verhaltenstests **vor** der Änderung erstellen.
3. Bestehenden lokalen Modul-/Cache-/Registry-Vertrag wiederverwenden/sauber erweitern; keine zweite produktspezifische Parallelplattform bauen.
4. Einen sanitisierten, versionierten lokalen Public/Offline-Aktivierungszustand verwenden, aus dem GPS sofort sicher registriert/renderbar ist.
5. GPS User-RBAC-/Permission-/Package-/Entitlement-Gating aus dem Basissichtbarkeitspfad entfernen.
6. Admin Lifecycle-Kontrolle erhalten.
7. Ersten sichtbaren Render stabil/einmalig machen.
8. Server-Catalog anschließend im Hintergrund reconciliieren.
9. Authenticated permission-sensitive catalogs strikt getrennt halten.
10. Catalog-Fehler niemals als erfolgreichen leeren Katalog behandeln.
11. Profile nach Stabilisierung des Startpfads end-to-end prüfen/reparieren.
12. Bereits bestätigte Module Details Save/Back-Funktion nicht regressieren.

---

# DOKUMENTATIONSKONSISTENZ

Die vorhandenen MD-Dateien enthalten historischen IST-Text, der inzwischen widersprüchlich sein kann. Während der Implementierung gezielt bereinigen:

- `Architecture.md`: Offline-First/Public-Module-Startvertrag und aktueller IST nach Implementierung.
- `VISION.md`: bestätigte GPS-Offlinereferenz präzisieren; Vision bleibt oberste Autorität.
- `CORE-1.0.md`: lokaler Public/Offline-Modulzustand als generischer Core-Vertrag, nicht als GPS-Sondercode.
- `API.md`: Server-Catalog ist Synchronisations-/authentifizierter Projektionspfad, nicht Voraussetzung für initiale lokale GPS-Sichtbarkeit.
- `UI-UX.md`: ein stabiler First Render; kein Welcome-Flackern; GPS sofort.
- `STATUS.md`, `CURRENT-TASK.md`, `CHATGPT.md`: nur tatsächlichen neuen IST-Stand dokumentieren.
- `CHANGELOG.md`: Root Cause und Vertragskorrektur.

Keine historische Aussage löschen, wenn sie als Historie sinnvoll ist; aber klar datieren/überholen, sodass kein Agent sie als aktuellen Zielvertrag missversteht.

---

# TESTVERTRAG

Mindestens:

- Cold/frischer Start mit delayed/unavailable server catalog → aktiviertes GPS im ersten stabilen Render.
- Offline-Start → GPS lokal verfügbar.
- Kein zweites Full-Render von Welcome durch Discovery.
- Ralf/Tester Login → GPS bleibt sichtbar ohne Reload.
- Developer/Admin Login → GPS bleibt sichtbar ohne RBAC-Abhängigkeit.
- GPS deaktiviert → nach autoritativer Synchronisierung nicht mehr in zukünftigen Starts.
- public/offline cache enthält keine Session-/Permission-Geheimnisse.
- Profile/Moderation bleiben permission-sensitive.
- Profile active + permitted → tatsächlicher DOM-Einstieg → öffnen → speichern.
- Catalog failure retryable, kein empty-success.
- Module Details separate view + Save/Back bleibt PASS.
- Settings Save Dialog bleibt/ist PASS.
- Theme Select one-change und Tabellenborder regressionsfrei.
- Vollsuite, JS-Syntax, PHP-Lint, `git diff --check`, Production Package.

---

# DEPLOYMENT

- sinnvolle kleine Commits;
- Push main nach Tests;
- CodeQL + FTPS terminal abwarten;
- read-only Production Smoke;
- ein direkter `curl`-403 aus dem Codex-Arbeitscontainer durch vorgeschalteten Connect-Proxy ist **kein Neutral-Produktionsfehler**, wenn der unabhängige GitHub-Actions-Production-Smoke denselben Endpoint erfolgreich prüft;
- keine Secrets;
- kein Core Freeze.

# OPERATOR-RETEST DANACH

1. frischer Inkognito-Root: GPS sofort, kein Reload, kein Welcome-Doppelblinken;
2. Ralf Login: GPS bleibt sofort sichtbar, Profile erscheint wenn active/permitted;
3. Tester entsprechend;
4. Developer/Admin: GPS sichtbar;
5. Offline-Test;
6. Profile öffnen/speichern;
7. Settings Save Dialog;
8. danach Moderation und übrige offene Admin-Retests.