# NEUTRAL – CHATGPT HANDOFF

**Richtung:** ChatGPT/Lea ↔ Agenten  
**Branch:** `lea/repository-deep-cleanup`  
**Datum:** 2026-09-13  
**Status:** REPOSITORY DEEP CLEANUP IN ARBEIT  
**Core Freeze:** NICHT erklärt

## Aktueller Arbeitsblock

Der laufende Branch ist ein separater Tiefenaudit/Bereinigungsblock. Ziel ist nicht, Funktionen umzubauen, sondern belegte historische Artefakte, veraltete Kommentare, tote Referenzen und Dokumentationswidersprüche zu entfernen bzw. zu korrigieren.

Bisherige belegte Cleanup-Funde:

- obsolete `[cleanup-public-html]`-Ausnahme im aktiven FTPS-Workflow;
- Widerspruch zwischen `BACKUP-CONTRACT.md` und der weiterhin vorhandenen V1-Restore-Kompatibilität;
- alte Entwicklungsphasen-Bezeichnungen in Node-Auth-Kommentaren;
- als `TEMPORARY` bezeichnete Core-Performance-Marks, obwohl die Messinfrastruktur regulär vorhanden ist;
- Compatibility-/Legacy-Pfade wurden geprüft und **nicht** allein wegen ihres Namens entfernt.

## Sicherheitsgrenze des Cleanup

- Keine neue Fachlogik.
- Keine Entfernung funktionaler Kompatibilitäts-/Migrationspfade ohne Nachweis.
- Keine Profile-/Moderation-/Access-/Modulreparaturen in diesen Branch mischen.
- Keine funktionale Auth-/Session-/Backup-/Restore-Änderung ohne separaten Root-Cause-Nachweis.
- Kein Production Restore.
- Kein Core Freeze.

## Verifikation

Der Branch ist erst mergefähig, wenn der vollständige Diff gegen `main` geprüft und die verfügbaren Tests/Checks frisch ausgeführt wurden. In Umgebungen ohne ausführbaren Repository-Checkout darf kein Test-PASS behauptet werden.

## Bekannte offene User-UI-Fehler außerhalb dieses Branches

1. **Start/Home:** `Start` wird aktiv, aber der sichtbare Content bleibt auf der vorherigen View.
2. **Settings Save Success:** Änderungen werden gespeichert, aber das gemeinsame `Successfully saved.`-Popup erscheint im realen Browser nicht.
3. **Passwort-Auge:** Ein normaler Einzelklick/Tap toggelt die Passwortsichtbarkeit nicht zuverlässig; aktuell funktioniert erst Doppelklick.

Diese drei Fehler bleiben offen und werden nach dem Cleanup in einem separaten technischen Block fortgesetzt.
