# NEUTRAL – CHATGPT HANDOFF

**Richtung:** ChatGPT/Lea ↔ Agenten  
**Branch:** `main`  
**Datum:** 2026-09-13  
**Status:** 3 USER-UI-FEHLER OFFEN  
**Letzter verifiziert deployter Code-Stand:** `5c1ac7659126de7d901386622b00e1d75d3e10ba`

## Aktueller Live-Stand

Der User-UI- und Admin-Live-Retest wurde durchgeführt. Allgemeine frühere Retest-Blöcke sind nicht mehr offen.

Bestätigt funktionsfähig sind insbesondere:

- anonyme und authentifizierte Navigation zu GPS und Settings;
- Theme;
- Login;
- GPS-Position, Aktualisierung, Google Maps und natives Teilen;
- Settings Apps/Navigation einschließlich GPS-Aktivierung und Label Rename/Restore;
- Admin-Login und zentrale Adminbereiche einschließlich Users, Packages, Licenses, Sessions, Roles/Permissions, Connections, Database-Test, Backup/Restore, Diagnostics und Audit;
- CI/Test-/Deploymentpfad des zuletzt deployten Code-Stands.

## Drei offene User-UI-Fehler

1. **Start/Home:** `Start` wird aktiv, aber der sichtbare Content bleibt auf der vorherigen View. Ein normaler Klick/Tap muss Home tatsächlich rendern und Active-State, View-State und Route konsistent halten.
2. **Settings Save Success:** Änderungen werden gespeichert, aber das gemeinsame `Successfully saved.`-Popup erscheint im realen Browser nicht. Es muss nach erfolgreichem Save erscheinen und bis zur Benutzeraktion sichtbar bleiben.
3. **Passwort-Auge:** Ein normaler Einzelklick/Tap toggelt die Passwortsichtbarkeit nicht zuverlässig; aktuell funktioniert erst Doppelklick. Ein einzelner Klick/Tap muss `password ↔ text` toggeln.

Diese drei Fehler bilden den nächsten technischen Arbeitsblock. Keine Modularchitektur-, Profile-, Moderation-, Access- oder Admin-Reparaturen damit vermischen.

## Arbeitsregel

- Root Cause vor Änderung belegen.
- Passenden Failing-Test vor der Reparatur nachweisen oder ergänzen.
- Danach fokussierte Tests und Vollsuite ausführen.
- Relevante Syntax-/Lint-/Build-/Package-Prüfungen und `git diff --check` durchführen.
- Erst nach erfolgreicher CI, Deployment und read-only Production Smoke den technischen Block als erledigt betrachten.
- Danach gezielter Operator-Live-Retest exakt dieser drei Punkte.

## Danach

Nach technischer Reparatur und Live-Abnahme der drei User-UI-Punkte folgt ein separater Modularchitektur-Audit. Erst danach werden Profile/Moderation und weitere optionale Module erneut bewertet bzw. repariert.

Architekturgrundsatz: Ein optionales Modul muss deaktivierbar sein, ohne Core oder unabhängige Module funktionsunfähig zu machen. Eine tatsächlich systemnotwendige Fähigkeit muss ausdrücklich Core/Required sein.

**Core Freeze:** NICHT erklärt.