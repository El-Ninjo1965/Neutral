# NEUTRAL – Admin/User UX Decisions

## Aktueller bindender Nachtrag (2026-09-11)

1. Module Administration benötigt eine rollenbezogene `Visibility`/`Navigation`-Steuerung getrennt von Permissions. `presentation.userNavigation=false` bleibt der globale Systemmodul-Fallback; eine Visibility-Einstellung darf keine Berechtigung erteilen.
2. User Management zeigt auf kleinen Screens Liste und Edit/Create nicht gleichzeitig. Save und Cancel/Back kehren zur Liste zurück.
3. `Unlimited` bedeutet semantisch unbegrenzt und darf in API oder UI niemals zu `0` werden. Der frühere Livefehler `2 of 0 sessions` besitzt einen Codefix, bleibt bis Betreiber-Retest offen.
4. Profile bleibt optional. Avatarziel: quadratischer Crop, optimiert ≤256×256, runde Anzeige, Replace/Delete, dynamischer Gender-Default, kein dauerhaftes Original.
5. User-Login-Eye: Der bisherige dynamische Enhancement-/Self-Heal-Ansatz ist nach Deployment erneut auf Betreiber-iPad/Chrome normal und privat live durchgefallen. Verbindliches Ziel ist nun ein Eye-Button, der zusammen mit dem User-Login-Passwortfeld direkt im Login-Markup gerendert wird. Der gemeinsame Password-Visibility-Helper steuert nur Verhalten/Zustand; die Existenz des Buttons darf nicht von nachträglicher DOM-Anreicherung abhängen. Bis erneuter Betreiberabnahme bleibt der Punkt offen.
6. `Apps & Modules` wird administrativ in **Apps**, **User Modules** und **System Modules** gegliedert. Diese Gliederung ist reine Klassifikation/Präsentation; alle Module verwenden weiterhin denselben Runtime-/Lifecycle-Vertrag.
7. Modulklassifikation und Sichtbarkeit sind strikt getrennt. Ein Systemmodul kann sichtbare User-Funktionen besitzen, ein User-Modul kann unsichtbar geschaltet werden. Permissions bleiben wiederum eine dritte, getrennte Ebene.
8. Die übrigen Reparaturen dieses Durchlaufs werden erst nach Abschluss der unmittelbar folgenden Änderungen gesammelt vom Betreiber live abgenommen; lokale/grüne Tests sind kein Live-Pass.

---

**Status:** VERBINDLICHE PRODUKT-/UX-ENTSCHEIDUNGEN FÜR CORE 1.0  
**Datum:** 2026-09-10

Dieses Dokument hält Entscheidungen fest, die im Betreiber-Livecheck getroffen wurden und künftig nicht erneut aus Gesprächen rekonstruiert werden sollen. Es ergänzt `VISION.md`, `USER-ACCOUNT-LICENSE-MODEL.md` und `UI-UX.md`.

## 1. Packages / Entitlements

- Package-Key = technische, eindeutige Kennung ohne Leerzeichen; menschenlesbarer Name separat.
- Package-Name und Beschreibung sind frei konfigurierbar.
- Package-Status: `active` / `inactive`.
- Modulzustände: `available`, `locked`, `hidden`.
- Default Allowed Devices darf **nicht** auf feste Auswahlwerte 1/2/3/5/10 begrenzt sein.
- Gewünschte UX: freie positive Ganzzahl **oder** `unlimited`.
- Beispiel: Free Package kann 1 Device erlauben; Vereins-/Businesspakete müssen z. B. 20, 50 oder andere Werte ohne Codeänderung erlauben.
- Der bestehende Vertrag bleibt eindeutig: `Default Allowed Devices` im Package ist ein **Default pro User**, nicht ein globales Gesamt-Gerätelimit der gesamten Organisation. Die UI soll dies ausdrücklich als `Default devices per user` / `Default device limit per user` kenntlich machen, damit Package-, User- und License-Limits nicht verwechselt werden.

## 2. Licenses / Organizations

- License-Key = technische eindeutige Kennung.
- Organization = menschenlesbarer Kunden-/Organisationsname.
- Package wird der Lizenz zugeordnet.
- `Seats` und `Devices` bleiben fachlich getrennt: Seats = Nutzerplätze; Devices = Installationen pro User.
- UI-Begriffe bevorzugt `User limit`, `Device limit per user`, `License manager`.
- License Manager über Benutzer-Auswahlliste, nicht manuelle ID.
- Lizenz deaktivierbar/widerrufbar; sichere Delete-Aktion nur referenziell kontrolliert und auditiert.
- Package-/License-Defaults und User-Overrides nachvollziehbar anzeigen.

