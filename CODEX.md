# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER DOKUMENTATIONS-KONSISTENZAUFTRAG – KEINE FEATURE-IMPLEMENTIERUNG  
**Datum:** 2026-09-11

# Ziel

Vor dem nächsten Implementierungsauftrag muss die gesamte Markdown-Dokumentation von Neutral gegen den tatsächlichen aktuellen Code, die jüngsten Architekturentscheidungen und die realen Betreiber-Livebefunde synchronisiert werden.

Dieser Lauf ist primär **Dokumentation und technische Wahrheitsprüfung**. Die neu gefundenen Livefehler werden dokumentiert und technisch eingegrenzt, aber in diesem Auftrag nicht durch umfangreiche Feature-Implementierung verdeckt. Keine falschen `VORHANDEN`-/`LIVE BESTANDEN`-Claims.

Verbindlicher neuer Input ist `PRODUCT-DECISIONS-2026-09-11.md`. Diese Datei vollständig lesen und ihre Inhalte an die jeweils autoritative Dokumentation überführen.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: sämtliche Markdown-Dateien des Repositorys, insbesondere `DOCUMENTATION.md`, `PRODUCT-DECISIONS-2026-09-11.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `Architecture.md`, `ModuleCreation.md`, `SYSTEM-MODULES.md`, `UI-UX.md`, `ADMIN-UX-DECISIONS.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `I18N.md`, `API.md`, `Database.md`, `Security.md`, `Functions.md`, `BACKUP-CONTRACT.md`, `Install-README-Server.md`, `Install-README-Web-App.md`, `DEVELOPMENT.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `ROADMAP.md`, `WORKFLOW.md`, `CHATGPT.md`, `CHANGELOG.md`, `CURRENT-TASK.md` und diese `CODEX.md`.
3. Relevanten aktuellen Code gegenlesen, bevor technische Aussagen als vorhanden dokumentiert werden: Modulmanifest/-registry/-runtime, Profile, Media, Sharing, Notifications, Moderation, Postbox, Module Administration, User Management, Auth/Login, Device Limits, Backup, Setup/Installation, API/DB/Security.
4. Dokumenthierarchie aus `DOCUMENTATION.md` respektieren. Bei Widerspruch gilt die dort definierte Autorität.
5. Keine Secrets/PII ausgeben oder committen.
6. Keine destruktiven Produktionsaktionen, keinen Production-Restore.

---

# 2. Produkt-/Architekturentscheidungen korrekt überführen

`PRODUCT-DECISIONS-2026-09-11.md` enthält verbindlichen Input aus Betreiberentscheidungen und realen Livechecks. Überführe ihn ohne unnötige Duplikation in die richtigen autoritativen Dateien.

Mindestens dauerhaft verankern:

- Core = nur zwingend notwendige technische Mechanismen; konkrete Funktionen soweit sauber möglich als Module.
- optionale Module dürfen unabhängige Funktionen nicht zu harten Abhängigkeiten machen.
- unsichtbare System-/Capability-Module sind zulässig.
- Profile ist optional, nicht Core-Zwang.
- Media/Upload, Sharing/Visibility, Notifications, Moderation und Postbox sind optionale System-/Funktionsmodule bzw. entsprechende Verträge.
- Postbox-Vertrag inkl. rollen-/organisationsbasierter Empfänger und separater Broadcast-Permissions.
- Profilbild-Vertrag: 256×256, rund, Replace/Delete, Default-Avatar nach Gender, Original nicht dauerhaft behalten.
- Module Administration: Visibility/Navigation pro Rolle **getrennt von Permissions**.
- User Management: Liste und Edit-Ansicht auf kleinen Screens getrennt; nach Save/Cancel kontrolliert zurück.
- Standalone-/Self-Test-Vertrag ausgehend von GPS als bestehender Referenz sauber in `ModuleCreation.md` einordnen.
- Field Notes bleibt späterer unabhängiger Neubau-/Freeze-Test und wird in diesem Dokumentationslauf nicht implementiert.
- automatische/weitgehend selbst-erkennende Setup-Routine bleibt als unmittelbarer Post-Freeze-Schritt dokumentiert; Installationsdokumente müssen klar zwischen heutigem IST und geplantem Setup-Ziel unterscheiden.

---

# 3. Reale Livebefunde korrekt dokumentieren

Folgende Befunde sind nach Commit `4dae2b5a42e2569834a6d67f749bb85e7406370a` real auf Betreibergerät festgestellt worden und dürfen nicht durch lokale Tests überschrieben werden:

## Nicht bestanden / offen

1. User-Login: Eye-Toggle weiterhin nicht sichtbar, normaler und privater Browsermodus.
2. Unlimited Devices: User mit wirksamem Package `Admin` und Package-Default `Unlimited` wurde bei zwei Sessions wegen Device-Limit blockiert; UI zeigte sinngemäß `2 of 0 sessions`. Technisch als offenen Semantik-/Resolutionfehler dokumentieren.
3. Profile: registered/inactive; `Activate` schlägt live mit `Activation failed: Internal Server Error` fehl. Profile/Privacy deshalb im User-Settings-Livetest nicht verfügbar. `profile.view`/`profile.update` waren für Admin/Developer/User vorhanden.
4. Media & Upload: `Discovered / Not registered`; `Install` schlägt live mit `Install failed: Load failed` fehl.

## Lifecycle live bestanden

Jeweils Install → Activate → Deactivate → Activate real erfolgreich:

- Moderation
- Notifications
- Postbox
- Sharing & Visibility

Danach wurden diese Module wieder deaktiviert. Das ist ausschließlich ein Lifecycle-Nachweis, kein Nachweis vollständiger Fachfunktion/UI.

GPS blieb als aktives Referenzmodul bestehen.

Diese Befunde mindestens in `STATUS.md`, `CORE-1.0-READINESS.md`, `TODO.md`/`ToDoNow.md`, `CHATGPT.md` und soweit fachlich nötig in den jeweiligen Vertragsdateien korrekt abbilden.

---

# 4. ModuleCreation.md vollständig auf aktuellen Vertrag bringen

`ModuleCreation.md` ist die verbindliche Anleitung zur Modulerstellung und muss nach diesem Lauf wieder tatsächlich aktuell sein.

Gegen Code und Architektur prüfen/aktualisieren:

- Manifestfelder und reale Validierung;
- Lifecycle;
- install/registered/active getrennt;
- User-/Admin-/System-Presentation;
- unsichtbare Systemmodule;
- Visibility/Navigation vs Permissions;
- mandatory vs optional dependencies/enhancements;
- Capability-/Service-/Event-Verträge;
- Servermodule/API/DB/Migrationen;
- Settings/i18n/theme/offline/backup;
- Media-/Sharing-optionale Nutzung;
- Security und Namespace-Regeln;
- Standalone-/Self-Test-Vertrag: GPS als Referenz, klar definieren wann sinnvoll/erforderlich und welche Grenzen dieser Test hat;
- harte Regel: Fachmodul verändert keine Core-Dateien nur zur eigenen Anbindung;
- Field Notes als späteren Beweistest nennen, ohne es jetzt zu implementieren.

Keine Manifestfelder als unterstützt behaupten, wenn Runtime/Validator sie nicht tatsächlich tragen. Abweichungen als `GEPLANT/FEHLT` dokumentieren.

---

# 5. Architecture / System Modules / Core-Dokumente synchronisieren

`VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `Architecture.md` und `SYSTEM-MODULES.md` gegeneinander und gegen Code prüfen.

