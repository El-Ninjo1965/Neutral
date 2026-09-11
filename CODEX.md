# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER GROSSER OPERATOR-RETEST-REPARATURAUFTRAG  
**Datum:** 2026-09-11

# Ziel

Der erste gesammelte Operator-Retest nach dem Pre-Freeze-Batch hat mehrere reale UX-/Lifecycle-Probleme offengelegt. Behebe in **einem zusammenhängenden Lauf** alle nachfolgend dokumentierten Punkte, soweit technisch verantwortbar, damit anschließend möglichst nur noch eine weitere gesammelte Betreiberabnahme nötig ist.

Autoritativer neuer Betreiberinput: `ADMIN-UX-DECISIONS.md`, Abschnitt **Aktueller bindender Nachtrag (2026-09-11, Operator-Retest)**. Diesen vollständig lesen und gegen den tatsächlichen Code prüfen.

Verbindlich:

> Core enthält nur generische Mechanismen. Fachfunktionen bleiben Module. Keine zweite Modulruntime und keine App-/Field-Notes-Sonderlogik im Core.

> Lokale/CI-Tests sind kein Betreiber-Live-Pass. Nach Deployment bleiben reale Bedienpunkte `OPERATOR RETEST REQUIRED`.

Kein Production Restore. Keine automatische Freeze-Erklärung. Referral/Rewards und automatische Setup-Routine in diesem Lauf nicht implementieren.

---

# 1. Preflight

1. `origin/main` synchronisieren, sauberen Tree sicherstellen.
2. Alle Markdown-Dateien lesen, besonders `DOCUMENTATION.md`, `CHATGPT.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `CORE-1.0-READINESS.md`, `Architecture.md`, `ModuleCreation.md`, `SYSTEM-MODULES.md`, `API.md`, `Database.md`, `Security.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `CHANGELOG.md` und diese Datei.
3. Den deployed Pre-Freeze-Code ab `eced1c429c5aadab0e449ea36fa8a55e1dde19f9` lesen. Bereits funktionierende Teile nicht neu erfinden.
4. Testgetrieben und in logisch getrennten Commits arbeiten.
5. Keine Secrets/PII; keine destruktiven Produktionsaktionen.

---

# 2. User Login Eye – sichtbar, aber Klick funktioniert live nicht

Neuer Livebefund:

- Eye ist jetzt sofort sichtbar;
- Klick erzeugt Fokus/Blau-Rahmen;
- Passwort bleibt `type=password`, wird nicht sichtbar.

Aufgabe:

- Root Cause im realen Event-/Binding-/Renderpfad ermitteln;
- statisches Eye-Markup beibehalten;
- genau einen Toggle sicherstellen;
- gemeinsamer Helper darf vorhandenen Button binden, ohne ihn zu ersetzen/duplizieren;
- Klick muss zuverlässig `password ↔ text` schalten, SVG/ARIA synchronisieren und Fokus sinnvoll erhalten;
- prüfen, ob Re-Render, Event-Propagation, mehrfaches Binding, DOM-Ersatz oder Browser/iOS-Verhalten die Änderung zurücksetzt;
- DOM-/browsernahen Test ergänzen, der einen echten Click dispatcht und anschließend den tatsächlichen Input-Type prüft;
- Admin-/dynamische Passwortfelder nicht regressieren.

Nach Deployment erneut Operator-Retest normal + privat.

---

# 3. Profile – partieller Installationszustand / Internal Server Error

Neuer Livebefund:

- Profile Uninstall möglich;
- anschließendes Install endet `Install failed: Internal Server Error`;
- nach Reload kann `Registered: Yes` erscheinen, während Lifecycle `Inactive/Error` bleibt;
- Profile/Privacy fehlen deshalb im User-Settings.

Aufgabe:

- serverseitige Root Cause vollständig ermitteln;
- Install muss atomar/retry-safe sein: kein `Registered Yes` nach fehlgeschlagenem Install ohne konsistenten Lifecycle;
- vorhandene partielle Migration/Registry-Zustände sauber und nicht destruktiv reparieren;
- Install/Register/Activate/Deactivate/Re-activate testen;
- Datenretention erhalten;
- kontrollierte 4xx/5xx ohne inkonsistenten Persistenzzustand;
- Profile bleibt optional, keine harte Media/Sharing-Abhängigkeit;
- Profile-Permissions müssen nach erfolgreicher Registration automatisch im Permission Catalog/Role Management verfügbar sein;
- Profile/Privacy erscheinen bei aktiver Capability und entsprechender Permission im User-UI.

