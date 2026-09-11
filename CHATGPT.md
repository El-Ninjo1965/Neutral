# Neutral handoff — gesammelte Operator-Abnahme

**Code- und Deploymentstand:** Code-/Dokumentationspayload `4038a62c3853b02dbc68cb0250d5e5a996e37c81` wurde nach `origin/main` gepusht. CodeQL `34558527567` war erfolgreich; FTPS `34558527653` absolvierte vollständige Tests, Paketbau, Upload und read-only Production-Smoke. Der Smoke bestätigte Deploymentrevision und `migrationsReady:true`.
**Operatorstatus:** **RETEST REQUIRED**
**Core Freeze:** nicht erklärt.

## In diesem Lauf reparierter Code-IST

- Das statische Login-Eye wird direkt an sein konkretes Passwortfeld gebunden; ein echter Click schaltet `password ↔ text`, synchronisiert ARIA/SVG und hält den Fokus.
- Ein fehlgeschlagener Modul-Install markiert den Registry-Eintrag wieder als `is_present=0`, deaktiviert den Lifecycle und hinterlässt eine retry-sichere Fehlermeldung. Profile bleibt optional und ohne harte Media-/Sharing-Abhängigkeit.
- User Settings heißt `Apps`; Save und Restore Defaults zeigen den gemeinsamen Success-Dialog und rendern Navigation/UI unmittelbar aus dem persistierten Zustand neu.
- Admin besitzt keinen redundanten globalen Header. Theme steht unter Brand/Version, Logout unten; jede Route setzt den Content-Scroll kontrolliert auf den Anfang.
- App Modules und System Modules sind getrennte Admin-Ziele derselben Registry/Lifecycle-Engine. Dashboard enthält nur Summary.
- Packages, Licenses/Organizations und Roles verwenden exklusive List- bzw. Create/Edit-Zustände. ACCESS ist Users → Licenses → Packages → Sessions → Roles → Permission Catalog.
- User Management zeigt keine E-Mail in der Liste, trennt Organization von License/Package, zeigt die Device-Limit-Quelle und bietet stabile sortierbare Spalten.
- Die unzugeordnete Systempolicy ist `1` Gerät, sofern `AUTH_MAX_DEVICES_PER_USER` sie nicht ausdrücklich überschreibt; `null` bleibt Unlimited. Bestehende Sessions werden beim Senken eines Limits nicht gelöscht.
- Die Sessions-Standardtabelle enthält nur User, Roles, Status, Registered und Last Activity; technische/geratene Gerätedaten bleiben aus der Übersicht.
- Database Test und Backup Path Test speichern Zeitpunkt/Ergebnis in namespaced Settings, auditieren den Test und zeigen unmittelbares Feedback sowie den letzten Teststand.

## Wahrheitsgrenze

Lokale Tests, CI, Deployment und read-only Smokes sind kein Operator-Live-Pass. Kein Production Restore und keine destruktive Produktionsaktion wurden ausgeführt. Referral/Rewards und automatische Setup-Routine wurden nicht implementiert. Field Notes erhielt keine neue Fachfunktion. Ein Core Freeze wurde nicht erklärt.

## Einzige priorisierte Operator-Retestliste

1. User Login Eye auf iPad/Chrome normal und privat: zweimal klicken, tatsächliche Sichtbarkeit, ARIA/Fokus und keine Duplikate prüfen.
2. Profile: Install → Activate → Deactivate → Re-activate sowie absichtlich wiederholten Install/Reload prüfen; danach Profile/Privacy und Permission Catalog/Role Management verifizieren.
3. User Settings: Apps/Navigation ändern, Save und Restore Defaults prüfen; Success-Dialog und sofortige Navigation ohne Reload bestätigen.
4. Admin Shell auf Desktop/iPad: Headerfreiheit, Theme-/Logout-Position, jede Route/Reload am Contentanfang, Deep-Link/Back für App Modules und System Modules.
5. Dashboard, Packages, Licenses und Roles: kompakte Summary sowie exklusive List/Create/Edit-, Save-/Cancel-/Back-Flows prüfen.
6. User Management: Sortierung aller geforderten Spalten, Organization getrennt von License/Package, E-Mail nur im Editor, Device-Quelle verständlich.
7. Device Limits: User Override → License → direct Package → Systempolicy; numerisch und Unlimited mit mehreren Sessions, keine `0`, keine automatische Sessionlöschung.
8. Package/License Delete: User-/Manager-/Package-Zuordnungen getrennt prüfen; Sessions dürfen nicht als License-Zuordnung fehlbeschriftet werden.
9. Sessions: responsive Fünf-Spalten-Tabelle ohne technische ID/UA-Raten; bestehende Support-/Audit-Identität intern erhalten.
10. Database Test und Backup Path Test: Dialog, persistenter Timestamp/Status nach Reload und Audit; keinen Restore ausführen.
11. Regression der bereits live bestandenen Befunde: GPS Produktfunktion, Media Lifecycle, Postbox Lifecycle, Sharing & Visibility Lifecycle, Audit Delete All und Maintenance State.
12. Field Notes unverändert operator-live prüfen und verbleibende Host-Gates aus `CORE-1.0-READINESS.md` abschließen.
