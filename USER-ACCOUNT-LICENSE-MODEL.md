# NEUTRAL – User / Account / License / Privacy Model

**Status:** VERBINDLICHES LANGFRISTIGES ZIELBILD  
**Datum:** 2026-09-09  
**Autorität:** untergeordnet zu `VISION.md` und `CORE-1.0.md`, aber verbindlich für spätere Account-, Lizenz-, Profil-, Privacy-, Device-, Messaging- und Moderationsarbeit.

## 1. Zweck

Dieses Dokument trennt die künftig benötigten Konzepte sauber voneinander, damit spätere Apps wie CatchTrack, Vereinslösungen, Community- oder Marketplace-Module dieselben neutralen Verträge verwenden können.

Der Core stellt nur generische Infrastruktur bereit. Produkt-/Fachlogik bleibt in Modulen.

---

## 2. Identität und Login

### Pflicht beim Anlegen

Ein neuer User soll im einfachsten Fall mit nur folgenden Pflichtwerten angelegt werden können:

- `username`
- initiales Passwort
- Rolle

E-Mail ist **nicht verpflichtend**.

### Benutzername

- global eindeutig innerhalb der Installation;
- case-normalisiert und serverseitig eindeutig geprüft;
- verständliche Fehlermeldung, wenn bereits vergeben;
- dient als primärer Login-Identifier.

### E-Mail

- optional;
- falls vorhanden zusätzlich als Login-Identifier zulässig;
- niemals öffentlich angezeigt;
- nur im geschützten Adminbereich bzw. nach expliziter Profilfreigabe sichtbar;
- spätere Recovery-/Benachrichtigungsfunktionen dürfen sie nutzen, wenn der User sie freiwillig hinterlegt.

### Passwort

Verbindliche Passwortpolitik:

- Mindestlänge: **8 Zeichen**;
- Maximallänge: **25 Zeichen**;
- **keine Leerzeichen**;
- keine Pflicht für Großbuchstaben, Kleinbuchstaben, Zahlen oder Sonderzeichen;
- Sonderzeichen dürfen freiwillig verwendet werden;
- ausschließlich serverseitig sicher gehasht speichern;
- keine Speicherung oder Anzeige im Klartext;
- Initialpasswort kann vom Lizenz-/Organisationsverwalter vergeben werden; User kann es danach selbst ändern;
- Rate-Limiting/Throttle gegen automatisierte Loginversuche bleibt verpflichtend.

Diese Regeln gelten einheitlich für Benutzeranlage, Passwortänderung und alle späteren Reset-/Initialpasswortpfade.

---

## 3. Accountstatus

Der operative Userstatus soll einfach bleiben:

- `active`
- `blocked`

`inactive` wird nicht als manuell gepflegter Status benötigt; Inaktivität ergibt sich aus `lastActivityAt`.

Weitere technische Zustände wie `pending`, `archived` oder Migrations-/Legacywerte dürfen intern existieren, sollen aber nicht ohne realen Nutzen die normale Admin-UX verkomplizieren.

Blockierung ist eine bewusste administrative Maßnahme und muss auditierbar sein.

---

## 4. Profil-Ebenen

### 4.1 Login-/Accountdaten

- Username
- Passwort
- optionale E-Mail

### 4.2 Privates Profil

Optional:

- Display Name
- Telefonnummer
- E-Mail
- Adresse
- Geburtstag
- Profilbild lokal oder serverseitig, je nach Entitlement

Jedes Feld bleibt standardmäßig privat.

### 4.3 Öffentliches Profil

Öffentliche Identität verwendet einen separaten Nickname/Handle, z. B. `FishMaster`.

Öffentliche Posts, Ranglisten oder Communityansichten dürfen nicht automatisch echten Namen, E-Mail, Adresse oder andere private Felder anzeigen.

---

## 5. Privacy-Freigaben

Für private Profildaten gelten **explizite, feldweise, widerrufbare** Freigaben.

Beispiele:

- Telefonnummer für Verein freigeben
- E-Mail für Verein freigeben
- Adresse für Verein freigeben
- Geburtstag für Verein freigeben

