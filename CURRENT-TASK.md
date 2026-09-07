# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Der aktuelle Auftrag dient zunächst der Herstellung eines korrekten, aktuellen und dauerhaft verlässlichen Arbeitsstands.

## Verbindliche Arbeitsregel

Lege im Repository-Root `CURRENT-TASK.md` an.

Diese Datei ist ab sofort der temporäre Arbeitszettel für GENAU EINEN aktuellen Gesamtauftrag.

VERBINDLICHE REGEL:

Bei jedem längeren oder mehrteiligen Auftrag musst du VOR der eigentlichen Arbeit:

1. den vollständigen Auftrag in `CURRENT-TASK.md` übernehmen;
2. keine Anforderung weglassen oder verkürzen;
3. daraus nummerierte, überprüfbare Arbeitspunkte erstellen;
4. jedem Punkt einen Status geben:
   - OFFEN
   - IN ARBEIT
   - BLOCKIERT
   - CODE-SEITIG ERLEDIGT
   - DEVICE RETEST REQUIRED
   - LIVE BESTANDEN
5. anschließend Punkt für Punkt anhand dieser Datei arbeiten.

Im Zweifel gilt:
Ein Auftrag wird in `CURRENT-TASK.md` persistiert.
Lieber einmal unnötig persistieren als einen Teil eines Gesamtauftrags verlieren.

WICHTIG:

`CURRENT-TASK.md` enthält KEINE Historie.

Sie enthält ausschließlich den aktuell gültigen Gesamtauftrag.

Nach deiner Abschlussmeldung darfst du den Inhalt NICHT selbstständig löschen oder ersetzen.

Der abgeschlossene Auftrag bleibt vollständig in `CURRENT-TASK.md`, damit Betreiber und ChatGPT/Lea deine Arbeit anschließend gegenprüfen können.

ERST wenn der Betreiber einen NEUEN Auftrag erteilt, gilt dieser neue Auftrag gleichzeitig als Freigabe, den bisherigen Inhalt von `CURRENT-TASK.md` vollständig durch den neuen Auftrag zu ersetzen.

Keine Archivierung alter CURRENT-TASK-Inhalte.
Keine CURRENT-TASK-History.
Keine zusätzlichen Prompt-History-Dateien anlegen.

Dauerhaft relevante technische Erkenntnisse gehören weiterhin in die bestehenden fachlich zuständigen MD-Dateien.

Diese CURRENT-TASK-Regel muss zusätzlich dauerhaft und eindeutig in `WORKFLOW.md` dokumentiert werden.

## Aktueller Gesamtauftrag

### P1 – Falschen Live-Status korrigieren

Der aktuell dokumentierte Status zur Trennung von User-App und Admin-Session ist NICHT korrekt.

Der letzte reale Device-Livetest hat P1 NICHT bestanden.

Tatsächlicher letzter Device-Befund:

- User-App und Adminbereich verhalten sich weiterhin nicht zuverlässig als getrennte Login-Kontexte.
- Admin-Login kann weiterhin die User-App-Identität beeinflussen.
- Login/Logout verhält sich teilweise inkonsistent.
- Beim Adminzugriff erschien real:
  `Access denied – Administrative access requires an authorized role.`

Deshalb dürfen Aussagen wie

`User/Admin session separation: DONE / LIVE BESTANDEN`

nicht bestehen bleiben.

Korrigiere STATUS.md, ToDoNow.md, TODO.md und gegebenenfalls weitere betroffene Dokumente.

P1 muss mindestens als

`DEVICE RETEST REQUIRED`

geführt werden.

Falls die Repositoryanalyse bereits einen weiterhin bestehenden technischen Fehler beweist:
`IN ARBEIT`.

Automatisierte Tests sind KEIN Ersatz für einen realen Device-Livetest.

### UI- und UX-Anforderungen für die User-App (noch nicht implementieren)

1. User-App Header
   - `ACTIVE APPLICATION` aus dem normalen User-Interface entfernen.
   - Benutzername nicht permanent prominent im Header anzeigen.
   - Benutzerinformationen gehören in Settings/Profile.
   - Eine Startseite darf optional z.B. `Willkommen <Name>` anzeigen.

2. Startseite
   - Die Startseite muss fachneutral und über den Adminbereich konfigurierbar werden.
   - Mindestens prüfen/vorsehen:
     - Standard
     - Text
     - sicherer HTML-Inhalt
     - ausgewähltes Modul
   - Nicht angemeldeter und angemeldeter Zustand müssen sinnvoll berücksichtigt werden.
   - Module als Startinhalt unterliegen weiterhin Visibility-/Permission-Regeln.
   - Keine dauerhaft fest verdrahteten Demo-Welcome-Texte.

3. User-Navigation
   - Start, GPS und spätere Module müssen eindeutig als App-Bedienelemente erkennbar sein.
   - Keine Navigation, die optisch lediglich wie Textlinks aussieht.
   - Vorsehen:
     - echte Buttons/Tabs/Kacheln
     - Normalzustand
     - aktiver Zustand
     - Touch-optimierte Größe
     - Focus-Zustand
     - Icons
     - möglichst deklarative Modulicons über Manifest/Metadaten

## Arbeitspunkte

1. Repository-Stand und Git-/Dokumentationslage prüfen. Status: CODE-SEITIG ERLEDIGT
2. Relevante Projekt-Dokumente lesen und aktuelle Repository-Wahrheit rekonstruieren. Status: CODE-SEITIG ERLEDIGT
3. `WORKFLOW.md` um die `CURRENT-TASK`-Regel ergänzen. Status: CODE-SEITIG ERLEDIGT
4. Falschen Live-Status in `STATUS.md`, `ToDoNow.md` und `TODO.md` korrigieren. Status: CODE-SEITIG ERLEDIGT
5. Betroffene Dokumente auf konsistente UI-/UX-Anforderungen ergänzen. Status: CODE-SEITIG ERLEDIGT
6. Abschlussprüfung und kurze Diff-/Statusvalidierung durchführen. Status: CODE-SEITIG ERLEDIGT

## Abschlussstatus des aktuellen Initialisierungs-/Dokumentationsauftrags

ERLEDIGT:
- Repository-Stand und Git-/Dokumentationslage wurden geprüft.
- Relevante MD-Dokumente wurden gelesen und auf den aktuellen Stand abgeglichen.
- Die verbindliche `CURRENT-TASK`-Regel wurde in `WORKFLOW.md` dokumentiert.
- Der falsche Live-Status wurde in `STATUS.md`, `ToDoNow.md` und `TODO.md` korrigiert.
- Die UI-/UX-Anforderungen wurden konsistent in den betroffenen Projektdateien vermerkt.
- Die Abschlussprüfung und Diff-/Statusvalidierung wurden ausgeführt.

NICHT ERLEDIGT:
- Keine im aktuellen Auftrag vorgesehenen Implementierungs- oder P1-/P4-/UI-Fixarbeiten.

BLOCKIERT / DEVICE RETEST REQUIRED:
- P1 bleibt weiterhin als `IN ARBEIT / DEVICE RETEST REQUIRED` dokumentiert, da dies ein fachlicher Live-Status und kein Code-Fix im vorliegenden Initialisierungsauftrag ist.

NÄCHSTE OFFENE PUNKTE IN PRIORITÄTSREIHENFOLGE:
1. Kein weiterer Punkt aus diesem Initialisierungsauftrag verbleibt offen.

CURRENT-TASK:
- Anzahl Gesamtpunkte: 6
- vollständig abgearbeitet: JA
- verbleibende Punkte: keine