Media/Postbox/Sharing haben den Operator-Lifecycle bestanden; nicht regressieren.

---

# 4. User Settings – Save/Restore sofort sichtbar + Success Feedback

Livebefund:

- Änderungen werden persistiert;
- kein Success-Dialog;
- Navigation/App-Sichtbarkeit aktualisiert sich erst nach Reload;
- Restore Defaults ebenso;
- `App Areas` soll `Apps` heißen.

Aufgabe:

- gemeinsamen Success-Dialog nach erfolgreichem Save/Restore verwenden;
- direkt nach erfolgreicher Persistierung UI/Nav aus autoritativ gespeichertem Zustand re-rendern;
- kein Reload erforderlich;
- Fehler weiterhin klar anzeigen;
- `App Areas` → `Apps`;
- Profile/Privacy/Sharing nur gemäß echten Capability-/Permission-/Session-Verträgen anzeigen.

---

# 5. Admin Shell vereinfachen und Scroll-/Route-Bug beheben

## Header entfernen

Der globale Admin-Header ist redundant. Entfernen. Jede Seite besitzt ihren eigenen Titel.

Sidebar:

- `Neutral Administration`
- Version
- Theme Light/Dark direkt darunter, vor Dashboard
- danach Navigation
- Logout als letzter Sidebar-Eintrag unten

`Overview · Dashboard` → `Dashboard`.

Keine redundanten `Overview · Packages`, `Overview · Licenses` usw. im globalen Header.

## Scroll-/Position-Bug

Auf praktisch jeder Admin-/User-Seite landet nach Route/Reload der obere Content außerhalb des sichtbaren Bereichs; Top-Actions sind erst durch Zurückscrollen sichtbar.

- Root Cause in Scroll restoration, focus, anchor/hash, container scroll oder Layout finden;
- jede neue Route/View kontrolliert am Anfang ihres Contentbereichs öffnen;
- Sidebar/Header-Hierarchie darf nichts überdecken;
- kein aggressives `scrollIntoView`, das die globale Seite falsch verschiebt;
- iPad/mobile testen.

---

# 6. App Modules und System Modules als getrennte Admin-Ziele

Frühere interne Gruppierung reicht dem Betreiber nicht.

Unter PLATFORM zwei eigenständige Menüziele/Views:

1. **App Modules** (bisher `User Modules`)
2. **System Modules**

Anforderungen:

- gleiche Registry, gleiche Lifecycle Engine, gleiche Detailkomponente;
- nur gefilterte administrative Views;
- Kategorie bleibt deklarative Metadaten;
- Permissions/Visibility bleiben unabhängig;
- Apps selbst nicht mit Modulen vermischen;
- Mobile-First;
- Deep-Link/Back/Refresh müssen stabil sein.

Dokumentation entsprechend von `User Modules` auf `App Modules` aktualisieren, wo die Betreiber-UI gemeint ist; technische historische Aussagen nicht verfälschen.

---

# 7. Dashboard entschlacken

Dashboard nur als kompakte echte Summary.

Entfernen:

- `Module Status`-Block;
- `Session Overview`-Block.

Beide besitzen eigene Admin-Ziele und der aktuelle Module-Block war live unvollständig (8 Zeilen bei 9 Modulen) und nicht interaktiv.

Summary-Karten nur behalten, wenn sie echte aktuelle Werte liefern. Keine duplizierten Detailtabellen auf Dashboard.

---

# 8. Einheitliches List/Create/Edit-Muster

User Management funktioniert bereits grundsätzlich richtig und ist Referenz.

Übertragen auf:

- Packages;
- Licenses/Organizations;
- Roles.

Vertrag:

- Listenansicht separat;
- `New/Create` öffnet eigene View;
- `Edit` öffnet eigene View;
- kein Formular unterhalb der Liste;
- Save → Success → Liste;
- Cancel/Back → Liste;
- Route/Refresh/Back stabil;
- keine versteckten Formulare/Scrollsuche.

ACCESS-Menüreihenfolge:

**Users → Licenses/Organizations → Packages → Sessions → Roles → Permission Catalog**.

