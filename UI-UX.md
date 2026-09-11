# NEUTRAL – UI/UX-Zielbild

## Verbindliche Nachträge und Livegrenzen (2026-09-11)

- **Module Administration:** Permissions und rollenbezogene Visibility/Navigation sind getrennte Konzepte. Pro relevanter Rolle (Admin, Developer, User, Viewer) muss konfigurierbar werden, ob ein Modul/User-Einstieg sichtbar ist; dies verleiht niemals Serverrechte. Systemmodule dürfen aktiv und User-unsichtbar sein. **IST:** globale Manifestpräsentation plus Permissionfilter; rollenbezogene Visibility-UI fehlt.
- **User Management mobil:** Liste und Create/Edit werden getrennte Ansichten/States. Edit blendet die lange Liste aus; Save und Cancel/Back führen kontrolliert zurück. **IST:** beide Contentblöcke stehen noch in derselben Ansicht.
- **Profile:** Ziel sind Gender, Geburtstag und runder Avatar mit Upload/Crop/Replace/Delete und dynamischem Gender-Default. **IST:** Genderfeld und serverseitige begrenzte Data-URL-Grundlage vorhanden; vollständige Avatar-UX fehlt, Profile ist live nicht aktivierbar.
- **Password Eye:** Der User Login rendert Password-Control und Eye gemeinsam; der zentrale Helper bindet Interaktion/ARIA und ergänzt andere dynamische Felder nur als Fallback. Der vorherige dynamische Ansatz ist **LIVE NICHT BESTANDEN**; der statische Ersatz bleibt bis iPad/Chrome normal + privat **OPERATOR RETEST REQUIRED**.
- **Unlimited:** `unlimited` muss als unbegrenzt erscheinen, nie als numerische Null oder `0 sessions`. **LIVE NICHT BESTANDEN:** Login blockierte einen zweiten Sessionfall und zeigte sinngemäß `2 of 0`.

---

**Status:** VERBINDLICHES LANGFRISTIGES DESIGN- UND UX-ZIELBILD

## Grundprinzipien

NEUTRAL soll als Grundlage unterschiedlicher Produkt-Apps eine außergewöhnlich hochwertige User Experience ermöglichen. Ziel ist keine Punktzahl, sondern eine App, die sich schnell, klar, vertrauenswürdig, individuell passend und ohne unnötige Bedienhürden anfühlt.

**UI** bezeichnet die sichtbare Gestaltung. **UX** bezeichnet die gesamte Nutzungserfahrung einschließlich Orientierung, Geschwindigkeit, Rückmeldung und Fehlertoleranz.

## Produktdesign und zentrales Designsystem

Das Grunddesign einer konkreten Produkt-App wird typischerweise beim Setup festgelegt und bleibt danach grundsätzlich stabil. Unterschiedliche Produkt-Apps dürfen unterschiedliche Farben, Typografie, Buttonformen, Radien, Abstände und Layouts besitzen. Admin/Developer dürfen Appearance später gezielt korrigieren oder überarbeiten.

Das Framework stellt die gemeinsame Designsprache bereit. Zentrale Design-Tokens bzw. äquivalente Variablen sollen Farben, Hintergründe, Typografie, Abstände, Radien, Rahmen, Schatten, Buttons, Formulare, Karten, Zustände und responsive Layoutparameter abbilden.

**Module liefern ihre Fachfunktion, nicht ihr eigenes unabhängiges Produktdesign.** Module verwenden veröffentlichte UI-Komponenten und Designverträge des Frameworks. Modulspezifisches CSS ist nur für fachlich spezielle Darstellung vorgesehen und ergänzt das Framework, statt dessen globale Designsprache unnötig zu überschreiben.

Custom CSS kann als Expertenfunktion für Administrator/Developer vorgesehen werden, ist aber nicht der primäre Weg der normalen Designkonfiguration.

## User-App ist Produkt, nicht Developer-Oberfläche

Die sichtbare User-App wird konsequent aus Sicht des Endnutzers gestaltet. Das Neutral-Framework soll im normalen Nutzerbetrieb möglichst unsichtbar bleiben.

