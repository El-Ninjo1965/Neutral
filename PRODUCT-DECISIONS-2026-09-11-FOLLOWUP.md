# NEUTRAL – Betreiberentscheidungen Follow-up 2026-09-11

**Status:** HISTORISCHER PRODUKTINPUT – IN VERTRÄGE UND IMPLEMENTIERUNG ÜBERFÜHRT; OPERATOR-RETEST OFFEN
**Zweck:** Neue Entscheidungen festhalten, die nach Commit `d950e894f9e99aaac5c395a8a5addad81fdc1f12` im Sprachchat getroffen wurden und daher noch nicht im vorherigen Konsistenzlauf enthalten waren.

Diese Datei bleibt als datierter Herkunftsnachweis bestehen. Die autoritativen Verträge und der aktuelle Reteststatus stehen in den gemäß `DOCUMENTATION.md` zuständigen Dateien.

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
- Aktivitätskriterien sind administrativ konfigurierbar, z. B. Mindestanzahl aktiver Tage, qualifizierter Einträge/Uploads/Aktionen oder weitere appseitig registrierte qualifizierende Events.
- Das Referral-Modul kennt die fachlichen Details dieser Events nicht; Fachmodule liefern nur standardisierte qualifizierende Ereignisse/Counts über einen generischen Vertrag.

### Punkte und Einlösung

- Für qualifizierte Free-Referrals werden Punkte gutgeschrieben.
- Punkte können gegen Premium-Zeit oder andere generische Rewards eingelöst werden.
- Beispielhafte, administrativ konfigurierbare Rewards: 3 Tage, 7 Tage oder 1 Monat Premium.
- Punktwerte, Schwellen, Reward-Katalog und Umtauschraten werden im Admin konfiguriert.
- Keine feste CatchTrack-Logik in das Modul einbauen.

### Missbrauchsschutz

Bei späterer Implementierung mindestens berücksichtigen: serverseitig verifiziertes Qualifying Event, keine Selbstwerbung/offensichtliche Duplikate, idempotente Reward-Vergabe, Audit-Trail, konfigurierbare Limits/Cooldowns und klare Refund-/Chargeback-Policy.

## 3. Priorität

Referral/Rewards bleibt ein späteres optionales Systemmodul und blockiert den Core-Freeze nicht.

## 4. Neuer Betreiberbefund: User-Login-Eye erneut live fehlgeschlagen

Nach dem Reparatur-/Deploymentlauf bis Commit `a9bccf807e7f0bd736e01c88404db613737cd82f` wurde der User-Login erneut real auf dem Betreiber-iPad mit Chrome geprüft.

**Livebefund:** Das Eye ist weiterhin weder im normalen Browserbetrieb noch im privaten/Inkognito-Betrieb sichtbar. Damit ist der bisherige Fix ausdrücklich **NICHT LIVE BESTANDEN**.

Der aktuelle Code versucht den Eye-Button nach dem dynamischen Login-Render über `NeutralUiFeedback.enhancePasswordFields(content)` in den DOM einzusetzen und enthält zusätzliche Self-Heal-/CSS-Absicherungen. Dieser Ansatz hat trotz lokaler Tests und erfolgreichem Deployment den realen Betreibercheck wiederholt nicht bestanden.

### Neue verbindliche UX-/Implementierungsentscheidung

Für den normalen User-Login wird der Eye-Toggle künftig **direkt als fester Bestandteil des gerenderten Login-Markups** erzeugt, analog zum zuverlässig funktionierenden Admin-Login-Muster.

- Passwortfeld und Eye-Button werden gemeinsam gerendert; die Existenz des Buttons darf nicht von nachträglicher DOM-Anreicherung, MutationObserver oder Timing abhängen.
- Der bestehende gemeinsame Password-Visibility-Vertrag/Helper darf und soll weiterhin die Interaktion steuern: `password` ↔ `text`, open/crossed-eye SVG, `aria-label`, `aria-pressed`, Fokus und Touchziel.
- Kein zweiter fachlicher Password-Helper und keine divergierende User-/Admin-Semantik.
- Die generische dynamische Enhancement-Funktion kann für tatsächlich dynamische Formulare als Fallback erhalten bleiben, darf aber für die bloße Existenz des User-Login-Eyes nicht mehr erforderlich sein.
- Nach Umsetzung browsernah testen, dass der Button bereits unmittelbar mit dem Login-Control vorhanden ist und funktioniert.
- Auch dieser neue Fix bleibt bis zum erneuten Betreibercheck auf iPad/Chrome normal + privat `OPERATOR RETEST REQUIRED`.

## 5. Gesammelte Live-Abnahme erst nach den nächsten Änderungen

Der Betreiber führt die übrigen Live-Retests bewusst erst gesammelt nach Abschluss der unmittelbar folgenden Änderungen durch, um wiederholte Tests während weiterer Deployments zu vermeiden.

Bis dahin bleiben insbesondere Profile Lifecycle, Media Lifecycle, Unlimited Devices, User Management List/Create/Edit, Module Visibility/Klassifikation sowie Lifecycle-/GPS-Regression als `OPERATOR RETEST REQUIRED` dokumentiert. Keine dieser lokalen Reparaturen darf vor dem realen Betreibercheck als live bestanden markiert werden.

Field Notes bleibt anschließend der separate no-Core-change Freeze-Proof.