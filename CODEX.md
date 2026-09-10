# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER IMPLEMENTIERUNGSAUFTRAG – LIVEFEHLER BEHEBEN + MODULE ADMINISTRATION KLASSIFIZIEREN  
**Datum:** 2026-09-11

# Ziel

Vor dem Field-Notes-Freeze-Proof müssen die aktuell real festgestellten Livefehler behoben und die Module Administration um die neue, rein deklarative Trennung in User Modules und System Modules ergänzt werden.

Verbindlich bleibt:

> **Core = nur zwingend notwendige technische Mechanismen. Konkrete Funktionen = Module.**

Keine unnötigen Modulabhängigkeiten erzeugen. Keine zweite Modul-Runtime einführen. User Modules und System Modules verwenden denselben technischen Modulvertrag.

Der neue Betreiberinput steht zusätzlich in `PRODUCT-DECISIONS-2026-09-11-FOLLOWUP.md` und ist vollständig zu lesen.

Referral/Rewards ist dort als zukünftiges optionales Systemmodul dokumentiert, wird in diesem Lauf **nicht implementiert** und darf den Freeze-Pfad nicht aufblähen.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: sämtliche Markdown-Dateien, insbesondere `DOCUMENTATION.md`, `CHATGPT.md`, `CURRENT-TASK.md`, `CODEX.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `Architecture.md`, `ModuleCreation.md`, `SYSTEM-MODULES.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `BACKUP-CONTRACT.md`, `PRODUCT-DECISIONS-2026-09-11.md`, `PRODUCT-DECISIONS-2026-09-11-FOLLOWUP.md`.
3. Relevanten Code lesen, bevor Änderungen begonnen werden: Module Runtime/Registry/Manager, Module Admin UI, Profile, Media, User/Login, Device-Limit-Auflösung, User Management, Package/License Resolution, Offline/Precache.
4. Keine CatchTrack-spezifische Fachlogik in Core/Systemmodule.
5. Keine Secrets/PII ausgeben oder committen.
6. Keine destruktiven Produktionsaktionen, keinen Production-Restore.

---

# 2. Profile Activation – Livefehler beheben

Realer Betreiberbefund:

- `profile` ist registriert/inaktiv;
- `profile.view` und `profile.update` sind vorhanden;
- Aktivierung über Module Administration endet mit `Activation failed: Internal Server Error`;
- Profile/Privacy sind dadurch im User-UI nicht verfügbar.

Aufgabe:

- Root Cause vollständig ermitteln;
- serverseitigen 500 beseitigen, nicht nur UI-Fehler kaschieren;
- Lifecycle Install/Register/Activate/Deactivate/Re-activate gegen tatsächlichen Runtimevertrag verifizieren;
- Daten bei Deaktivierung erhalten;
- Profile ohne harte Abhängigkeit zu Media/Sharing betreibbar halten;
- fehlende optionale Enhancements sauber degradieren;
- keine Core-Pfade so umbauen, dass Profile wieder Pflicht wird.

Abnahme:

- Profile lässt sich aktivieren;
- deaktivieren;
- erneut aktivieren;
- User-Settings zeigt Profile/Privacy nur bei aktiver Capability;
- keine 500/JS-Fehler;
- vorhandene Profildaten bleiben erhalten.

---

# 3. Media & Upload – Install `Load failed` beheben

Realer Betreiberbefund:

- `media` startet als Discovered / Not registered;
- `Install` endet mit `Install failed: Load failed`.

Aufgabe:

- Loader-/Manifest-/Serverentry-/Runtime-Ursache ermitteln;
- Install/Register sauber ermöglichen;
- anschließend Activate/Deactivate/Re-activate verifizieren;
- keine neue harte Abhängigkeit zu Profile oder anderen Modulen erzeugen;
- vorhandene generische Upload-/Backup-Primitives nur über saubere Modulgrenzen nutzen.

Noch keine vollständige Media-Produkt-UI erfinden, falls der derzeitige Vertrag nur Lifecycle/Service-Scaffolding vorsieht. Ziel dieses Schritts ist ein belastbarer Modul-Lifecycle ohne falschen Funktionsclaim.

---

# 4. Unlimited Devices – `2 of 0` und Loginblock beheben

Realer Betreiberbefund:

- User hatte wirksam direkt Package `Admin`;
- Package `Default devices per user` = Unlimited;
- bei zwei aktiven Sessions wurde Login wegen überschrittenem Device-Limit blockiert;
- UI zeigte sinngemäß `2 of 0 sessions`.

Aufgabe:

