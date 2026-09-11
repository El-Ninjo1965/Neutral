# Neutral handoff — gesammelte Operator-Abnahme

**Code- und Deploymentstand:** Frontend-Hotfix und Dokumentation bis `e21f7fe4b37a868ffd414a10fbfc482c7d8b5df0` wurden nach `origin/main` gepusht. CodeQL `34561122536` war erfolgreich; FTPS `34561121940` absolvierte vollständige Tests, Paketbau, Upload und read-only Production-Smoke. Der Smoke bestätigte Deploymentrevision und `migrationsReady:true`.
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

1. **User Login Eye:** auf iPad/Chrome normal und privat zweimal klicken; tatsächliches sichtbares Feld muss `password → text → password` wechseln, Icon/ARIA/Fokus müssen folgen und das Feld darf nicht ersetzt werden.
2. **Modulaktionen:** in **App Modules** und **System Modules** jeweils Install/Activate/Deactivate/Uninstall sowie Details/Reload bedienen; genau eine Aktion, sichtbarer Success/Error und korrekter Lifecycle müssen folgen.
3. Erst wenn 1 und 2 live bestanden sind, die verbleibende gesammelte Abnahme fortsetzen: Profile/Privacy, Settings-Sofortupdate, Admin Shell/Scroll, Management-Editoren, User-/Device-Projektion, Sessions, Database/Backup-Testfeedback, die bisherigen PASS-Regressionen, Field Notes und Host-Gates.

Beide Hotfixpunkte sind nach Code- und Testabschluss weiterhin **OPERATOR RETEST REQUIRED**. Kein Production Restore und kein automatischer Core Freeze.