Technische Framework-, Modul- und Entwicklungsinformationen gehören in Admin-/Developer-Kontexte und nicht dauerhaft in die User-App, sofern sie keinen unmittelbaren Nutzen für den Endnutzer besitzen.

Insbesondere gelten als unerwünschte Standardbestandteile der User-App:

- dauerhafte Anzeige des aktuell angemeldeten Benutzernamens im Hauptheader, wenn die Produkt-App dafür keinen fachlichen Grund besitzt;
- technische Bezeichnungen wie `Active Application`;
- technische Workspace-Bezeichnungen wie `Local Workspace`;
- Modulanzahlen oder ähnliche interne Framework-/Discovery-Statuszahlen;
- technische Manifest-, Modul-, Runtime- oder Entwicklungsinformationen;
- generische Developer-Dashboards als normale Startansicht.

Diese Informationen dürfen weiterhin im Admin-/Developerbereich verfügbar sein, wenn sie dort für Betrieb, Diagnose oder Konfiguration sinnvoll sind.

Die User-App soll nach dem Öffnen unmittelbar die eigentliche Produktfunktion, die konfigurierte Startseite oder eine bewusst gestaltete neutrale Produkt-Startansicht zeigen.

## Produktbranding und App-Identität

Neutral darf ein eigenes Default-Branding für Entwicklung, Setup und unveränderte Framework-Installationen besitzen. Eine daraus erzeugte Produkt-App muss dieses Branding jedoch einfach ersetzen können.

Produktbezogen konfigurierbar bzw. austauschbar sollen mindestens sein:

- sichtbarer Application Name;
- App-/Produktlogo bzw. Icon;
- das aktuelle Neutral-`N` als Default/Platzhalter;
- Farben und weitere zentrale Appearance-Werte;
- später für PWA/Store-App relevante Icons und Branding-Assets über einen konsistenten Produktvertrag.

Das Neutral-`N` darf deshalb nicht als unveränderliche Identität in der User-App fest verdrahtet werden. Das Framework bleibt Neutral; die daraus erzeugte App zeigt die Identität des jeweiligen Produkts.

## Geschwindigkeit

Der bestehende Vertrag `UI zuerst → notwendiger minimaler Core → Hintergrundinitialisierung` bleibt verbindlich.

- App-Shell und lokal verfügbare Oberfläche erscheinen möglichst sofort.
- Netzwerk, Serverauthentifizierung, Synchronisation, Datenbankinitialisierung und Modul-Discovery blockieren den ersten sichtbaren Zustand nicht unnötig.
- Passwörter werden nicht dauerhaft im Client gespeichert.
- Langsame Hintergrundarbeit blockiert die Bedienung nicht unnötig.
- Performance wird auf realistischen Mobilgeräten gemessen.

### Local-first Warmstart und Reload

Für bereits bekannte, gültige und lokal persistierte User-App-Zustände gilt zusätzlich ein strenger Warmstartvertrag:

- Ein vorhandener gültiger lokaler Startseiten-/Homepage-Zustand wird beim erneuten Öffnen, Warmstart oder Browser-Reload **sofort aus lokalem Zustand dargestellt**, soweit keine zwingende Sicherheitsentscheidung einen aktuellen Serverzustand benötigt.
- Die User-App wartet für bereits bekannte darstellbare Inhalte nicht erneut auf eine Serverantwort, bevor sie den ersten sinnvollen Inhalt zeigt.
- Serverabgleich, Aktualitätsprüfung, Session-Refresh, Discovery und andere langsame Arbeit erfolgen danach soweit fachlich möglich im Hintergrund.
- Liefert der Server eine neuere gültige Konfiguration, wird der lokale Zustand kontrolliert aktualisiert und nach dem definierten Vertrag übernommen.
- Ist der Server nicht erreichbar, bleibt der letzte zulässige lokale Zustand nutzbar, sofern Berechtigungs-/Datenschutzregeln dies erlauben.
- Ein sichtbarer `Loading`-Zustand ist beim echten Erststart ohne verwertbaren lokalen Zustand oder bei zwingend unbekanntem Zustand zulässig; er ist **kein normaler Dauerzustand bei jedem Reload**.
- HTML-Startinhalt, lokale Shell und andere bereits bekannte statische/produktbezogene Inhalte sollen nicht durch Netzwerklatenz künstlich verzögert werden.
- Für modulbasierte Startseiten darf nur die tatsächlich erforderliche Modul-/Rechteauflösung den Modulinhalt verzögern; bereits sicher lokal nutzbare Teile der Shell dürfen davon nicht blockiert werden.
- Optimierungen dürfen keine Berechtigungsentscheidung aus einem veralteten authentifizierten Cache ableiten und bestehende Fail-Closed-/P1-Sicherheitsverträge nicht schwächen.

