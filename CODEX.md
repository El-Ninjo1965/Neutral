# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Größeres Folgepaket: Appearance UX V2 + Button/Navigation Design + lokale User-Personalisierung

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vor Implementierung vollständig `WORKFLOW.md`, `DOCUMENTATION.md`, `CODEX.md`, `CURRENT-TASK.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md`, `UI-UX.md`, `USER-UI-DESIGN.md`, `I18N.md`, `VISION.md`, `CORE-1.0.md`, `Architecture.md`, `Functions.md`, `ModuleCreation.md` sowie alle relevanten Appearance-, User-Settings-, Navigation-, Header-, Login-, Theme-/Token-, CSS-, Local-Storage-/Cache-, API-, Service-Worker-, Security- und Testdateien.

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe:

`CODEX.md == CURRENT-TASK-Anforderungen`

# Ausgangslage / echter Betreiber-Device-Retest

Der User-UI-Designeditor V1 ist code-seitig fertig und auf dem realen iPad geprüft worden. Grundfunktion, nativer iPad-Farbwähler und Struktur sind vorhanden. Der Betreiber hat jedoch mehrere zusammenhängende UX-/Designprobleme festgestellt. Diese sollen bewusst in **einem größeren Arbeitspaket** gelöst werden, statt viele kleine Codex-Runden zu erzeugen.

P1 und P4 bleiben `LIVE BESTANDEN` und dürfen nicht regressieren.

# A – Farbeingaben im Appearance-Editor verständlich machen

Aktueller realer Befund:

- `<input type="color">` erscheint auf iPad/Safari innerhalb des Formulars im Wesentlichen als sehr dünner horizontaler Farbstreifen.
- besonders bei Schwarz/Dark ist die aktuelle Farbe praktisch nicht sinnvoll erkennbar;
- beim Antippen öffnet sich dagegen der native iPad-Farbwähler und dieser wird vom Betreiber ausdrücklich als gut bewertet;
- der native Picker soll daher erhalten bleiben.

## Ziel

Jede Farbeingabe soll **vor dem Öffnen des Pickers** sofort verständlich zeigen:

- einen deutlich sichtbaren Farbswatch, bevorzugt runder Farbpunkt/Farbkreis ungefähr in der Größenordnung eines normalen Header-Icons;
- den aktuellen normalisierten Hexwert, z. B. `#0B0F14`;
- klare Klick-/Touch-Affordance;
- ausreichende Abgrenzung des Swatches auch bei Schwarz, Weiß und Farben nahe der umgebenden Admin-Surface.

Der Swatch darf deshalb einen neutralen/leicht grauen kontrastierenden Träger/Rahmen besitzen, ohne die eigentliche Farbe zu verfälschen.

Der native `input[type=color]`-Dialog bleibt die eigentliche Farbauswahl. Keine eigene komplexe Color-Picker-Bibliothek erfinden.

Wenn Safari/iPad eine direkte Hex-Eingabe im nativen Picker anbietet, genügt dies für V2; im Adminformular selbst muss der Hexwert mindestens sichtbar sein. Eine zusätzliche direkte Hex-Eingabe im Formular nur dann ergänzen, wenn sie sauber synchronisiert, validiert und UX-seitig eindeutig ist.

# B – User-UI-Design-Tokens komponentenspezifisch erweitern

Die bisherigen groben Tokens reichen für reale App-Gestaltung nicht aus. Insbesondere Settings, Home/GPS und Login zeigen, dass Hintergrund/Text/Icon/Border getrennt steuerbar sein müssen.

Erweitere den strukturierten Designvertrag sinnvoll und semantisch, jeweils **Light und Dark getrennt**, mindestens um:

## Primary Action

- Background
- Text
- Icon
- Border

## Secondary Action / Header Action

- Background
- Text
- Icon
- Border

## Navigation – aktiv

- Background
- Text
- Icon
- Border

## Navigation – inaktiv

- Background
- Text
- Icon
- Border

## Form Controls

- Input Background, sofern noch nicht sauber aus Surface ableitbar
- Input Text
- Input Border
- Input Focus Border / Focus Ring