Insbesondere:

- Minimal-Core-Grenze;
- optionale Profile-Architektur;
- tatsächlicher Stand der Profile-Extraktion: code-seitig vorhanden, aber Live-Aktivierung derzeit fehlgeschlagen;
- Systemmodule: Vertrag/Scaffolding vs vollständige Produktfunktion klar unterscheiden;
- keine falsche Behauptung, Postbox/Moderation/Notifications/Sharing seien fachlich vollständig, nur weil Lifecycle funktioniert;
- Media Install-Fehler ausdrücklich offen;
- Core Freeze weiterhin blockiert;
- Field Notes als späteres Freeze-Gate;
- keine automatische Freeze-Erklärung.

---

# 6. UI-/Admin-/Account-Dokumente synchronisieren

`UI-UX.md`, `ADMIN-UX-DECISIONS.md`, `USER-ACCOUNT-LICENSE-MODEL.md` prüfen/aktualisieren.

Mindestens:

- User Management List/Edit getrennte mobile Ansicht als verbindliches UX-Ziel;
- Module Administration Visibility/Navigation pro Rolle getrennt von Permissions;
- Systemmodule können aktiv, aber User-unsichtbar sein;
- Profil/Gender/Avatar-Vertrag;
- Organization Sharing nur bei echter Zuordnung;
- User-Login Eye weiterhin live offen;
- Unlimited darf niemals als 0 erlaubte Devices interpretiert werden; `unlimited`-Semantik dokumentarisch eindeutig;
- direkte User-Package-/License-Priorität und Fallback nicht regressieren.

---

# 7. API / Database / Security / Functions technisch verifizieren

Diese Dateien nicht aus Produktwünschen heraus umschreiben, sondern gegen realen Code prüfen.

