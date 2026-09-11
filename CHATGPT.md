# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea
**Status:** USER-LOGIN CLICK-EYE DEPLOYED / OPERATOR RETEST REQUIRED
**Core Freeze:** NICHT erklärt

## Ergebnis

Der neueste Betreiberauftrag ersetzt den vorherigen sichtbaren Fallback. User Login besitzt wieder ein normales browser-autofillfähiges Passwortfeld (`name="password"`, `type="password"`, `autocomplete="current-password"`) und genau einen statischen Eye-Button direkt im Feld.

Der Eye-Klick ist vollständig lokal in `showLoginForm`: Klick schaltet nur den `type` zwischen `password` und `text`, aktualisiert ARIA und fokussiert dasselbe Input. Der Wert wird weder ersetzt noch neu gesetzt; ein vom Browser eingesetztes Passwort bleibt deshalb identisch. Es gibt keine externe Helper-Datei, keinen Observer, kein Hold-Verhalten und keine Änderung an Auth, Sessions oder Admin Login.

Wichtig: Das Passwortfeld maskiert nur die Browseranzeige. Verschlüsselung/Hashing wird dadurch nicht gesteuert und musste nicht geändert werden.

Lokal bestanden 540/540 Tests, JavaScript-Syntax, PHP-Lint, Diff-Check und das Production Package mit 134 Dateien. Verhaltenstests führen den realen Login-Renderer aus, setzen einen browserähnlich vorbefüllten Wert, klicken das Eye zweimal und prüfen Wert, Typ, ARIA sowie den tatsächlichen API-Submit im sichtbaren Zustand.

Commit `37d9d00bf84a344f43529be2e70d12a741933241` ist auf `main`. CodeQL `34599241157` und FTPS Deploy `34599240691` waren terminal erfolgreich. Tests, 134-Datei-Produktionspaket, FTPS-Client, Upload von 136 Dateien und read-only Production Smoke bestanden; Deploymentrevision und `migrationsReady:true` wurden bestätigt.

## Operator-Retest nach Deployment

1. Browser speichert/füllt das User-Passwort.
2. Eye-Klick zeigt exakt diesen Wert; zweiter Klick verbirgt ihn wieder.
3. User Login funktioniert normal und Inkognito.

Kein Core Freeze.