Nutze semantische zentrale Tokens. Keine einzelnen Regeln nur für `Settings`, `GPS` oder `Login` hart codieren. Die zentrale Designsprache muss von aktuellen und zukünftigen Modulen geerbt werden können.

## Betreiberbeispiele

Der Betreiber möchte z. B. im Dark Theme bewusst:

- gelbe oder andersfarbige Icons/Text auf dunklen Buttons wählen können;
- den aktiven Home-Button heller/dunkler blau definieren können;
- in Light möglicherweise schwarze Texte/Icons wählen;
- inaktive Navigation klar als touchbare Buttons erkennen können.

Das sind Beispiele, keine fest einzubauenden Farben. Der Editor soll diese Freiheit ermöglichen.

# C – Dark-Mode-Defaults und Form-Control-Kontrast verbessern

Realer Befund:

- Eingabefelder im Dark Theme sind teilweise nur schwer von der umgebenden Fläche zu unterscheiden;
- Border ist zu dunkel/kontrastarm;
- dadurch ist nicht sofort klar, wo das Eingabefeld beginnt und endet.

Überarbeite die **Frameworkdefaults** für Dark so, dass Controls auch ohne Admin-Anpassung klar erkennbar sind.

- Border ausreichend sichtbar;
- Fokuszustand noch klarer;
- keine ausschließlich farbliche Information;
- kein übertriebener Glow;
- bestehende Accessibility-/Touch-Verträge respektieren.

Der Admin kann diese Werte anschließend über die neuen Form-Control-Tokens anpassen.

# D – Preview deutlich aussagekräftiger machen

Die Preview muss alle neu steuerbaren Komponenten zeigen und denselben Mappingvertrag wie die reale User-App verwenden.

Mindestens darstellen:

- App/Page Background;
- Surface/Card;
- Header Action;
- Primary Action;
- Secondary Action;
- aktive Navigation;
- inaktive Navigation;
- Icon + Text;
- Input normal;
- Input Fokus-Demonstration bzw. klarer Focus-Sample;
- Primary/Muted Text;
- Border.

Light/Dark gezielt umschaltbar. Preview darf niemals die Admin-Shell selbst umstylen.

# E – Appearance-Editor besser gruppieren / Progressive Disclosure

Der Editor wird umfangreicher. Vermeide eine endlose unstrukturierte Liste.

Gruppiere sinnvoll, z. B.:

- Base Colors
- Actions & Buttons
- Navigation
- Forms
- Geometry & Typography
- Preview

Die konkrete UX darf besser gewählt werden, wenn sie auf iPad/Mobile/Desktop klarer ist.

Keine unnötige neue Router-/Seitenhierarchie, sofern Akkordeons/Sections innerhalb `Appearance` besser sind.

# F – Advanced Custom CSS als Expertenfunktion einklappen

Realer Betreiberbefund: Die Funktion ist technisch sinnvoll, aber für einen normalen Betreiber ohne CSS-Kenntnisse zunächst unverständlich.

Behalte Advanced Custom CSS, aber:

- standardmäßig eingeklappt;
- eindeutig als **Advanced / Expert** kennzeichnen;
- kurze verständliche Erklärung: nur verwenden, wenn die strukturierten Designoptionen nicht ausreichen;
- bestehende technische Sicherheitsdetails nicht als dominanten normalen UI-Text darstellen; bei Bedarf in Help/Details verschieben;
- `Clear Custom CSS` bleibt vorhanden;
- bestehender Sicherheitsvertrag, Größenlimit und CSP bleiben unverändert streng.

# G – Lokale User-Einstellung für Navigationsdarstellung

Neue persönliche User-Präferenz unter normalen **User Settings**, nicht Admin Appearance.

Der Endnutzer soll lokal auf seinem Endgerät wählen können:

1. **Icon + Text** – Default
2. **Icons only**
3. **Text only**

## Vertrag

- lokal persistent;
- offline;
- keine Server-/DB-Pflicht;
- pro Endgerät;
- Default `Icon + Text`;
- gilt konsistent für zentrale User-App-Navigation/Header-Actions, soweit ein Element Icon und Text besitzt;
- Accessibility-Namen bleiben unabhängig von sichtbarer Darstellung immer vorhanden;
- bei `Icons only` müssen `aria-label`/accessible names und sinnvolle Tooltips/Title erhalten bleiben;
- bei `Text only` darf das Fehlen des Icons das Layout nicht beschädigen;
- Responsive Layout bleibt stabil.