Default ist immer **aus**.

Freigabe an eine Organisation bedeutet nicht öffentliche Freigabe.

Öffentliche Freigaben sind separat.

---

## 6. Settings-Struktur

`Settings` erhält eine sichtbare Unter-Navigation direkt unter dem Seitentitel, keine Dropdowns.

Mindestens:

- `App Areas`
- `Navigation`
- `Privacy & Sharing`
- `Profile`

Die Unter-Navigation ist Teil der Settings-Seite, nicht der globalen Hauptnavigation.

Speichern bleibt auf der aktuellen Settings-Unterseite. Erfolgsbestätigung darf den User nicht auf Start zurückleiten.

---

## 7. Rollen, Permissions und Entitlements

Diese Konzepte dürfen nicht vermischt werden.

### Rolle

Sicherheits-/Administrationsidentität, z. B.:

- Admin
- Developer
- User
- weitere selbst definierte Rollen

### Permission

Technische Einzelberechtigung, serverseitig autoritativ geprüft.

### Paket / Entitlement

Kommerzieller/funktionaler Umfang, z. B. Basic, Silver, Gold, Pro. Paketnamen sind konfigurierbar und keine festen Corebegriffe.

Ein Paket kann bestimmen:

- verfügbare Module
- nutzbare Aktionen
- Uploadrechte
- Messagingrechte
- Mengenlimits
- Geräte-/Seat-Limits
- Marketplace-Limits

Nicht enthaltene Module dürfen sichtbar, aber deaktiviert angezeigt werden, mit Hinweis auf das benötigte Paket.

### Lizenz / Organisation

Eine Lizenz besitzt:

- Paket
- Anzahl Seats/Geräte
- zugeordnete User
- optional einen Lizenz-/Organisationsverwalter

Beispiel: Angelverein mit 50 Seats.

---

## 8. Delegierte Lizenzverwaltung

Ein Lizenz-/Organisationsverwalter ist **kein System-Admin**.

Er darf nur innerhalb seiner eigenen Lizenz:

- User anlegen
- initiale Passwörter vergeben
- Seats/Geräte zuordnen
- Geräte freigeben/widerrufen
- ausgeschiedene User entfernen/blockieren
- nur freigegebene Profildaten sehen
- Nutzung/letzte Aktivität der eigenen User sehen

Er darf nicht:

- Core-Rollen oder Systempermissions ändern
- fremde Organisationen sehen
- globale Einstellungen ändern
- Server-/Backup-/Audit-/Systemadministration ausführen

---

## 9. Device-/Seat-Modell

Eindeutigkeit entsteht durch zufällige persistente Installations-ID, nicht durch `macOS`, `iPadOS`, Chrome, Safari oder Hardwarefingerprints.

Je Lizenz/User sollen verwaltbar sein:

- `allowedDevices`
- `usedDevices`
- aktive Geräte
- letzte Aktivität pro Gerät
- Gerätebezeichnung/Plattform nur zur Anzeige
- Widerruf einzelner Installationen

Sonderrollen wie Admin/Developer können `unlimited` erhalten.

Ein User darf bei erreichtem Limit kein zusätzliches Gerät aktivieren, bevor eine bestehende Installation freigegeben wurde oder das Lizenzlimit erhöht wird.

---

## 10. User Management – Zielanzeige

Adminübersicht soll mindestens enthalten:

- User ID
- Username
- optionale E-Mail
- Rolle
- Status `active/blocked`
- Created
- Last Activity
- Used / Allowed Devices
- Edit / Block / Delete je Permission

Drill-down zeigt die registrierten Geräte/Installationen.

---

## 11. Anonyme Viewer-/Installationsstatistik

Viewer ohne Login bleiben anonym.

Gezählt wird nur eine Installation, die tatsächlich den Server kontaktiert. Offline-Nutzung ohne Serverkontakt bleibt unsichtbar.

Zulässige aggregierte Kennzahlen:

- bekannte Installationen gesamt
- aktiv heute
- aktiv 7 Tage
- aktiv 30 Tage
- anonymous/viewer
- authenticated

