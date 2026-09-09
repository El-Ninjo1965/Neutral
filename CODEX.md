# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER NACHBESSERUNGSAUFTRAG – P0 LIVE AUTH/GPS + CORE-FREEZE-RESTLÜCKEN  
**Datum:** 2026-09-09

# Aktueller Auftrag

## Produktionsregressionen zuerst beheben, danach zwei nachgewiesene Core-Freeze-Lücken schließen

Der vorige Auftrag wurde als abgeschlossen/deployed gemeldet. Der reale Betreiber-Retest auf **iPad/Chrome am 2026-09-09 ca. 20:08–20:09 lokale Zeit** widerlegt diesen Abschluss in vier Punkten. Zusätzlich hat die nachträgliche Repositoryprüfung durch ChatGPT/Lea zwei Anforderungen gefunden, die in `CURRENT-TASK.md` als erledigt markiert wurden, im produktiven Vertrag aber nicht vollständig vorhanden sind.

**Diese sechs Punkte sind jetzt der vollständige Auftrag.** Die vier Livebefunde haben Vorrang vor grünen Tests und vor früheren Abschlussberichten. Der Core ist bis zu ihrer Behebung und realem Retest **nicht freeze-fähig**.

Arbeite autonom, systematisch und test-first bis zum vollständigen code-seitigen Abschluss. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community und kein vollständiges Messaging implementieren. Bestehende positive Verträge – insbesondere Session-Deduplizierung, I18N, Settings-Unterseiten, Passwort 8–25 ohne Leerzeichen, Profile/Privacy, Entitlements und Offline-First – dürfen nicht regressieren.

---

