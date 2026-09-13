# NEUTRAL – User / Account / License / Privacy Model

**Status:** VERBINDLICHER ZIELVERTRAG
**Geprüft:** 2026-09-13

## Identität und Profil

Technische Identität, Profil, Rollen/Permissions, Packages/Entitlements und Licenses/Organizations bleiben getrennt. Profile ist optional und keine Voraussetzung für Login, RBAC, Package oder License.

Ein User benötigt Username, initiales Passwort und Rolle; E-Mail ist optional. Username ist installationsweit eindeutig. Passwörter haben 8–25 Zeichen, keine Leerzeichen und werden sicher gehasht gespeichert. Accountstatus ist `active` oder `blocked`.

Private Profildaten sind standardmäßig nicht freigegeben. Öffentliche Darstellung verwendet nur ausdrücklich freigegebene Werte. Organization-Sharing ist widerrufbar und nur bei aktiver Organization-Zuordnung zulässig.

## Rollen und Entitlements

Rollen beschreiben administrative Identität. Permissions autorisieren einzelne technische Fähigkeiten. Packages bestimmen funktionalen Umfang und Limits. Licenses/Organizations ordnen Package, User und delegierte Verwaltung zusammen.

Ein Organization-Manager ist kein System-Admin und bleibt auf seine eigene Organisation begrenzt.

Ein direktes User-Package bleibt möglich. Bei aktiver License-Mitgliedschaft ist deren Package autoritativ; danach greift das direkte Package wieder. Clients erhalten direkte und effektive Package-Information getrennt.

## Geräte

Geräteidentität basiert auf einer zufälligen persistenten Installations-ID, nicht auf Browser, Betriebssystem oder Hardwarefingerprint.

Gerätelimits unterscheiden geerbten Default, positiven numerischen Override und `unlimited`. Ein persistentes Unlimited darf niemals zu numerisch `0` umgedeutet werden. User-Override hat Vorrang, danach License/Package, direktes Package und Systemfallback.

Ein abgesenktes Limit widerruft bestehende Installationen nicht automatisch, blockiert aber zusätzliche Aktivierung bis Nutzung und Limit wieder zusammenpassen.

## Sessions

User-Sessions bleiben bis Logout, Revoke/Replacement oder Security-/Account-Invalidierung aktiv. `last_seen_at` ist Aktivitätsmetadatum, kein Ablaufdatum. Admin-Sessions dürfen einen endlichen Sicherheitsablauf besitzen. Erneuter Login derselben Installation ersetzt die vorherige aktive Session desselben Scopes.

## Administration und Privacy

Adminansichten führen User-ID, Username, optionale E-Mail, Rolle, Status, Aktivität und Device-Nutzung. Organization und Package werden getrennt dargestellt. User-ID und Username bleiben Identitätswerte.

Viewer ohne Login bleiben anonym. Installationsstatistik basiert nur auf Serverkontakt und aggregierten Kennzahlen; Standortdaten und Hardwarefingerprints sind ausgeschlossen.

Medien, Moderation, Messaging/Postbox und Marketplace bleiben optionale Module. Sie verwenden generische Identitäts-, Privacy-, Permission- und Entitlement-Verträge und dürfen keine produktspezifische Core-Sonderlogik einführen.

Minimale Datenerhebung, widerrufbare Freigaben, serverseitige Autorität, keine automatische Veröffentlichung privater Daten und keine Klartextpasswörter sind verbindlich.

Aktueller Implementierungs-/Live-Stand steht ausschließlich in `STATUS.md` und `CHATGPT.md`.