Keine Hardwarefingerprints, keine Standortdaten, keine unnötigen personenbezogenen Daten.

---

## 12. Profilbilder und generischer Medienworkflow

### Lokal

Ein User darf lokal ein Bild auswählen, wenn die App dies anbietet. Ohne Serverupload bleibt es private Endgerätedatei.

### Serverupload

Nur wenn Paket/Permission dies erlaubt:

1. clientseitig optimieren, soweit technisch sinnvoll;
2. serverseitig MIME/Abmessungen/Dateigröße/Decode sicher validieren;
3. serverseitig normalisieren/optimieren;
4. Status `pending`;
5. erst nach Moderation öffentlich/organisationsweit sichtbar.

### Moderation

Status:

- pending
- approved
- rejected
- deleted

Ablehnung:

- Standardgrund
- optionale Adminnotiz
- User erhält verständlichen Hinweis

System führt Moderationshistorie, Anzahl abgelehnter Inhalte und Verwarnungen.

---

## 13. Moderation und Sperren

Wiederholter Missbrauch soll sichtbar sein, ohne externe Listen führen zu müssen.

Pro User mindestens:

- rejectedContentCount
- warningCount
- lastModerationAt
- Moderationshistorie

Admin kann nach eigenem Ermessen verwarnen oder Account blockieren.

Automatische Sperren nur, wenn später ausdrücklich als Policy definiert.

---

## 14. Inbox / Messaging – Zukunftsvertrag

Messaging ist generische Plattforminfrastruktur und soll später von Community, Vereinen und Marketplace genutzt werden.

Basis:

- Textnachrichten
- serverseitige maximale Länge
- Rate Limit gegen Spam
- Blockieren und Melden anderer User
- Admin-/Organisationsnachrichten
- Rundnachrichten innerhalb eines erlaubten Scopes

Bilder/Anhänge sind **nicht** automatisch Bestandteil des Basischats. Sie dürfen paket-/permissionabhängig ergänzt werden und unterliegen dann dem Medien-/Moderationsvertrag.

Ein starres Tageslimit ist nicht erforderlich; Schwerpunkt ist Anti-Spam-Rate-Limiting.

---

## 15. Marketplace – ausdrücklich Modul

Marketplace ist kein Corebestandteil.

Ein späteres Marketplace-Modul kann generische Verträge verwenden für:

- Useridentität/Nickname
- Messaging
- Medienupload
- Moderation
- Paketlimits
- Anzahl Inserate

Beispiel: kostenloses Paket erlaubt bis zu drei private Inserate. Solche Werte gehören in Entitlements/Limits, nicht in Core-Fachcode.

---

## 16. Security-/Privacy-Grundregel

- minimale Datenerhebung
- explizite Freigabe
- Freigaben widerrufbar
- Server ist Autorität
- keine versteckten Uploads
- keine öffentliche Darstellung privater Profildaten
- keine Gerätefingerprints
- keine Klartextpasswörter
- Uploads standardmäßig nicht öffentlich
- delegierte Administratoren sehen nur ihren Scope

---

## 17. Umsetzungsreihenfolge

Vor Core-Freeze sinnvoll:

1. User-/Accountmodell bereinigen
2. Profil-/Privacy-Grundvertrag
3. Entitlement-/Lizenz-/Device-Limit-Grundlage
4. delegierter Lizenzadmin-Scope
5. Installationsstatistik
6. generischer Medien-/Moderationsvertrag dokumentarisch und nur notwendige Core-Schnittstellen

Später als Module/Featurephasen:

- Community
- Messaging-Ausbau
- Marketplace
- CatchTrack-Fachlogik
- GPS Pro

## Device-limit origin precision (2026-09-10)

Effective device limits carry an explicit mode rather than overloading SQL `NULL`: package default, license numeric/unlimited, or user numeric/unlimited. Removing a user override restores license/package derivation. Lowering an effective limit never revokes established installations; it blocks additional activation until an authorized explicit revoke brings usage within the limit.