Performanceprobleme werden gemessen und ursächlich untersucht. Ein künstliches Verbergen eines langsamen Startpfads durch Animationen oder Timeouts gilt nicht als Performancekorrektur.

## Visuelle Kommunikation vor unnötigem Text

NEUTRAL verfolgt das UX-Prinzip: **so wenig Text wie sinnvoll, so viel Information wie nötig.**

- International verständliche Symbole und etablierte visuelle Muster werden bevorzugt, wenn ihre Bedeutung eindeutig ist.
- Wiederkehrende Zustände verwenden frameworkweit dieselbe Symbolsprache.
- Module erfinden für gleiche Systemzustände keine eigenen Symbole.
- Kurze Tooltips, Hilfen oder eine zentrale Legende erklären Symbole bei Bedarf, statt dauerhaft lange Erklärungstexte anzuzeigen.
- Text bleibt dort erhalten, wo ein Symbol mehrdeutig wäre, bei kritischen Entscheidungen oder wo Accessibility/Verständlichkeit ihn erfordert.
- Farbe unterstützt die Bedeutung, ist aber niemals der einzige Informationsträger.
- Symbole benötigen geeignete semantische/Screenreader-Beschriftungen.
- Übersetzbare Texte bleiben für alle tatsächlich sprachabhängigen Inhalte vorgesehen.

Der Hauptnutzen dieses Prinzips ist bessere UX, schnellere Erfassbarkeit und geringere Sprachbarrieren. Eine relevante Reduzierung von App-Größe oder Datenvolumen durch weniger UI-Text wird ausdrücklich nicht als technischer Hauptgrund angenommen.

## Einheitliche Sync-Statussprache

Synchronisierbare Objekte sollen ihren Zustand kompakt und ohne wiederholte Erklärungstexte zeigen. Der Core soll dafür langfristig eine gemeinsame Statuskomponente bereitstellen, die alle Module verwenden.

Zielzustände:

- **Synchronisiert:** eindeutiges positives Symbol, z. B. Haken/Marker; Farbe darf unterstützend grün sein.
- **Lokal gespeichert / Synchronisierung ausstehend:** eigenes eindeutiges Pending-Symbol bzw. bewusst definierter visueller Zustand.
- **Synchronisierung läuft:** einheitliches Aktivitäts-/Sync-Symbol.
- **Synchronisierung fehlgeschlagen / Aufmerksamkeit nötig:** eindeutiges Warnsymbol.
- **Nicht synchronisierbar bzw. Sync nicht relevant:** kein Sync-Statussymbol.

Die endgültigen Icons werden im Designsystem festgelegt. Bedeutung darf nicht ausschließlich durch grün/orange/rot vermittelt werden.

## Offline-First aus Nutzersicht

Ein Nutzer darf fachliche Arbeit grundsätzlich auch ohne aktuelle Internetverbindung durchführen, soweit die Funktion keinen zwingend aktuellen Serverzustand benötigt.

Beispielziel für Daten und Medien:

`Aktion/Fotografie → lokal sicher speichern → persistente Sync-Queue → bei geeigneter Verbindung übertragen → Serverbestätigung → lokalen Sync-Status aktualisieren`