- `API.md`: tatsächliche Modulkernel-/Profile-/Systemmodul-Endpunkte und Status; geplante APIs klar als geplant.
- `Database.md`: tatsächliche Tabellen/Migrationen/Profile-/Media-/Modulregistrierung; keine erfundenen Postbox-/Moderationstabellen als vorhanden markieren.
- `Security.md`: Uploadgrenzen, Modulautorisierung, Sharing, Broadcast, Profile, Device-Limit-Semantik, Setup/Recovery.
- `Functions.md`: nur tatsächlich öffentliche/implementierte Funktionen/Facades/Services als vorhanden dokumentieren.
- `BACKUP-CONTRACT.md`: Profile/Avatar/Media und Moduldaten nur entsprechend tatsächlichem Backup-Verhalten dokumentieren.

---

# 8. Installationsdokumente und Setup-Ziel synchronisieren

`Install-README-Server.md` und `Install-README-Web-App.md` gegen heutigen Code und `ROADMAP.md` prüfen.

Wichtig:

- heutige tatsächlich vorhandene `app:create`, Paket-, Preflight-, Setup- und Deploymentwege korrekt beschreiben;
- geplante weitgehend automatische Setup-Routine **nicht als bereits implementiert ausgeben**;
- aber als klaren Post-Freeze-Zielvertrag/Weiterentwicklung referenzieren;
- Serverwechsel/Portabilität: absolute hostabhängige Pfade vermeiden, soweit heutiger Code das trägt; geplante automatische Ableitung als geplant markieren;
- Module/Systemmodule im Bootstrap-/Installationskontext korrekt einordnen;
- keine Node-Produktionspflicht erfinden.

---

# 9. Status/TODO/Readiness bereinigen

`STATUS.md`, `TODO.md`, `ToDoNow.md`, `CORE-1.0-READINESS.md` müssen danach denselben aktuellen Stand ausdrücken.

Nächste Implementierungspriorität nach diesem Dokumentationslauf:

1. Profile Activation Internal Server Error beheben.
2. Media & Upload Install `Load failed` beheben.
3. Unlimited-Device-Semantik/`2 of 0` beheben.
4. User-Login Eye real sichtbar machen.
5. User Management List/Edit UX trennen.
6. Module Visibility/Navigation pro Rolle getrennt von Permissions implementieren/abschließen.
7. Systemmodule erneut live lifecycle-testen.
8. Profile inkl. Avatar/Gender live testen.
9. Danach Field Notes als separaten Neubau-/Freeze-Test.

Keine erledigten historischen Aufgaben unnötig in TODO halten.

---

# 10. Umgang mit PRODUCT-DECISIONS-2026-09-11.md

Nachdem alle Inhalte nachweislich in die autoritativen Dateien überführt wurden:

- entweder Datei als historisches Betreiberentscheidungsprotokoll kennzeichnen und in `DOCUMENTATION.md` entsprechend einordnen;
- oder entfernen, wenn dadurch keine Information verloren geht und `CHANGELOG.md`/`WORKFLOW.md` die Übernahme nachvollziehbar festhalten.

Keine widersprüchliche zweite Autoritätsquelle dauerhaft stehen lassen.

---

# 11. CHANGELOG / WORKFLOW / CHATGPT

- `CHANGELOG.md`: nur neuen Dokumentations-Konsistenzlauf ergänzen, Historie nicht umschreiben.
- `WORKFLOW.md`: dokumentieren, welche Dateien geprüft/geändert wurden und durch wen.
- `CHATGPT.md`: kompakte Übergabe mit tatsächlichem Endstand, offenen Livefehlern und nächster Implementierungsreihenfolge.

---

# 12. Verifikation und Abschluss

Dieser Auftrag darf Code nur dann minimal anfassen, wenn es zwingend nötig ist, um eine falsche technische Dokumentationsbehauptung eindeutig zu verifizieren; keine Feature-Reparaturen in diesen Dokumentationslauf hineinziehen.

Vor Abschluss:

1. Markdown-Links/Referenzen prüfen.
2. Dokumenthierarchie/Widersprüche prüfen.
3. `git diff --check`.
4. Falls keinerlei Runtime-Code geändert wurde, keine künstliche Production-Feature-Abnahme behaupten.
5. commit/push `main` gemäß Workflow.
6. `HEAD == origin/main`, sauberer Tree.
7. `CHATGPT.md` aktualisieren.

Ergebnis muss sein: Ein neuer Codex-Agent kann anschließend ausschließlich anhand der Markdown-Dokumentation den tatsächlichen Stand, die verbindliche Architektur, die offenen Livefehler und die nächste Implementierungsreihenfolge korrekt verstehen, ohne diesen Chat zu benötigen.
