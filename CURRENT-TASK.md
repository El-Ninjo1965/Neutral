# CURRENT TASK – REPOSITORY DEEP CLEANUP

**Status:** IN ARBEIT  
**Datum:** 2026-09-13  
**Branch:** `lea/repository-deep-cleanup`  
**Core Freeze:** NICHT erklärt

Ziel dieses separaten Wartungsblocks ist ein belegter Tiefenaudit des Repositorys ohne fachliche Funktionsänderungen.

## Scope

- historische Workflow-/Deployment-Artefakte entfernen;
- veraltete Phase-/Temporary-Kommentare bereinigen, wenn der zugrunde liegende Mechanismus regulärer Bestandteil des Systems ist;
- Dokumentationswidersprüche gegen den tatsächlichen Code korrigieren;
- tote Referenzen und eindeutig ungenutzte Reste nur dann entfernen, wenn ihre Nichtverwendung belegt ist;
- echte Legacy-/Kompatibilitäts-/Migrationspfade erhalten, solange sie funktional benötigt werden.

## Grenzen

- Keine neuen Features.
- Keine Profile-/Moderation-/Modulreparaturen.
- Keine funktionale Änderung an Auth, Sessions, Modulruntime, Backup/Restore oder Deployment ohne gesonderten Fehlernachweis.
- Keine Entfernung von Legacy-Pfaden nur wegen ihres Namens.
- Kein Merge nach `main`, bevor Diff und verfügbare Tests/Checks verifiziert sind.

## Bekannte offene User-UI-Fehler

Die drei bestätigten User-UI-Fehler bleiben offen und sind **nicht** Bestandteil dieses Cleanup-Branches:

1. Start/Home rendert nach Navigation nicht zuverlässig den Home-Content.
2. Das gemeinsame `Successfully saved.`-Popup fehlt im realen Browser trotz erfolgreichem Save.
3. Das Passwort-Auge benötigt aktuell Doppelklick statt normalem Einzelklick/Tap.

Nach Abschluss des Cleanup-Blocks wird der technische Reparaturblock dafür separat fortgesetzt.