- Offline erzeugte Daten und Medien bleiben lokal erhalten.
- Wenn die App geöffnet ist und die Verbindung zurückkehrt, kann die Queue automatisch abgearbeitet werden.
- Eine spätere Store-App soll Betriebssystem-Hintergrundmechanismen für opportunistische Synchronisierung verwenden können.
- Das Betriebssystem entscheidet bei geschlossener App über tatsächliche Hintergrundausführung; sofortige Ausführung wird nicht garantiert.
- Spätestens beim nächsten geeigneten App-Start wird ausstehende Synchronisation wieder aufgenommen.
- Für datenintensive Medien sollen Optionen wie `WLAN + Mobilfunk`, `nur WLAN` oder `manuell` möglich sein, wenn das Produkt dies benötigt.
- Module implementieren nicht jeweils eigene Sync-Engines; sie nutzen einen universellen Core-Sync-/Background-Vertrag.

## Navigation und App-Gefühl

Die User-App soll sich wie eine eigenständige App anfühlen und nicht wie eine Webseite in einer App-Hülle.

- Navigation ist vorhersehbar, app-typisch und möglichst flach.
- Ein generischer sichtbarer `Zurück`-Button auf jeder Seite ist ausdrücklich kein gewünschtes Standardmuster.
- Ein generischer Framework-Back-Link darf nicht als Ersatz für eine echte App-Navigation dienen.
- Zurücknavigation wird kontextbezogen, zentral und später soweit sinnvoll über Plattformnavigation gelöst.
- Module integrieren sich in die zentrale Navigation.
- Wichtige Produktbereiche benötigen klar erkennbare, touchgerechte Navigationselemente bzw. Buttons, wenn sie für den aktuellen Nutzer zugänglich sind.
- Das Fehlen einer sinnvollen sichtbaren Navigation bei gleichzeitig vorhandenen technischen Statusinformationen gilt nicht als fertige User Experience.
- Browsertypische Seitennavigation, technische URL-Sprünge und sichtbar webseitige Hilfskonstruktionen dominieren die UX nicht.

## Startseite und Appearance müssen reale User-App-Wirkung haben

Appearance ist keine reine Admin-Dokumentation. Einstellungen, die ausdrücklich das Erscheinungsbild oder die globale Startseite der User-App steuern, müssen nach erfolgreichem Speichern tatsächlich im vorgesehenen User-App-Lifecycle wirksam werden.

Für die globale Startseite gilt als Zielvertrag:

- `Module`: ein zulässiges aktives/startbares Modul wird als Startziel verwendet;
- `Text / HTML`: der konfigurierte Inhalt wird als Startinhalt dargestellt;
- ungültige oder nicht zugängliche Konfiguration fällt kontrolliert auf den definierten neutralen Produktzustand zurück;
- ein erfolgreich gespeicherter gültiger Wert darf nicht stillschweigend ignoriert werden;
- Reload/Warmstart und später Offline-/Cacheverhalten müssen den dokumentierten Persistenzvertrag respektieren.

Ein Admin-Save ohne entsprechende Wirkung in der User-App gilt nicht als bestandene Feature-Abnahme.

## Progressive Disclosure und kontextbezogene Aktionen

Standardansichten zeigen die wichtigsten Informationen und Aktionen. Erweiterte Optionen, seltene Einstellungen und technische Details werden erst bei Bedarf gezeigt. Expertenfunktionen dürfen leistungsfähig sein, ohne normale Nutzer zu überladen.

Aktionen erscheinen möglichst dort, wo ihr Kontext verständlich ist. Unnötige globale Menüs und lange Wege werden vermieden. Destruktive Aktionen erhalten angemessene Schutzmechanismen.

## Feedback, Empty States und Fehlertoleranz

Der Nutzer muss relevante Zustände verstehen können: Laden, gespeichert, offline, Sync ausstehend/laufend/erfolgreich/fehlgeschlagen, Konflikt, Fehler, fehlende Berechtigung, leerer Datenbestand und Hintergrundarbeit.

Leere Ansichten erklären – soweit nötig und möglichst knapp – warum keine Daten vorhanden sind und welche Hauptaktion sinnvoll ist.