Home, Settings und Login erhalten etablierte lokale Icons:

- Home: bestehendes Haus-Icon;
- Settings: Zahnrad;
- Login/Sign-in: etabliertes Sign-in-Symbol, bevorzugt Tür/Entry mit Pfeil statt Schlüssel, sofern das bestehende lokale Iconsystem dies sauber unterstützt;
- keine Emojis;
- keine externen Icon-Netzwerkabhängigkeiten.

GPS erhält ein etabliertes lokales Location/GPS-Symbol, sofern im bestehenden Iconsystem sinnvoll verfügbar/sauber ergänzbar.

# H – Lokale benutzerdefinierte Anzeigenamen für Navigation

Der Endnutzer soll zusätzlich die **sichtbaren Texte zentraler Navigations-/Action-Elemente lokal umbenennen können**.

Motivation:

- persönliche Terminologie (`GPS` → `Location`, `Standort` usw.);
- begrenzte Hilfe für Nutzer, deren Sprache noch nicht offiziell unterstützt wird;
- maximale Personalisierung ohne globale App-/Modulkonfiguration zu verändern.

## Vertrag

- Defaulttexte bleiben die offiziellen App-/I18N-Bezeichnungen;
- User kann lokal einen eigenen Anzeigenamen setzen;
- leer/Reset = wieder offizieller Default;
- lokale Speicherung pro Endgerät;
- keine Server-/DB-Pflicht;
- keine Änderung technischer Modul-IDs, Routen, Berechtigungen oder I18N-Schlüssel;
- nur Presentation Layer;
- definierte Maximallänge, die Layoutschäden verhindert; wähle eine sinnvolle Grenze und dokumentiere sie;
- Eingabe trimmen/normalisieren;
- kein HTML, nur Text;
- Reset pro Bezeichnung und sinnvoller `Reset all navigation labels` möglich;
- bei `Icons only` bleibt die benutzerdefinierte Bezeichnung als Accessibility-/Tooltip-Text sinnvoll nutzbar;
- bei `Text only` ist sie sichtbarer Text.

## Scope der Umbenennung

Nicht nur hart codierte aktuelle Buttons berücksichtigen. Entwirf einen kleinen generischen lokalen Presentation-Vertrag, sodass **zukünftige zentrale Modulnavigation** ebenfalls einen User-Override anhand stabiler Navigation-/Modul-ID erhalten kann, ohne jedes Modul einzeln in den Core zu programmieren.

Das Modul selbst und seine fachlichen Inhalte werden dadurch nicht umbenannt; nur sein zentraler Navigations-Anzeigename.

# I – User Settings UX

In User Settings einen klaren Bereich, z. B. `Navigation` oder `Interface`, ergänzen:

- Display style: Icon + Text / Icons only / Text only;
- darunter lokale Label-Anpassungen;
- Defaultbezeichnungen sichtbar, damit klar ist, was zurückgesetzt wird;
- Reset einfach und verständlich;
- keine Developerbegriffe wie IDs/Keys im normalen UI anzeigen.

Appearance/Theme bleibt dort weiterhin entfernt; der Header-Sonne/Mond-Schalter bleibt der Themezugriff.

# J – I18N-Kompatibilität vorbereiten, aber I18N noch nicht implementieren

`I18N.md` bleibt Zukunftsvertrag.

Wichtig für diese Personalisierung:

- offizieller Defaulttext wird später aus dem aktiven I18N-Schlüssel kommen;
- lokaler User-Override hat für die sichtbare Navigation Vorrang;
- Reset fällt auf den **aktuell lokalisierten** offiziellen Text zurück, nicht auf fest verdrahtetes Englisch;
- keine Sprachpakete/Provider in diesem Auftrag implementieren.

# K – Local-first / Performance

Alle neuen User-Präferenzen müssen beim Start synchron/lokal früh genug verfügbar sein, dass Navigation nicht sichtbar von `Icon + Text` auf `Icons only` o. ä. springt.

