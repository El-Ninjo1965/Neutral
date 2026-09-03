# Anonymous Offline Module Access Design

**Status:** FREIGEGEBENE PRAEZISIERUNG DER VISION  
**Datum:** 2026-09-03  
**Ausgeführt und dokumentiert durch:** Codex (ChatGPT Work)

## Ziel

Ein Besucher ohne Login kann jedes aktive Modul sehen und lokal benutzen, dessen notwendige Modulrechte der Betreiber im Adminbereich dem eingebauten Zugriffsprofil `viewer` zugewiesen hat. Der Zugriff bleibt offline-first, ohne Browserentscheidungen in serverseitige Rechte umzuwandeln.

## Zugriffsgrenze

- `viewer` bleibt eine vorhandene authentifizierbare Systemrolle.
- Nur beim öffentlichen `GET /api/v1/modules` wertet der Server dieselben Modulrechte zusätzlich als anonymes Zugriffsprofil aus.
- Diese Abbildung gilt ausschließlich für deklarierte `visibilityPermissions` und `usagePermissions` aktiver Module.
- Core-, Admin-, Benutzer-, Session-, Audit-, Backup-, Management- und sonstige Serverrechte werden dadurch niemals anonym erteilt.
- Serverseitige Modulaktionen benötigen weiterhin eine echte Sitzung, serverseitige Berechtigung und bei Änderungen CSRF-Schutz.
- Ein Modul ohne ausdrückliches Viewer-Sichtbarkeitsrecht ist für Besucher unsichtbar. Fehlende oder unklare Metadaten gewähren keinen Zugriff.

## Öffentlicher Modulkatalog

Der Server liefert nur aktive, für den aktuellen Kontext sichtbare Module. Jeder Eintrag enthält den bereinigten Hinweis:

```json
{
  "clientAccess": {
    "mode": "anonymous",
    "canView": true,
    "canUse": true
  }
}
```

`canUse` ist nur wahr, wenn keine Nutzungsrechte verlangt werden oder mindestens eines der deklarierten Nutzungsrechte im anonymen Viewerprofil liegt. Der Client verwendet diesen Hinweis ausschließlich für lokale Navigation und Gerätefunktionen; er ist kein Server-Token.

## Offline-First

- Nur ein erfolgreich geladener Katalog mit `mode: anonymous` wird lokal gespeichert.
- Ein authentifizierter Katalog wird niemals als anonymer Offlinekatalog gespeichert.
- Bei Netzfehlern darf ausschließlich der letzte gültige anonyme Katalog verwendet werden.
- Ohne früheren gültigen anonymen Katalog bleibt die anonyme Modulliste leer und damit fail-closed.
- Deaktivierungen und entzogene Rechte greifen online sofort. Ein bereits offline befindliches Gerät kann bis zur nächsten erfolgreichen Verbindung nur lokale Fähigkeiten des zuletzt freigegebenen Katalogs weiterverwenden.
- Serverabhängige Aktionen bleiben offline nicht verfügbar und werden bei erneuter Verbindung erneut serverseitig geprüft.

## GPS-Referenz

- GPS erscheint anonym nur, wenn es aktiv ist und `gps.view` dem Viewer zugewiesen wurde.
- Geräteortung ist anonym nur möglich, wenn zusätzlich `gps.use` dem Viewer zugewiesen wurde.
- Eine lokal gespeicherte letzte Position wird beim Öffnen sofort angezeigt.
- Ist die Browserberechtigung bereits `granted`, fordert GPS automatisch eine aktuelle Einzelposition an.
- Bei `prompt` wird keine Berechtigungsabfrage ohne Nutzergeste ausgelöst; der erste Zugriff bleibt ein bewusster Tastendruck.
- Standortdaten bleiben standardmäßig lokal. Serverübertragung benötigt einen eigenen späteren Vertrag und eine ausdrückliche Freigabe.

## Oberfläche

- Die öffentliche Modulnavigation verwendet ausschließlich den vom Server bestätigten oder anonym zwischengespeicherten Katalog.
- Lokale Einstellungen bleiben ohne Login verfügbar, werden aber eindeutig als lokale Einstellungen bezeichnet.
- Die Admin-Modulansicht erklärt beim Viewerprofil, dass nur Modul-Sichtbarkeit und -Nutzung zugleich den anonymen Zugriff steuern.

## Abnahme

1. Viewer ohne `gps.view`: GPS fehlt anonym.
2. Viewer nur mit `gps.view`: GPS ist sichtbar, Ortung bleibt gesperrt.
3. Viewer mit `gps.view` und `gps.use`: GPS ist anonym sichtbar und lokal nutzbar.
4. Authentifizierte Rollen behalten ihre eigenen Modulrechte.
5. Inaktive Module werden nie ausgeliefert.
6. Online geladener anonymer Katalog funktioniert anschließend offline.
7. Authentifizierter Katalog wird nach Logout nicht anonym wiederverwendet.
8. GPS zeigt Cache sofort und aktualisiert bei bereits erteilter Browserberechtigung automatisch.