Benutzeraktionen dürfen bei Netzabbrüchen oder temporären Fehlern nicht unnötig verloren gehen. Wo fachlich sinnvoll werden Entwürfe, Wiederaufnahme, Retry oder Undo vorgesehen. Technische Rohfehler werden normalen Nutzern nicht als primäre UX präsentiert.

## Micro-UX

- unmittelbare Reaktion auf Touch/Klick;
- sinnvolle Ladeindikatoren statt eingefrorener Oberfläche;
- stabile Layouts ohne unnötige Sprünge;
- sinnvolle Fokusführung und Tastaturbehandlung;
- ausreichend große Touch-Ziele;
- Übergänge/Animationen nur mit erkennbarem UX-Nutzen;
- unnötige Warte- und Bestätigungsdialoge vermeiden.

## Accessibility

Accessibility ist Qualitätsmerkmal und kein nachträglicher Zusatz.

- ausreichender Kontrast;
- skalierbare, lesbare Schrift;
- ausreichende Touch-/Klickflächen;
- sichtbare Fokuszustände;
- semantische Struktur;
- Tastaturbedienbarkeit, soweit relevant;
- Screenreader-kompatible Beschriftungen;
- Information niemals ausschließlich über Farbe.

Ein konkreter WCAG-Zielstandard und eine Prüfmatrix werden vor der finalen Qualitäts-/Hardening-Phase festgelegt.

## Responsive Informationsdichte

Mobile-first bedeutet nicht, Tablet/Desktop künstlich wie ein Telefon zu behandeln.

- Telefon: klare Priorisierung, große Touchziele, reduzierte Informationsdichte.
- Tablet: zusätzlichen Platz für Kontext und effizientere Bedienung nutzen.
- Desktop: höhere Informationsdichte zulassen, ohne mobile Verträge zu brechen.
- Responsive Verhalten wird zentral definiert und nicht pro Modul improvisiert.

## Onboarding, Favoriten und Suche

Onboarding wird nur eingesetzt, wenn es echten Nutzen bringt: kurze kontextbezogene Hinweise statt dauernder Tutorials.

Favoriten, Quick Actions, zentrale Suche und optional eine Command-Palette bleiben mögliche spätere UX-Erweiterungen. Sie werden nur umgesetzt, wenn der reale Funktionsumfang ihren Nutzen rechtfertigt.

## Store-App als verbindliches Langfristziel

Die heutige Web-App ist Entwicklungs- und Laufzeitbasis; das langfristige Produktziel umfasst ausdrücklich Store-Apps.

- Neue Architektur-, UI- und Modulentscheidungen werden auf spätere Store-Portabilität geprüft.
- Browser-/Plattformdetails werden möglichst hinter Core-Facaden, Capabilities, Services oder Adaptern gekapselt.
- Module nutzen veröffentlichte Framework-/Core-Verträge.
- Navigation, Lifecycle, Storage, Netzwerkstatus, Authentifizierung, Gerätefunktionen, Background Tasks und Notifications bleiben adapterfähig.
- Direkte Browser-API-Nutzung bleibt lokal begrenzt und ersetzbar, wenn noch kein Coreadapter existiert.
- Eine spätere Store-App soll keinen vollständigen Rewrite des fachlichen Cores oder der Produktmodule erfordern.
- Produktbranding soll so modelliert sein, dass Web/PWA und spätere Store-App dieselbe Produktidentität ableiten können.
- Die konkrete Store-Technik wird erst bei ausreichenden realen Anforderungen entschieden.

## Qualitäts-/Hardening-Phase vor Final Freeze

Vor dem Final Freeze erfolgt eine gesonderte UI-/UX-/Qualitätsprüfung. Mindestens geprüft werden:

