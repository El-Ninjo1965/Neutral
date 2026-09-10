# Neutral – optionale Systemmodule

**Status:** VERBINDLICHER ZIELVERTRAG MIT GETRENNTEM CODE-/LIVE-IST
**Geprüft:** 2026-09-11

## Gemeinsame Grenze

Core besitzt nur generische Mechanismen. Alle hier beschriebenen Module sind optional, können ohne User-Menü aktiv sein und dürfen unabhängige Module nicht hart koppeln. Permissions autorisieren Aktionen; Visibility/Navigation entscheidet getrennt über sichtbare Einstiege und darf keine Rechte verleihen. Die rollenbezogene Visibility-Matrix ist **GEPLANT/FEHLT**.

| Modul | Verbindliches Ziel | Aktueller Code-/Live-Stand |
|---|---|---|
| `profile` | Displayname, `male`/`female`/`unspecified`, Geburtstag, Avatar, profilbezogene Privacy und Organization-Sharing; Daten bei Deaktivierung behalten | **TEILWEISE:** Manifest, Permissions, GET/PUT-Modulroute, additive Gender-/Avatar-Migration und User-UI-Gating vorhanden. Live registered/inactive; Aktivierung liefert HTTP 500. Upload/Crop/Replace/Delete, runde Darstellung, Gender-Defaults und Disable/Re-enable sind nicht live bewiesen. |
| `media` | sichere generische Uploads, MIME/Größe, sichere IDs/Ziele, Resize/Optimierung, Metadaten, Replace/Delete, Cache und Backup; Traversal/Symlink/Executable-Schutz | **TEILWEISE/FEHLT:** Manifest und Status-Service-Scaffold vorhanden; ältere Core-`user_media`-/Moderationspfade und Backup-V2-Medienprimitives existieren, bilden aber noch keinen vollständigen unabhängigen Modulservice. Live-Install scheitert mit `Load failed`. |
| `sharing` | erweiterbare serverautorisierte Visibility mit Default `private`; Fachmodule registrieren Ressourcen/Felder | **SCAFFOLDING:** Manifest/Status-Service; keine persistente generische Sharing-Engine. Lifecycle live bestanden, danach deaktiviert. |
| `notifications` | In-App und E-Mail, User-/Admin-Kanalwahl, optional sofort/gebündelt | **SCAFFOLDING:** Manifest/Status-Service; keine Zustellengine oder Präferenz-UI. Lifecycle live bestanden, danach deaktiviert. |
| `moderation` | Queue für Text/Bild, `pending/approved/rejected`, Edit/Review/Delete, Filter, optional Auto-Approval | **SCAFFOLDING:** Manifest/Status-Service. Bestehender Core-Media-Moderationspfad ist keine vollständige generische Modulimplementierung. Lifecycle live bestanden, danach deaktiviert. |
| `postbox` | Inbox/Sent, read/unread, compose/reply, User/Mehrfach/Rolle/Gruppe/eigene Organisation, optionale Anhänge; separate Group-/Broadcast-Permissions, serverseitige Org-Grenze und Audit | **SCAFFOLDING:** Manifest deklariert Fähigkeiten und Permissions, aber keine Nachrichten-DB, Versand-/Empfängerlogik, UI oder Auditimplementierung. Lifecycle live bestanden, danach deaktiviert. |

## Profilbild-Zielvertrag

User wählt ein Bild, schneidet quadratisch zu, gespeichert wird nur eine optimierte Version bis 256×256; Original wird verworfen. Darstellung ist rund, lokal cachebar und Replace/Delete-fähig. Backup/Restore führt Datei und Metadaten mit. Ohne Bild wird ein nicht pro User gespeicherter neutraler Default nach Gender gerendert. **Code-IST:** der Profile-Service akzeptiert nur bereits quadratische Bild-Data-URLs bis 256 px/256 KiB und speichert sie in `user_profiles.avatar_data`; Browsercrop, generischer Media-Service, runde UI, Default-Avatare und Liveabnahme fehlen.

## Abhängigkeiten

Alle sechs Manifeste haben keine Pflichtabhängigkeit. Profile nennt Media/Sharing und Postbox Media/Notifications nur optional. Fehlt ein Enhancement, bleibt die Hauptfunktion kontrolliert nutzbar. Field Notes bleibt das spätere separate Freeze-Gate und wurde nicht implementiert.

## Compatibility bridge and freeze proof

The remaining Core-owned `user_profiles` baseline and legacy Core media tables are a **compatibility bridge**, not the desired final ownership boundary. The next implementation rounds must remove ambiguity non-destructively rather than claim the bridge complete.

`field-notes` remains the later independent freeze proof and must be implemented **without edits to existing Core files** for product-specific integration. It is not part of the present codebase.