Diese UI-Reihenfolge darf keine falsche technische Abhängigkeit behaupten.

---

# 9. User Management Tabelle verbessern

Standardübersicht:

- E-Mail entfernen; bleibt in Edit;
- Organization als eigene Spalte anzeigen, z. B. `Verein Bonn`;
- Package/Licence getrennt verständlich anzeigen;
- Tabellenüberschriften sortierbar, mindestens User/ID, Role, Status, Created, Last Activity, Devices, Package/License, Organization;
- Sortierung client- oder serverseitig konsistent und stabil; keine Sicherheitslogik im Client.

Organization ist der menschenlesbare Organisationsname, Package ist das Entitlement. Nicht vermischen.

---

# 10. Device Limits / Entitlement-Auflösung erneut prüfen

Livebefund:

- Tester zeigte u. a. `2 of 2`, später `3 of 2`;
- Login wurde erst nach manuellem Unlimited-Override wieder möglich;
- unassigned Tester zeigte unerklärlich Default `5`;
- tatsächliche Quelle des Defaults war für Admin nicht nachvollziehbar.

Aufgabe:

- komplette Resolverkette User Override → License Package → direct Package → echter Systemfallback prüfen;
- kein magisches `5`, sofern nicht ausdrücklich dokumentierte Defaultpolicy;
- Admin/Developer nur Unlimited, wenn verbindliche Policy/Entitlement dies tatsächlich ergibt;
- UI muss Quelle anzeigen können: z. B. `Unlimited · User override`, `2 · Package Verein`, `1 · System default`;
- Used Sessions darf das konfigurierte Limit überschreiten, wenn Limit nachträglich gesenkt wurde, aber neue Logins müssen gemäß Vertrag behandelt werden;
- keine bestehende Session automatisch löschen;
- `null/unlimited` niemals `0`;
- numerische Limits korrekt testen.

---

# 11. Package/License Delete-Abhängigkeiten fachlich korrigieren

Livebeobachtung: Ein Package/License wirkte wegen vermeintlicher aktiver License/User-Zuordnung unlöschbar; nach Löschen von Sessions wurde Delete möglich.

Prüfe die reale Daten-/FK-/Resolverursache. Nicht einfach die Betreiberinterpretation übernehmen.

- Session darf nicht als `active license` fehlbeschriftet werden;
- wenn Sessions tatsächlich referenziell/vertraglich Delete blockieren, klare Meldung `active session/device`;
- wenn sie nicht blockieren sollen, Abhängigkeit korrigieren;
- License Manager/User Assignment/Package Assignment getrennt prüfen;
- verständliche 4xx, keine 500;
- Audit beibehalten.

---

# 12. Sessions UI radikal vereinfachen

Standardtabelle nur:

- User;
- Role;
- Status;
- Registered;
- Last Activity.

Entfernen aus Standardtabelle:

- Installation/Device ID;
- Device Class;
- Operating System;
- Browser.

Begründung: Live auf iPad/Chrome wurden `Desktop · macOS · Chrome` angezeigt; Device Class/OS sind nicht zuverlässig. Lange Device-ID zerstört responsive Breite.

Technische Installations-ID intern weiterverwenden und ggf. in explizitem Support-/Detailkontext verfügbar halten, aber niemals Tabellenlayout sprengen. Keine geratenen Clientmetadaten. Tabelle muss auf iPad ohne horizontales Herauslaufen funktionieren.

---

# 13. Roles / Module Permissions

- `Create New Role` eigene View gemäß Abschnitt 8;
- installierte/registrierte Module registrieren ihre Permissions automatisch im Permission Catalog;
- Role Management liest diesen Katalog dynamisch;
- keine manuelle Doppelpflege;
- Deactivate darf Permissions nicht destruktiv löschen; Uninstall-Vertrag gegen bestehende Retention/Permission-Regeln prüfen;
- Profile-Permissions nach erfolgreichem Profile-Fix sichtbar;
- Field Notes/andere Module gemäß ihrem Manifest ebenfalls korrekt projizieren.

---

# 14. Database Test – persistenter letzter Teststatus

`Test Database`:

