# Neutral – optionale Systemmodule

**Status:** VERBINDLICHER ZIELVERTRAG MIT GETRENNTEM CODE-/LIVE-IST
**Geprüft:** 2026-09-11

## Gemeinsame Grenze

Core besitzt nur generische Mechanismen. Alle hier beschriebenen Module sind optional, können ohne User-Menü aktiv sein und dürfen unabhängige Module nicht hart koppeln. Permissions autorisieren Aktionen; Visibility/Navigation entscheidet getrennt über sichtbare Einstiege und darf keine Rechte verleihen. Die rollenbezogene Visibility-Matrix ist code-seitig namespaced vorhanden; ihre Betreiber-Liveabnahme steht aus.

## Administrative Modulklassifikation

Für die Admin-Übersicht wird zwischen **App Modules** und **System Modules** unterschieden. Dies ist ausschließlich eine deklarative Klassifikation/Präsentation und **keine zweite Modularchitektur**.

Alle Module verwenden weiterhin denselben:

- Manifestvertrag;
- Registry-/Discovery-Pfad;
- Install-/Register-Lifecycle;
- Activate/Deactivate-Lifecycle;
- Permission-Vertrag;
- API-/Service-/Event-Vertrag;
- Update-/Uninstall-Vertrag.

Die Klassifikation darf Sichtbarkeit nicht ersetzen. Ein Systemmodul kann sichtbare User-Funktionen anbieten; ein User-Modul kann für einzelne Rollen oder vollständig aus der Navigation ausgeblendet werden.

Beispiele für **App Modules**: `gps`, `profile`, `postbox`, `field-notes`.

Beispiele für **System Modules**: `media`, `sharing`, `notifications`, `moderation`; später `referral`/`referral-rewards`.

Die konkrete Manifestform ist `category: user|system` mit backward-kompatiblem Default `user`. Keine parallele Runtime oder Sonderregistry einführen.

| Modul | Verbindliches Ziel | Aktueller Code-/Live-Stand |
|---|---|---|
| `profile` | Displayname, `male`/`female`/`unspecified`, Geburtstag, Avatar, profilbezogene Privacy und Organization-Sharing; Daten bei Deaktivierung behalten | **TEILWEISE:** Manifest, Permissions, GET/PUT-Modulroute, additive Gender-/Avatar-Migration und User-UI-Gating vorhanden. Live registered/inactive; Aktivierung liefert HTTP 500. Upload/Crop/Replace/Delete, runde Darstellung, Gender-Defaults und Disable/Re-enable sind nicht live bewiesen. |
| `media` | sichere generische Uploads, MIME/Größe, sichere IDs/Ziele, Resize/Optimierung, Metadaten, Replace/Delete, Cache und Backup; Traversal/Symlink/Executable-Schutz | **TEILWEISE/FEHLT:** Manifest und Status-Service-Scaffold vorhanden; ältere Core-`user_media`-/Moderationspfade und Backup-V2-Medienprimitives existieren, bilden aber noch keinen vollständigen unabhängigen Modulservice. Live-Install scheitert mit `Load failed`. |
| `sharing` | erweiterbare serverautorisierte Visibility mit Default `private`; Fachmodule registrieren Ressourcen/Felder | **SCAFFOLDING:** Manifest/Status-Service; keine persistente generische Sharing-Engine. Lifecycle live bestanden, danach deaktiviert. |
| `notifications` | In-App und E-Mail, User-/Admin-Kanalwahl, optional sofort/gebündelt | **SCAFFOLDING:** Manifest/Status-Service; keine Zustellengine oder Präferenz-UI. Lifecycle live bestanden, danach deaktiviert. |
| `moderation` | Queue für Text/Bild, `pending/approved/rejected`, Edit/Review/Delete, Filter, optional Auto-Approval | **SCAFFOLDING:** Manifest/Status-Service. Bestehender Core-Media-Moderationspfad ist keine vollständige generische Modulimplementierung. Lifecycle live bestanden, danach deaktiviert. |
| `postbox` | Inbox/Sent, read/unread, compose/reply, User/Mehrfach/Rolle/Gruppe/eigene Organisation, optionale Anhänge; separate Group-/Broadcast-Permissions, serverseitige Org-Grenze und Audit | **SCAFFOLDING:** Manifest deklariert Fähigkeiten und Permissions, aber keine Nachrichten-DB, Versand-/Empfängerlogik, UI oder Auditimplementierung. Lifecycle live bestanden, danach deaktiviert. |
| `referral` / `referral-rewards` | generische Empfehlungen/Rewards: Pay-Referral nach bestätigtem Zahlungseingang direkt belohnen; qualifizierte Free-Referrals über Punkte; Punkte gegen administrativ definierte Premium-Zeit/Rewards; Missbrauchsschutz/Audit | **GEPLANT:** noch kein Modul, kein Manifest und keine Runtime-Implementierung. Darf den Core-Freeze nicht blockieren. |