- Startperformance einschließlich Local-first Warmstart/Reload;
- Navigation und App-Gefühl;
- Entfernung unnötiger Developer-/Frameworkinformationen aus der User-App;
- Produktbranding und austauschbare App-Identität;
- reale Wirkung von Appearance-/Startseitenkonfiguration;
- visuelle Konsistenz;
- Designvererbung an Module;
- visuelle Kommunikation und Symbolsprache;
- responsive Darstellung;
- Accessibility;
- Offline-/Sync-Zustände;
- Empty States;
- Fehlertoleranz;
- wichtige Nutzerflüsse;
- subjektive und gemessene Reaktionsgeschwindigkeit;
- Store-Portabilität.

Für jeden Bereich wird gefragt, welche reale Verbesserung noch fehlt, ob sie universell oder produktspezifisch ist und ob ihr Nutzen zusätzliche Komplexität rechtfertigt.

## Grundsatz

Das Ziel ist nicht, möglichst viele UI-Funktionen einzubauen. Das Ziel ist ein Framework, aus dem unterschiedliche Apps entstehen können, die trotz großer funktionaler Möglichkeiten **schnell, ruhig, konsistent, verständlich und hochwertig** wirken.

Neue Produktmodule sollen dieses Qualitätsniveau möglichst automatisch erben können, statt es jeweils neu entwickeln zu müssen.


## User UI Design V1 (2026-09-08)

Admin Appearance implementiert nun den strukturierten zentralen Designvertrag mit getrennten Light-/Dark-Paletten, gemeinsamen Geometrie-/Basistypografiewerten, isolierter Preview, Reset und optionalem begrenztem Custom CSS. Die User-App konsumiert dieselben Tokens local-first; Admin-Theme und persönliche User-Theme-Auswahl bleiben unabhängig.


## Appearance UX V2 und lokale Navigation (2026-09-09)

Native Color Inputs werden durch sichtbaren gerahmten Swatch und Hexanzeige erklärt. Komponententokens trennen Actions, Navigation und Forms je Theme; die Preview verwendet denselben Mapper. User wählen lokal/offline Icon+Text, nur Icons oder nur Text und können ausschließlich sichtbare zentrale Navigationslabels bis 32 Zeichen überschreiben. Accessible Names, technische IDs, Routen und spätere I18N-Defaults bleiben davon unabhängig.

## Operations UI contract (2026-09-09)

Permission registry is read-only and scannable by key, description, area and source. Session Overview represents devices, marks the current session and presents registration/last-activity rather than raw duplicate login rows. Infrastructure panels distinguish measured values from “Unavailable on this runtime”. Audit JSON is escaped, formatted and folded by default. Destructive backup, restore, revoke and retention actions require explicit confirmation. Maintenance reasons are inserted as text, never HTML.

## Phase 2 Admin corrections

Admin errors are route-scoped by default and are removed on navigation; only explicitly global alerts persist. Audit filters have visible labels in addition to programmatic names. Backup interval and retention are separate controls; retention is displayed as a number of backup files (1–100), never as an unexplained day value.

## 2026-09-09 Admin tablet follow-up

Audit filtering and destructive retention are separate visual/semantic sections. At tablet width filters use bounded two-column tracks and actions occupy their own row; mobile collapses to one column. Retention always states “Delete audit entries older than X days” and requires confirmation. Admin form borders, code details and GPS map surfaces use shared Light/Dark tokens. Infrastructure views omit empty JSON panels and read-only Connections provides no misleading save action.

## Responsive User content-card contract

`.user-app-panel` may use the full controlled application content width. Groups of User-App cards use `.user-content-grid`: mobile resolves to one full-width column, tablet uses available width through `repeat(auto-fit, minmax(...))`, and desktop remains bounded by the central content maximum. GPS uses `.gps-content-grid` only to give its interactive map more room than the coordinate card on wide layouts; User Settings uses the same base grid. No device-model pixel branches are permitted.

An embedded map is interactive content, never wrapped in a navigation link. External map navigation is a separate labelled action. `Open in …` and `Share position` are distinct verbs: the former navigates the current tab through a universal HTTPS URL, while the latter invokes the native share sheet when available.

## Settings, profile and navigation completion (2026-09-09)