# 1. Pflicht-Preflight und Wahrheitsvertrag

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `ModuleCreation.md`, `UI-UX.md`, `I18N.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, relevante Deployment-/Installationsdokumentation sowie alle betroffenen Implementierungs- und Testdateien.
3. Diesen neuen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen. Frühere `[x]`-Markierungen dürfen nicht als Beweis gelten.
4. Für jeden der sechs Punkte Root Cause nachweisen. Keine symptomatischen Schnellfixes.
5. Reale Produktionsbefunde sind autoritativ. Ein Test, der dem Livebefund widerspricht, ist unvollständig und muss verbessert werden.
6. Keine Secrets, Passwörter, Tokens oder personenbezogenen Produktionsdaten ausgeben. Kein Restore, keine destruktiven Produktionsaktionen.
7. Nach Änderungen vollständige Regression, Packaging, Deployment und read-only Produktionssmoke gemäß `WORKFLOW.md`.
8. Nur reale Betreiberprüfungen dürfen `LIVE BESTANDEN` heißen. Code/CI/Smoke allein heißt höchstens `CODE-SEITIG ERLEDIGT · DEVICE RETEST REQUIRED`.

---

# 2. P0 – User-Login live komplett ausgefallen

## Verbindlicher Livebefund

User-App Login mit bestehendem Tester-Account zeigt:

`Authentication service temporarily unavailable.`

Damit ist die normale User-Authentifizierung in Produktion nicht nutzbar.

## Auftrag

Root Cause vom Browser bis zum produktiven PHP-Endpunkt vollständig verfolgen:

- tatsächlich ausgelieferte `index.html`/User-Shell;
- Script-/Assetpfade und `.htaccess`-Rewrite;
- `ApiClient`-Ladefolge, Export/Global, Instanziierung und Base Path;
- Login-Handler der User-App;
- `/api/v1/auth/login` bzw. kanonischer produktiver Loginpfad;
- PHP-Router/Bootstrap/Migrationsbootstrap;
- Fehlerbehandlung, die aktuell den generischen Text erzeugt;
- Cache/Service-Worker/Deploymentrevision, damit kein alter Client mit neuem Server gemischt wird.

Nicht nur prüfen, ob die API theoretisch antwortet. Reproduziere den **realen Browservertrag** so nah wie möglich: ausgelieferte Produktionsstruktur + User-Shell + Loginpfad.

## Ziel

- bestehender gültiger User kann sich wieder anmelden;
- falsche Credentials liefern einen normalen Authfehler, nicht `service unavailable`;
- erfolgreicher Login stellt User-Session/CSRF korrekt her;
- persistente Installation-ID und Session-Deduplizierung bleiben erhalten;
- Logout/Login erzeugt keine zusätzliche aktive Session derselben Installation.

---

# 3. P0 – Admin-Login live komplett ausgefallen

## Verbindlicher Livebefund

Admin-Authentifizierungsseite mit bestehendem Developer/Admin-Account zeigt ebenfalls:

`Authentication service temporarily unavailable.`

## Auftrag

Adminpfad separat end-to-end verfolgen. Nicht annehmen, dass der User-Fix automatisch Admin repariert.

Prüfe insbesondere:

- tatsächlich ausgelieferte `admin.php`/Auth-Shell;
- geladenen `ApiClient` und seine öffentliche URL/Rewrite-Regel;
- Admin-Session-Scope (`neutral_admin_session`, CSRF);
- Loginrequest, Router, Bootstrap und Fehlerantwort;
- Trennung User-App/Admin bleibt erhalten;
- keine Rückkehr zu direktem Login-`fetch`, der den gemeinsamen Device-ID-Vertrag umgeht.

## Ziel

- bestehender autorisierter Admin kann sich wieder anmelden;
- User- und Adminsession bleiben getrennt;
- Access-denied/Admin-Reauth-Vertrag bleibt erhalten;
- Device-ID und Deduplizierung bleiben stabil.

**Abnahme:** echte Integrationstests müssen die ausgelieferte Admin-Auth-Seite und deren tatsächlichen Clientpfad abdecken, nicht nur isolierte Serviceklassen.

---

# 4. P0 – GPS-Karte zeigt Position falsch

## Verbindlicher Livebefund

GPS-Daten zeigen ungefähr:

- Latitude `7.105691769982597`
- Longitude `125.63707611554916`

Die neue interaktive OSM-Karte ist zwar zoombar, aber Kartenposition/Markerprojektion entspricht live nicht zuverlässig diesen Koordinaten.

## Auftrag

Die neue selbst implementierte Tile-/Web-Mercator-Logik mathematisch und DOM-seitig prüfen:

- lat/lon → Web-Mercator world/tile coordinates;
- `x/y/z`, `floor`, Pixeloffsets und Tilegrenzen;
- Longitude/Latitude niemals vertauschen;
- korrekte Mercator-Latitude-Clamps;
- Kartenmittelpunkt und Marker müssen dieselbe Projektion/Transformationsbasis verwenden;
- nach Zoom und Pan Marker/Map weiterhin konsistent;
- Retina/devicePixelRatio darf keine Positionsverschiebung erzeugen;
- Containergröße/Responsive Layout darf keine falsche Markerposition erzeugen.

Ergänze deterministische Tests mit bekannten Referenzkoordinaten einschließlich der obigen Davao-Koordinate. Prüfe Tileindex und Pixelposition gegen unabhängig berechnete Web-Mercator-Erwartungswerte; kein Test, der lediglich bestätigt, dass HTML sich nach `+` verändert.

## Ziel

Beim Öffnen ist die aktuelle GPS-Position der korrekte Kartenmittelpunkt/Marker. Zoom und Pan funktionieren weiterhin. `Position aktualisieren` setzt Karte und Marker wieder korrekt auf die neue aktuelle Position. Keine Trackingfunktion.

---

# 5. OpenStreetMap extern in neuem Tab/Fenster öffnen

## Verbindlicher Livebefund

`In OpenStreetMap öffnen` ersetzt derzeit die Neutral-App im selben Browserfenster/Tab.

## Ziel

- separater OSM-Button öffnet OSM **in neuem Tab/Fenster**, sodass Neutral geöffnet bleibt;
- sichere externe Navigation mit `noopener`/`noreferrer` soweit passend;
- kein vorab erzeugtes leeres `about:blank`;
- eingebettete Karte selbst bleibt ohne externen Linkwrapper;
- Google-Maps-Verhalten nicht unbeabsichtigt regressieren;
- System-Share bleibt getrennt.

Auf iPad/Chrome muss der Browser die externe OSM-Seite öffnen können, ohne die laufende Neutral-Seite zu ersetzen.

---

# 6. Core-Freeze-Lücke – delegierter License/Organization Admin ist unvollständig

## Repositorybefund

Der vorige Auftrag verlangte für einen Lizenz-/Organisationsverwalter innerhalb **seiner eigenen Lizenz** mindestens:

- User anlegen / Initialpasswort;
- User sehen;
- User blockieren/entfernen;
- Seats/Geräte sehen;
- einzelne Geräte freigeben/revoken;
- Last Activity und Used/Allowed Devices sehen;
- ausschließlich vom User freigegebene Profildaten sehen.

Aktuell sind produktiv im Wesentlichen `GET /license/users` und `POST /license/users` sowie `organizationUsers()`/`assignUser()` nachweisbar. Damit sind Block/Remove und scoped Device-Revoke nicht vollständig umgesetzt, obwohl `CURRENT-TASK.md` dies als erledigt markiert.

## Auftrag

Den delegierten Vertrag vollständig und serverautoritativ schließen:

- geeignete scoped API/Serviceoperationen für Blockieren/Entfernen eines eigenen Lizenzusers;
- Device-/Installation-Liste innerhalb der eigenen Lizenz;
- Revoke/Freigabe einer einzelnen Installation innerhalb der eigenen Lizenz;
- Used/Allowed + Last Activity in der Organisationsansicht;
- ausschließlich explizit freigegebene Profilfelder;
- kein Zugriff auf fremde Lizenzuser/-geräte;
- kein Zugriff auf globale Rollen/Corepermissions, Server, Backup, Audit oder Systemsettings;
- alle schreibenden Aktionen CSRF-geschützt und auditierbar;
- Seat-/Device-Limits bleiben autoritativ.

**Wichtig:** „Entfernen“ muss sicher definiert werden. Ein Vereinsadmin darf nicht unkontrolliert einen globalen Account löschen, wenn dieser später/parallel außerhalb seiner Organisation relevant sein könnte. Bevorzuge scoped Zuordnung entfernen bzw. blockieren, sofern der globale Accountvertrag dies verlangt.

## Echte Tests

Mindestens:

1. Manager Lizenz A sieht/ändert nur A.
2. Manager A kann A-User anlegen und scoped blockieren/entfernen.
3. Manager A kann A-Gerät revoken.
4. Manager A kann User/Gerät von Lizenz B weder lesen noch verändern.
5. Device-Limit 1 → zweites Gerät blockiert → Manager revoket altes Gerät → neues Gerät möglich.
6. `unlimited` bleibt korrekt.
7. Nicht freigegebene Profilfelder erscheinen nie.

Ein Unit-Test `allowsLicenseScope(7,7)` allein reicht nicht.

---

# 7. Core-Freeze-Lücke – Medien-/Moderationsgrundlage ist nur teilweise funktional

## Repositorybefund

Vorhanden sind Schema/Tabellen (`user_media`, `media_moderation_history`), Statusmodell und Bildvalidierung. Nicht ausreichend nachgewiesen ist ein vollständiger produktiver generischer Workflow von berechtigtem Upload bis Moderationsentscheidung.

## Auftrag

Nur die neutrale Plattformgrundlage fertigstellen, keine Community-/Marketplace-UI:

- authentifizierter Userupload nur mit passender Permission/Entitlement;
- Viewer/anonym: kein Serverupload;
- sichere serverseitige JPEG/PNG/WebP-Validierung und Größenlimits erhalten;
- sichere Speicherung außerhalb unkontrolliert ausführbarer öffentlicher Pfade bzw. über kontrollierten Media-Delivery-Vertrag;
- neuer Upload startet `pending` und wird niemals automatisch öffentlich;
- autorisierter Moderator kann `approve`, `reject`, `delete`;
- Rejection reason + optionale Moderatornotiz;
- jede Statusänderung in `media_moderation_history`;
- User-/Moderationszähler konsistent aktualisieren bzw. belastbar ableiten;
- User kann seinen Status/Ablehnungsgrund sehen, aber keine internen sensitiven Moderatordaten, sofern nicht dafür vorgesehen;
- CSRF, Permission, MIME/Decode, Dateigröße, Dateiname/Pfad und Ownership serverseitig prüfen;
- keine KI-Inhaltsmoderation.

Clientseitige Optimierung ist optional/ergänzend; serverseitige Validierung bleibt Autorität.

## Echte Tests

Mindestens:

- Viewer Upload → 401/403;
- User ohne Entitlement → 403;
- erlaubter valider Upload → `pending`;
- Fake MIME/ungültiges Bild/zu groß → abgelehnt;
- Upload ist vor Approval nicht öffentlich;
- Moderator approve/reject/delete mit Historie;
- normaler User kann Moderationsstatus nicht selbst ändern;
- Ownership-/Cross-user-Zugriff fail-closed.

---

# 8. Regression und Core-Freeze-Abnahme

Nach Behebung aller sechs Punkte vollständige Regression durchführen.

Mindestens erhalten/prüfen:

- User- und Adminlogin realer Browservertrag;
- Session-Deduplizierung und getrennte Session-Scopes;
- Passwortvertrag exakt 8–25, keine Leerzeichen;
- Profile/Privacy default-off;
- Settings-Unterseiten + Save ohne Redirect + Active-State;
- GPS I18N;
- GPS korrekte Position + Zoom/Pan;
- OSM neuer Tab;
- Entitlement `available/locked/hidden`;
- Device-Limits und scoped License Admin;
- Installationsmetriken ohne Fingerprint/PII;
- Medienworkflow und Moderationsscope;
- P1/P4 und Offline-First;
- PHP-Lint, JS-Syntax, `git diff --check`, vollständige Tests, Produktionspaket und Secret-/Artefaktprüfung.

Danach erneut ehrlich prüfen:

> Kann CatchTrack auf diesem Core mit Fachmodulen aufgebaut werden, ohne normale Produktfeatures durch Core-Sonderänderungen zu implementieren?

Core-Freeze nur dokumentieren, wenn die code-seitigen Verträge vollständig sind. Die vier heutigen Livefehler bleiben bis zum realen Betreiber-Retest `DEVICE RETEST REQUIRED`.

---

# 9. Deployment und Übergabe

Gemäß `WORKFLOW.md`:

1. Commit/push `main`.
2. CI/CodeQL/FTPS terminal abwarten.
3. `HEAD == origin/main`, sauberer Tree.
4. Deploymentrevision und read-only Produktionssmoke prüfen; `migrationsReady:true`.
5. Falls neue Migration nötig: ausschließlich über bestehenden checksummed/idempotenten Migrationsvertrag, niemals manuelles Produktions-SQL.
6. Relevante Dokumentation wahrheitsgemäß aktualisieren; falsche frühere `[x]`-/Freeze-Aussagen korrigieren.
7. Vollständigen Bericht in `CHATGPT.md` schreiben.
8. Kurze Betreiber-Retestliste exakt für die vier Livefehler plus die administrativ testbaren neuen License-/Media-Flows liefern.
9. Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` melden.