- unmittelbarer klarer Success/Error-Dialog;
- zusätzlich sichtbarer `Last database test` mit Timestamp + Ergebnis;
- Audit-Eintrag;
- Ergebnis ist historischer Testzeitpunkt, keine dauerhafte Health-Garantie;
- sensible Connectiondaten niemals ausgeben.

Persistenz so wählen, dass sie zum bestehenden Settings/Audit-Vertrag passt; keine unnötige neue Tabelle, falls namespaced Settings genügen.

---

# 15. Backup Path Test – deutliches Feedback

`Test path`:

- klarer Success/Error-Dialog;
- sichtbarer `Last path test` mit Timestamp + Ergebnis;
- bestehendes `Ready`/Key-/Pfadmodell erhalten;
- kein Secret ausgeben;
- Test bleibt non-destructive;
- Audit, soweit bestehender Admin-Testvertrag dies vorsieht.

---

# 16. Bereits bestandene Livebefunde nicht regressieren

Operator bestätigt in dieser Runde:

- GPS Produktfunktion: PASS;
- Media Lifecycle Install/Activate/Deactivate/Uninstall: PASS;
- Postbox Lifecycle: PASS;
- Sharing & Visibility Lifecycle: PASS;
- Audit Delete All grundsätzlich funktionsfähig;
- Maintenance State funktioniert.

Diese Aussagen in Dokumentation als datierten Livebefund erhalten. Nicht durch lokale Tests überschreiben.

Noch offen/fehlgeschlagen:

- User Login Eye Funktion;
- Profile Install/Lifecycle;
- Profile/Privacy User UI;
- Settings immediate feedback/re-render;
- Device Limit Resolver/UX;
- neue Admin-UX-Punkte;
- Field Notes Operator-Test;
- Module Visibility/Rollen vollständig;
- übrige Host-Gates.

---

# 17. Field Notes / Self-Test nicht unnötig umbauen

Field Notes wurde als Freeze-Proof implementiert, aber noch nicht operator-live geprüft. Keine neue Fachfunktion hinzufügen. Nur regressionsfrei halten.

Self-Test-Vertrag bleibt optional. GPS ist Referenz. Kein künstlicher Self-Test für Profile/Media/Field Notes, sofern nicht deklariert.

---

# 18. Tests / Responsive / Accessibility

Für alle geänderten Bereiche:

- fokussierte Tests zuerst;
- DOM/browsernahe Tests für Interaktionen;
- responsive iPad/mobile Layouttests soweit im vorhandenen Teststack möglich;
- Tastatur/Fokus/ARIA erhalten;
- Tabellen dürfen Viewport nicht durch ungebrochene technische IDs sprengen;
- vollständige Regression Suite;
- PHP lint;
- JS syntax;
- `git diff --check`.

Keine Tests so abschwächen, dass sie nur Implementierungsstrings bestätigen.

---

# 19. Dokumentation vollständig synchronisieren

Nach tatsächlichem Code-Endstand alle betroffenen Markdown-Dateien gegen Code + Operatorbefund synchronisieren, insbesondere:

- `CHATGPT.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `USER-ACCOUNT-LICENSE-MODEL.md`
- `CORE-1.0-READINESS.md`
- `Architecture.md`
- `ModuleCreation.md`
- `SYSTEM-MODULES.md`
- `API.md`
- `Database.md`
- `Security.md`
- `Functions.md`
- `BACKUP-CONTRACT.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `ROADMAP.md`
- `CURRENT-TASK.md`
- `WORKFLOW.md`
- `CHANGELOG.md` append-only.

Regeln:

- reale PASS-Befunde erhalten;
- fehlgeschlagene Punkte nicht als bestanden markieren;
- nach Codefix `OPERATOR RETEST REQUIRED`;
- Core Freeze nicht erklären;
- Referral/Rewards und Setup nicht implementiert nennen.

---

# 20. Deployment / Abschluss

1. vollständige Tests;
2. Production Package;
3. commit/push `main`;
4. CI/CodeQL/FTPS terminal abwarten;
5. Deploymentrevision und `migrationsReady:true` read-only prüfen;
6. keine destruktiven Produktionsaktionen;
7. `CHATGPT.md` mit einer **einzigen priorisierten Operator-Retestliste** aktualisieren.

Am Ende soll der nächste Schritt ausschließlich die gesammelte Betreiber-Liveabnahme der reparierten Punkte sein. Keine automatische Core-Freeze-Erklärung.