Settings uses a responsive internal button navigation for App Areas, Navigation, Privacy & Sharing and Profile. Exactly one subview is primary; the global navigation remains separate. Save reports status in place and never redirects to Start. Global Login/Settings states use `aria-current` only for the rendered view. Profile keeps username read-only, makes e-mail and personal fields optional, and exposes default-off organization-sharing switches. Password help is exactly “8–25 characters, no spaces; no other composition rules.” GPS consumes the selected locale consistently and the embedded OSM tile viewport handles zoom and pointer pan directly.

## 2026-09-10 Admin management additions

Packages/Entitlements and Licenses/Organizations use responsive cards/forms and existing buttons/tokens. Visible wording uses `User limit`, `Device limit per user`, `License manager` and `Custom device limit`; internal seat/device column names remain unchanged. Device limits are never restricted to preset choices: Package supports a positive custom value or unlimited, while License and User additionally support inheritance from the Package/License default. The License manager is chosen from active users instead of entering a numeric ID. License status includes the existing safe blocked/revoked state without deleting history. Birthday uses three visibly ordered, touch-sized Day, localized full Month and Year selects and is serialized as an ISO date only when all three are chosen. Audit Delete All is visually separate from retention and requires exactly two confirmation dialogs, with no typed confirmation word.

License cards expose Edit and confirmed Delete. Delete is intentionally refused while any User or Manager remains assigned; `Revoked / blocked` is the non-destructive path. Session Overview shows `Display name · @username · #User-ID`, the full `Installation / Device ID`, and separate Device class, Operating system and Browser support columns. The random installation ID is visually primary; uncertain platform metadata reads `Unknown` rather than asserting a false device.

Backups & Restore contains `Backup storage path`, `Test path` and `Save` together. Status is explicit (`ready`, missing, not a directory, not writable, or public path); Create remains disabled until key, database/schema and protected storage are ready. The UI never offers an encryption-key input or displays its value.

## 2026-09-10 Settings/Profile follow-up

Anonymous Settings navigation contains only App Areas and Navigation. Privacy & Sharing and Profile are created only for an authenticated user; an anonymous stale/direct section selection is reset to App Areas. Birthday remains three selects, uses a compact Day/Month/Year row on tablet widths and wraps on small phones. A profile save is successful only after the authoritative returned profile confirms the exact ISO birthday, which is cached for immediate re-opening and invalidated on identity change/logout.

## Organization context and active navigation

Profile renders `Share with my organization` only when the server profile capability confirms an active organization assignment. Main navigation, Settings action and Settings subnavigation expose one clear `aria-current` selection derived from the current hash route; selected colors use theme tokens and survive hover, reload and direct links.
## Global feedback and password fields (2026-09-11)

- Successful save/create/update actions open the shared centered success dialog; they do not leave an additional green success line.
- The dialog is keyboard/touch accessible, traps its single OK action, supports Escape/backdrop close, and restores focus.
- Password fields are hidden initially and receive a shared accessible Show/Hide control without changing their value or autocomplete contract.
- User Management separates its list/filter and editor panels using the standard spacing scale.
## Password icon and User Package source (2026-09-11)

- Password controls display a real open/crossed eye, never a dot-like placeholder, with a minimum 44×44 touch target.
- User Create/Edit separates `Package` from `License / Organization`; License selection disables Package editing and explains inheritance/fallback.
- User lists label the effective source as `Direct package` or `From license / organization`.
Active system modules may intentionally have no User navigation button. Hidden presentation never means disabled capability or permission. The User Login password eye uses the same shared helper and is included in the offline shell cache so stale warm starts do not omit it.

Profile and Privacy tabs are capability-gated and disappear cleanly while the optional Profile module is inactive. Login and technical account navigation remain available.

## 2026-09-11 implemented repair UX

User Management uses exclusive list/create/edit states on all widths. Module tables are grouped as User/System without changing permissions. Role Visibility controls only navigation presentation. The shared password helper repairs incomplete/stale wrappers, rechecks the dynamically rendered login on the next animation frame, and its own CSS forces a visible 44×44 toggle above the input; iPad normal/private remains an operator retest.
