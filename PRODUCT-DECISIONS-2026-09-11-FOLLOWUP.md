# NEUTRAL – Betreiberentscheidungen Follow-up 2026-09-11

**Status:** VERBINDLICHER NEUER PRODUKTINPUT – NACH DEM DOKUMENTATIONS-KONSISTENZLAUF ENTSTANDEN  
**Zweck:** Neue Entscheidungen festhalten, die nach Commit `d950e894f9e99aaac5c395a8a5addad81fdc1f12` im Sprachchat getroffen wurden und daher noch nicht im vorherigen Konsistenzlauf enthalten waren.

Diese Datei ist Input für die autoritativen Verträge gemäß `DOCUMENTATION.md`. Nach Überführung bleibt sie nur als datierter Herkunftsnachweis bestehen.

## 1. Module Administration: Apps / User Modules / System Modules

Die Admin-Navigation unter `Apps & Modules` soll übersichtlicher werden.

Verbindliche Entscheidung:

- Apps bleiben eine eigene Kategorie.
- Module werden administrativ zusätzlich in **User Modules** und **System Modules** gegliedert.
- Diese Gliederung ist **keine zweite Runtime-Architektur**. Alle Module verwenden weiterhin denselben Modulvertrag, dieselbe Registry, denselben Lifecycle, dieselben Permissions und dieselben Install-/Activate-/Deactivate-Mechanismen.
- Die Unterscheidung ist eine deklarative Klassifikation/Präsentationsmetadaten-Eigenschaft des Moduls und dient der Admin-Übersicht.
- Ein Systemmodul kann durchaus sichtbare User-Funktionen liefern; die Klassifikation beschreibt primär seinen technischen/architektonischen Charakter, nicht zwingend seine Sichtbarkeit.
- Sichtbarkeit bleibt separat über `Visibility/Navigation` gesteuert und darf nicht aus der Klassifikation abgeleitet werden.

### Beispiele

**User Modules** – primär direkte Endnutzerfunktion:

- GPS
- Profile
- Postbox
- spätere Fachmodule wie Field Notes

**System Modules** – primär technische/generische Capability oder Plattformfunktion:

- Media & Upload
- Moderation
- Notifications
- Sharing & Visibility

Die konkrete Klassifikation soll im Manifest oder einer gleichwertigen zentralen Modulmetadaten-Struktur sauber deklarierbar sein, z. B. `category: user|system` oder äquivalent. Keine harte Sonderbehandlung im Core erzeugen.

### Admin-UX

Unter `Apps & Modules` soll der Admin mindestens klar unterscheiden können:

1. Apps
2. User Modules
3. System Modules

Ziel ist bessere Übersichtlichkeit, insbesondere bei wachsender Modulzahl. Filter/Abschnitte/Tabs sind zulässig, solange Mobile-First und konsistente Navigation erhalten bleiben.

## 2. Referral / Rewards als zukünftiges optionales Systemmodul

Ein zukünftiges neutrales Modul für Empfehlungen und Belohnungen wird vorgesehen.

Arbeitsname/Modul-Key: `referral` oder `referral-rewards` – endgültigen Key bei Implementierung festlegen.

### Neutralitätsprinzip

- Kein CatchTrack-spezifischer Code im Core.
- Das Modul soll generisch für verschiedene Apps nutzbar sein.
- Es arbeitet mit Usern, Paketen/Entitlements, Laufzeiten und optional Punkten.
- Es darf sichtbare User-UI besitzen, wird architektonisch aber als **System Module** eingeordnet, weil es technische Entitlement-/Reward-Logik bereitstellt.
- Keine harte Abhängigkeit zu Profile, Community, Postbox oder Notifications. Diese dürfen optional als Enhancement genutzt werden.

### Referral-Fälle

#### Geworbener Pay-User

- Wird ein neuer User über einen Referral-Link/-Code geworben und schließt anschließend ein bezahltes Paket ab, wird die Belohnung erst nach **erfolgreich bestätigtem Zahlungseingang** freigegeben.
- Danach ist keine zusätzliche Aktivitätsprüfung notwendig, weil die bezahlte Mitgliedschaft selbst als qualifizierendes Ereignis gilt.
- Beispielbelohnung: ein Monat Premium bzw. eine administrativ definierte Laufzeitverlängerung.
- Ist der Werber bereits Pay-User, wird die Zeit an seine bestehende Laufzeit angehängt.
- Ist der Werber Free-User, startet/aktiviert die verdiente Premium-Zeit nach den administrativ definierten Regeln.

#### Geworbener Free-User

- Eine reine Registrierung genügt nicht.
- Der geworbene Free-User muss definierte Aktivitätskriterien erfüllen, bevor der Werber Punkte erhält.
- Aktivitätskriterien sind administrativ konfigurierbar, z. B.:
  - Mindestanzahl aktiver Tage;
  - Mindestanzahl qualifizierter Einträge/Uploads/Aktionen;
  - weitere appseitig registrierte qualifizierende Events.
- Das Referral-Modul kennt die fachlichen Details dieser Events nicht; Fachmodule liefern nur standardisierte qualifizierende Ereignisse/Counts über einen generischen Vertrag.

### Punkte und Einlösung

- Für qualifizierte Free-Referrals werden Punkte gutgeschrieben.
- Punkte können gegen Premium-Zeit oder andere generische Rewards eingelöst werden.
- Beispielhafte, aber vollständig administrativ konfigurierbare Rewards:
  - 3 Tage Premium
  - 7 Tage Premium
  - 1 Monat Premium
- Punktwerte, Schwellen, Reward-Katalog und Umtauschraten werden im Admin konfiguriert.
- Keine feste CatchTrack-Logik in das Modul einbauen.

### Missbrauchsschutz

Bei späterer Implementierung mindestens berücksichtigen:

- Reward erst nach serverseitig verifiziertem Qualifying Event;
- keine Belohnung für Selbstwerbung oder offensichtliche Duplikate;
- idempotente Reward-Vergabe;
- nachvollziehbarer Audit-Trail;
- konfigurierbare Limits/Cooldowns, falls erforderlich;
- Payment-Reward erst nach bestätigter Zahlung, bei Rückerstattung/Chargeback muss eine klare Policy existieren.

## 3. Priorität

Diese Entscheidungen ändern nicht die aktuelle Freeze-Reparaturreihenfolge.

Vor Referral-Implementierung bleiben die bekannten Core-/Lifecycle-Gates vorrangig:

1. Profile Activation 500
2. Media Install `Load failed`
3. Unlimited Devices / `2 of 0`
4. User Login Eye
5. mobile User List/Edit
6. Module Visibility/Navigation pro Rolle
7. Apps/User Modules/System Modules Admin-Klassifikation
8. Live-Retest
9. Field Notes als no-Core-change Freeze-Proof

Referral/Rewards ist als späteres optionales Systemmodul dokumentiert und soll den Core-Freeze nicht unnötig blockieren.
