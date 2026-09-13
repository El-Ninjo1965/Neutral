# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** REPOSITORY DEEP CLEANUP  
**Datum:** 2026-09-13  
**Arbeitsbranch:** `lea/repository-deep-cleanup`  
**Core Freeze:** NICHT erklärt

## Zuerst lesen

1. `CURRENT-TASK.md`
2. `CHATGPT.md`
3. `WORKFLOW.md`
4. `VISION.md`
5. `CORE-1.0.md`
6. `Architecture.md`
7. danach aktuellen Branch-Diff und relevante Tests.

## Auftrag

Führe ausschließlich den Tiefenaudit/Bereinigungsblock fort. Entferne oder korrigiere nur Dinge, deren Status belegt ist:

- historische Workflow-/Deployment-Ausnahmen ohne aktuellen Zweck;
- veraltete Phase-/Temporary-Kommentare, wenn der darunterliegende Mechanismus regulärer Bestandteil des Systems ist;
- Dokumentationswidersprüche gegen den aktuellen Code;
- tote Referenzen oder eindeutig ungenutzte Reste nach Nachweis.

Echte Kompatibilitäts-, Migrations- und Restore-Pfade bleiben erhalten, solange ihre Entfernung nicht ausdrücklich als sicher belegt ist.

## Grenzen

- Keine Features.
- Keine User-UI-Reparaturen in diesen Branch mischen.
- Keine Profile-/Moderation-/Access-/Modulreparaturen.
- Keine funktionale Auth-/Session-/Backup-/Modulruntime-Änderung ohne separaten Root-Cause-Nachweis.
- Kein Production Restore.
- Kein Core Freeze.
- Nicht direkt auf `main` arbeiten.

## Verifikation vor Merge

Mindestens:

- vollständigen Branch-Diff gegen `main` prüfen;
- passende fokussierte Tests, falls funktionaler Code betroffen ist;
- vollständige Testsuite;
- relevante JS-Syntax-/PHP-Lint-/Build-/Package-Prüfungen;
- `git diff --check`;
- keine Erfolgsbehauptung, falls ein Check in der jeweiligen Umgebung nicht ausgeführt werden konnte.

Die drei bekannten User-UI-Fehler bleiben offen und werden nach diesem Cleanup in einem separaten Block repariert.