- Root Cause in Entitlement-/Package-/License-/User-Limit-Auflösung finden;
- `unlimited` darf niemals semantisch in `0 allowed` umgewandelt werden;
- API, DB-Modell, Resolver, Sessionprüfung und UI müssen dieselbe Semantik verwenden;
- direkte User-Package-Zuordnung, License-Package-Priorität und Fallback nach License-Entfernung nicht regressieren;
- bestehende numerische Limits weiter korrekt erzwingen.

Tests mindestens:

- numeric limit 1/2/n;
- unlimited direct package;
- unlimited license package;
- explicit user override unlimited, sofern Vertrag unterstützt;
- fallback direct package nach License removal;
- UI darf bei unlimited nicht `0` anzeigen.

---

# 5. User Login Eye – real sichtbar machen

Realer Betreiberbefund nach mehreren Deployments:

- Admin-Login und andere Passwortfelder zeigen korrektes Eye;
- normaler User-Login zeigt auf iPad/Chrome weder normal noch privat einen Eye-Toggle.

Aufgabe:

- tatsächlichen Render-/Hydration-/Helper-/CSS-/DOM-/Offline-Cache-Pfad untersuchen;
- denselben zentralen Password-Visibility-Vertrag verwenden;
- kein separater Sonderhelper;
- echtes open/crossed eye SVG, ausreichend große Touchfläche, `aria-label`;
- Offline-/Precache-/Service-Worker-/Asset-Versionierung prüfen;
- sicherstellen, dass der Toggle nach dynamischem Login-Render wirklich im DOM erscheint und nicht durch CSS/Overlay verborgen wird.

Lokale Unit-Tests allein reichen hier nicht. Nach Deployment klar als Betreiber-Retest kennzeichnen.

---

# 6. User Management – List/Edit/Create auf Mobile trennen

Verbindliche UX-Entscheidung:

- Userliste und Edit/Create nicht gleichzeitig als lange gestapelte Blöcke zeigen;
- Klick auf `Edit` öffnet eine eigene Edit-Ansicht/State;
- Klick auf `Create new user` öffnet eigene Create-Ansicht/State;
- nach erfolgreichem Save zurück zur Userliste;
- Cancel/Back ebenfalls kontrolliert zurück;
- keine unnötige lange Scrollstrecke auf kleinen Screens;
- Desktop darf ebenfalls von der klareren Trennung profitieren;
- bestehende Create/Edit-Funktionalität, Package/License-Auswahl, Rollen, Device-Limits und Success-Modal nicht regressieren.

---

# 7. Module Visibility/Navigation pro Rolle – getrennt von Permissions

Verbindliche Architektur-/UX-Entscheidung:

- Permissions = technische Autorisierung;
- Visibility/Navigation = sichtbarer UI-/Navigationseinstieg;
- Klassifikation User/System = administrative Gruppierung;
- diese drei Ebenen nicht vermischen.

Aufgabe:

- in Module Administration/Details einen klaren Bereich `Visibility` / `Navigation` oder äquivalent einführen;
- mindestens rollenbezogene Steuerung für Admin, Developer, User, Viewer, soweit jeweilige Oberfläche relevant;
- ein Modul kann active sein und für einzelne Rollen keinen Navigationseintrag besitzen;
- unsichtbare Systemmodule müssen möglich bleiben;
- Visibility darf keinerlei Serverpermission erteilen;
- serverseitige Permissionprüfung unverändert autoritativ;
- bestehendes globales `presentation.userNavigation=false` oder äquivalent als Default/Fallback respektieren;
- persistente Konfiguration sauber namespacen/migrieren.

Nicht einfach `view`-Permission als Visibility missbrauchen.

---

# 8. Apps & Modules – User Modules / System Modules administrativ trennen

Neue verbindliche Betreiberentscheidung:

Unter `Apps & Modules` soll der Admin klar unterscheiden können zwischen:

1. **Apps**
2. **User Modules**
3. **System Modules**

Wichtig:

- dies ist **nur eine deklarative Klassifikation/Präsentation**;
- keine zweite Modul-Registry;
- keine zweite Lifecycle-Engine;
- keine unterschiedlichen Install-/Activate-Mechanismen;
- alle Module bleiben technisch gleichwertige Module.

Beispielklassifikation:

### User Modules
- GPS
- Profile
- Postbox
- später Field Notes

### System Modules
- Media & Upload
- Moderation
- Notifications
- Sharing & Visibility
- später Referral/Rewards

Aufgabe:

- saubersten Manifest-/Metadatenvertrag gegen bestehenden Validator bestimmen, z. B. `category: user|system` oder äquivalent;
- backward-compatible Default für bestehende Module definieren;
- Admin-UI entsprechend gruppieren/tabs/filtern;
- Mobile-First;
- Kategorie darf Navigation/Visibility nicht automatisch bestimmen;
- Kategorie darf Permissions nicht beeinflussen;
- bestehende Moduldetails/Lifecycleaktionen vollständig erhalten.