- kein Netzwerk erforderlich;
- kein neues Loading;
- kein White-Flash;
- keine Verschlechterung des bereits live bestandenen Warmstarts;
- fehlerhafte lokale Präferenz fällt kontrolliert auf `Icon + Text` und offizielle Labels zurück.

# L – Tests / Regression

Test-first. Mindestens:

## Appearance Color UX

- Swatch und Hexwert sichtbar;
- Schwarz/Weiß auch gegen ähnliche Surface erkennbar;
- native Color-Input-Funktion erhalten;
- Hexanzeige synchronisiert sich mit Auswahl.

## Tokenvertrag

- neue Primary/Secondary/Nav-active/Nav-inactive/Form-Tokens Light/Dark gespeichert, validiert, öffentlich projiziert und lokal gecacht;
- unbekannte Tokens abgewiesen;
- Defaults funktionieren;
- bestehende V1-Konfiguration migriert/kompatibel behandelt, ohne Installationen zu brechen.

## Dark Controls

- Default-Border klarer;
- Focus sichtbar;
- Admin-Konfiguration wirkt real auf User-App.

## Preview

- alle neuen Komponenten sichtbar;
- Light/Dark Mapping identisch zur User-App;
- Admin-Shell unbeeinflusst.

## Advanced CSS

- standardmäßig collapsed;
- expand/collapse zugänglich;
- Save/Clear/Security unverändert funktionsfähig.

## Navigation Display Preference

- Default Icon + Text;
- Icons only;
- Text only;
- persistiert nach Reload;
- offline;
- ungültiger lokaler Wert → Default;
- Accessibility bleibt in allen Modi korrekt.

## Label Overrides

- Home/Settings/Login/GPS und generischer Modulnav-Key lokal überschreibbar;
- Maximallänge;
- nur Text;
- einzelner Reset;
- Reset all;
- Route/Modul-ID unverändert;
- Override bleibt lokal;
- Reset fällt auf offiziellen Default zurück;
- I18N-kompatibler Fallbackvertrag.

## Regression

- P1 Sessiontrennung;
- P4 Start Page;
- Homepage HTML/Module;
- Warmstart ohne Loading/Flash;
- User Theme Toggle;
- Admin Theme Toggle;
- GPS;
- Login;
- Auth/CSRF;
- Service Worker;
- Packaging/Base Path;
- FTPS/Smoke;
- Custom CSS;
- keine Secrets/Artefakte.

# Dokumentation

Aktualisiere nach tatsächlicher Implementierung `USER-UI-DESIGN.md`, `UI-UX.md`, `Functions.md`, `Architecture.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md` und weitere betroffene Dokumente wahrheitsgemäß.

I18N nicht als implementiert markieren.

# Abschluss gemäß WORKFLOW.md

Vollständig:

- fokussierte Tests;
- vollständige Test-Suite;
- PHP-Lint;
- JS-Syntax;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- Commit + Push `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS + CodeQL terminal abwarten;
- vollständigen Abschlussbericht in `CHATGPT.md` schreiben und auf GitHub `main` verifizieren;
- erst danach Abschlussmeldung.

Keine selbst ausführbaren offenen Punkte zurücklassen.

# Betreiber-Device-Retest danach

`CHATGPT.md` soll einen kompakten Retest liefern:

1. Appearance Light/Dark Farbswatches + Hexwerte prüfen.
2. Primary/Secondary/Nav/Input-Farben ändern, Preview und reale User-App prüfen.
3. Dark Input-Border/Focus prüfen.
4. Advanced CSS auf-/zuklappen, kleinen Override testen und clearen.
5. User Settings → Navigation: alle drei Display-Modi prüfen.
6. Home/Settings/Login/GPS lokal umbenennen und Reload prüfen.
7. einzelne Labels und alle Labels resetten.
8. Warmstart/Offline kurz prüfen: keine Layoutsprünge/Loading/Flash.
9. Start Page, GPS, Login, User/Admin Theme regressiv prüfen.

Automatisierte Tests ersetzen die reale visuelle iPad-Abnahme nicht.