## Referral-/Rewards-Zielvertrag

Das zukünftige Referral-Modul ist ein **System Module mit optional sichtbarer User-UI**.

Verbindliche Produktregeln:

- Geworbener Pay-User: Reward nach serverseitig bestätigtem Zahlungseingang, keine zusätzliche Aktivitätsprüfung erforderlich.
- Geworbener Free-User: reine Registrierung genügt nicht; Reward-Punkte erst nach konfigurierbaren Aktivitätskriterien.
- Aktivitätskriterien bleiben neutral. Fachmodule liefern nur standardisierte qualifizierende Events/Counts; Referral kennt keine CatchTrack-Fachbegriffe.
- Punkte sind gegen administrativ definierte Rewards einlösbar, z. B. 3 Tage, 7 Tage oder 1 Monat Premium.
- Pay-User erhalten Zeit an bestehende Laufzeit angehängt; bei Free-Usern startet/aktiviert die verdiente Premium-Zeit nach Adminregel.
- Punktwerte, Schwellen, Reward-Katalog, Umtauschraten, Limits und ggf. Cooldowns sind administrativ konfigurierbar.
- Keine Pflichtabhängigkeit zu Profile, Community, Postbox oder Notifications.
- Rewardvergabe serverseitig verifizieren, idempotent ausführen und auditieren; Selbstwerbung/Duplikate verhindern. Für Rückerstattung/Chargeback ist bei späterer Payment-Integration eine eindeutige Policy erforderlich.

## Profilbild-Zielvertrag

User wählt ein Bild, schneidet quadratisch zu, gespeichert wird nur eine optimierte Version bis 256×256; Original wird verworfen. Darstellung ist rund, lokal cachebar und Replace/Delete-fähig. Backup/Restore führt Datei und Metadaten mit. Ohne Bild wird ein nicht pro User gespeicherter neutraler Default nach Gender gerendert. **Code-IST:** der Profile-Service akzeptiert nur bereits quadratische Bild-Data-URLs bis 256 px/256 KiB und speichert sie in `user_profiles.avatar_data`; Browsercrop, generischer Media-Service, runde UI, Default-Avatare und Liveabnahme fehlen.

## Abhängigkeiten

Die optionalen Systemmodule haben keine Pflichtabhängigkeit. Profile nennt Media/Sharing und Postbox Media/Notifications nur optional. Fehlt ein Enhancement, bleibt die Hauptfunktion kontrolliert nutzbar. Field Notes ist als unabhängiges User Module ohne Pflicht- oder optionale Modulabhängigkeit implementiert.

## Compatibility bridge and freeze proof

The remaining Core-owned `user_profiles` baseline and legacy Core media tables are a **compatibility bridge**, not the desired final ownership boundary. The next implementation rounds must remove ambiguity non-destructively rather than claim the bridge complete.

`field-notes` is the code-/test-verified independent freeze proof. It was implemented without edits to existing Core files for product-specific integration; its product implementation consists only of new module files and uses generic Core contracts; operator-live acceptance remains open.

## Classification implementation

App Modules: GPS, Profile, Postbox and reference modules. System Modules: Media, Moderation, Notifications and Sharing. This classification is declarative; it creates no second runtime and does not imply User visibility. Profile's migration is retry-safe and Media's packaged PHP status entry is verified locally, but both lifecycle fixes remain `OPERATOR RETEST REQUIRED`.

## Admin projection after operator repair

The operator-facing names are **App Modules** and **System Modules**, exposed as separate Admin destinations. They filter the same registry and share lifecycle, details, permissions and visibility. Profile install failure compensation is code-complete but remains `OPERATOR RETEST REQUIRED`; successful registration still synchronizes manifest permissions automatically.