Dokumentation in `ModuleCreation.md`, `Architecture.md`, `SYSTEM-MODULES.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md` und Statusdateien aktualisieren.

---

# 9. Standalone-/Self-Test-Vertrag prüfen

GPS ist derzeit das einzige Modul mit deklariertem Standalone-Test.

Aufgabe:

- bestehenden Mechanismus gegen `ModuleCreation.md` prüfen;
- keine künstlichen Standalone-Tests erzwingen, wenn ein Systemmodul ohne Server/DB fachlich nicht sinnvoll testbar ist;
- dort, wo sinnvoll, standardisierten Testentry ermöglichen;
- klar dokumentieren, was ein Standalone-Test beweist und was nicht;
- Standalone-Test ersetzt keine Lifecycle-, API-, DB-, Permission- oder Liveprüfung.

Kein unnötiger Umbau der Modularchitektur nur für Testbuttons.

---

# 10. Referral / Rewards – nur dokumentiert lassen, nicht implementieren

`PRODUCT-DECISIONS-2026-09-11-FOLLOWUP.md`, `SYSTEM-MODULES.md` und `ROADMAP.md` enthalten den neuen Referral-/Rewards-Zielvertrag.

In diesem Lauf:

- nicht implementieren;
- keinen Core-Hook nur für Referral einbauen;
- keine Payment-Engine erfinden;
- nur sicherstellen, dass aktuelle Architekturentscheidungen eine spätere modulare Umsetzung nicht offensichtlich verhindern.

Falls ein tatsächlich universeller Extension Point fehlt, nur dokumentieren und begründen; nicht vorschnell Core aufblasen.

---

# 11. Bestehende erfolgreiche Lifecycle-Befunde nicht regressieren

Folgende Module bestanden real Install → Activate → Deactivate → Activate:

- Moderation
- Notifications
- Postbox
- Sharing & Visibility

Sie wurden anschließend wieder deaktiviert.

Nach Änderungen erneut lokal/regressiv prüfen. Produktions-Livebefund erst nach Betreiber-Retest aktualisieren.

GPS bleibt bestehendes aktives Referenzmodul und darf nicht regressieren.

---

# 12. Field Notes noch nicht bauen

Field Notes bleibt der **nächste separate Freeze-Proof nach diesem Reparaturlauf**.

Harte spätere Regel:

> Field Notes muss ohne Änderung bestehender Core-Dateien implementierbar sein.

Daher in diesem Lauf keine Field-Notes-Implementierung. Architektur nur so reparieren, dass der anschließende Beweistest sinnvoll durchgeführt werden kann.

---

# 13. Dokumentation aktualisieren

Nach tatsächlicher Implementierung alle betroffenen Dokumente synchronisieren, mindestens:

- `CHATGPT.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `CORE-1.0-READINESS.md`
- `Architecture.md`
- `ModuleCreation.md`
- `SYSTEM-MODULES.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `API.md`
- `Database.md`
- `Security.md`
- `Functions.md`
- `CHANGELOG.md`
- `WORKFLOW.md`

Keine Livefehler als bestanden markieren, bevor Betreiber-Retest erfolgt ist.

`PRODUCT-DECISIONS-2026-09-11-FOLLOWUP.md` bleibt als datierter Herkunftsnachweis erhalten, nachdem seine Inhalte in die autoritativen Dokumente überführt wurden.

---

# 14. Verifikation / Deployment

Gemäß `WORKFLOW.md`:

1. vollständige relevante Tests;
2. PHP-Lint;
3. JS-Syntax;
4. `git diff --check`;
5. Production package;
6. commit/push `main`;
7. CI/CodeQL/FTPS terminal abwarten;
8. `HEAD == origin/main`, sauberer Tree;
9. Deploymentrevision + `migrationsReady:true` prüfen;
10. Production-Smokes nur read-only;
11. keine destruktiven Produktionsaktionen;
12. `CHATGPT.md` mit kurzem tatsächlichem Endstand und Betreiber-Retestliste aktualisieren.

## Betreiber-Retestliste danach

1. Profile Install/Activate/Deactivate/Re-activate + Daten erhalten.
2. Media Install/Activate/Deactivate/Re-activate.
3. Unlimited Package/User Login mit mehreren Sessions.
4. User-Login-Eye auf iPad/Chrome normal + privat.
5. User Management List/Edit/Create auf kleinem Screen.
6. Module Visibility pro Rolle.
7. Apps / User Modules / System Modules Darstellung.
8. Moderation/Notifications/Postbox/Sharing Lifecycle Regression.
9. GPS Regression.
10. Danach Field Notes als separater Auftrag.

Keine automatische Core-Freeze-Erklärung in diesem Lauf.