## 3. User Management / Device Limits

- Allowed Devices: Package/License Default, freie positive Ganzzahl oder `unlimited` als berechtigter Override.
- Keine festen 1/2/3/5/10-Auswahlwerte als Ziel.
- `Override` in UI verständlich benennen, z. B. `Custom device limit`.
- Used Devices read-only.
- Limit-Senkung löscht bestehende Sessions nicht automatisch.

## 4. Birthday / Profile

- Geburtstag kein Freitext.
- Drei Auswahlfelder: Tag, lokalisierter Monatsname, Jahr.
- Server validiert echtes Kalenderdatum; Speicherung `YYYY-MM-DD`; optional/löschbar.

## 5. Audit Delete All

- Separate kritische Adminaktion mit eigener Permission.
- Zwei Bestätigungsdialoge genügen; kein `DELETE`-Tippen.
- Nach Löschung genau ein neuer Audit-Nachweiseintrag.
- Retention 30/90/180/365 separat.

## 6. Sessions / Installationsidentität

- Serververlässliche Identitäten; Useranzeige Name + User-ID.
- Persistente Installations-ID ist technische Identität.
- Device class/OS nur soweit zuverlässig; keine falsche Gewissheit.
- Browser nicht als Identitätsquelle; keine Hardware-Fingerprints.

## 7. Backup & Restore – konfigurierbarer Speicherpfad

- Backup-Speicherpfad nicht hardcodiert, pro Installation konfigurierbar auf `Admin → Backup & Restore`.
- `Test path` + `Save`; Schutz gegen unsichere Pfade/öffentliche Auslieferung.
- `NEUTRAL_BACKUP_KEY` bleibt hostlokales Secret und wird nie angezeigt/geloggt.

## 8. Livebefunde 2026-09-10

Positiv bestätigt: User/Admin Login, parallele Sessions, GPS-Basismodul, Audit Delete All, Package/License Create, flexible Device-Limits/Unlimited und License-Manager-Auswahl.

Frühere offene Punkte wurden teilweise code-seitig nachgebessert; deren aktueller Live-Status steht im bindenden Nachtrag und in `CHATGPT.md`/`STATUS.md`.

## 9. Code-seitiger Follow-up-Stand

License Delete mit Referenzsperre/Audit, Session-User-ID und vollständiger Installation-ID, konservative Supportmetadaten sowie Backup Storage Path mit Test/Save wurden implementiert; reale Host-/Device-Abnahme bleibt getrennt.

## 10. Settings/Profile und Backup-V2

Ausgeloggt ausschließlich App Areas und Navigation; Profile/Privacy benötigen bestätigte User-Session und aktive Capability. Birthday Day/Month/Year. Backup V2 umfasst deklarierte Modultabellen und verwaltete Medienbytes. Kein Production-Restore als Test.

## 11. Organization Sharing und Navigation Active-State

Organization Sharing nur bei autoritativ bestätigter User→License/Organization-Zuordnung. Navigation pro Ebene genau ein routenbasierter `aria-current`-Active-State; Farben aus zentralen Tokens.

## 12. Globale Erfolgsbestätigung, Passwörter und ACCESS-Reihenfolge

Save/Create/Update verwenden gemeinsamen zugänglichen Success-Dialog. Password-Visibility nutzt einen gemeinsamen Interaktionsvertrag; statische Kernformulare dürfen ihre Toggle-Control direkt rendern. Unter ACCESS: Users, Packages, Licenses, Sessions vor Roles/Permission Catalog.

## 13. Password eyes and individual-user packages

Password visibility uses the same recognizable open/crossed eye SVG and approximately 44×44 touch target in User Login, Admin Login, profile, and dynamic Admin forms. For the User Login specifically, the toggle control is part of the rendered login markup and is not dependent on post-render DOM enhancement. An individual user can receive a direct Package without an Organization. License Package takes precedence; retained direct Package becomes fallback after License removal.

## 14. Optional and invisible system modules

Activation does not imply User navigation. Admin may activate capability/system modules with `userNavigation=false`. Missing optional modules hide enhancements without breaking Core/independent features.

## 15. Optional Profile lifecycle

Profile is an optional invisible system module. Admin deactivation hides Profile/Privacy without deleting data; reactivation restores it. Core Login/Admin remain independent.

## Implemented follow-up, operator retest pending

Apps remain their own Admin destination. Module Administration groups User Modules/System Modules from manifest `category` and provides role-specific Visibility/Navigation independently from permissions. User Management uses exclusive list/create/edit states. Profile/Media/Unlimited and these UX repairs remain operator-retest pending. The User Login Eye has already failed its first post-repair operator retest and therefore requires the static-markup correction above before the collected retest round.