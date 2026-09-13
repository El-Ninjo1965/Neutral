# NEUTRAL – LOCAL AGENT HANDOFF

**Status:** KEIN AKTIVER AGENTENAUFTRAG  
**Datum:** 2026-09-13  
**Branch:** `main`

## Aktueller Stand

Der frühere Auftrag auf `lea/user-ui-stability` ist abgeschlossen und darf nicht erneut ausgeführt werden.

Abgeschlossen sind insbesondere:
- stale-discovery Test C und zugehöriger Produktionsfix;
- Pending/Retry-Harnesskorrektur;
- Success-Dialog-Harnesskorrektur;
- User-UI-Stability-Branch;
- Merge und Deployment dieses Blocks.

Der aktuelle Projekt- und Live-Stand steht in `CHATGPT.md`.
Der aktuelle Modulvertrag steht in `ModuleCreation.md`.
Architekturgrundlagen stehen in `VISION.md`, `Architecture.md` und `CORE-1.0.md`.

## Agentenregel

Ohne ausdrücklich neuen Auftrag von Lea/ChatGPT:
- keine Produktionsdateien ändern;
- keine alten Branch-Aufträge fortsetzen;
- keine historischen STOP-/FAIL-Angaben als aktuellen Projektstatus behandeln;
- keinen Merge und kein Deployment durchführen.

Vor einem neuen Entwicklungsauftrag zuerst die aktuellen Dokumente und danach den relevanten aktuellen Code lesen.

## Bekannte offene Live-Punkte

Der Operator-Live-Retest nach dem letzten Deployment hat drei getrennt zu bearbeitende User-UI-Probleme bestätigt:
1. Start/Home wird optisch aktiv, aber der Content wechselt nicht auf Home.
2. Settings werden gespeichert, aber das Success-Popup fehlt im realen Browser.
3. Das Passwort-Auge reagiert erst auf Doppelklick statt auf einen einzelnen Tap/Klick.

Diese Punkte sind in `CHATGPT.md` dokumentiert. Sie sind noch kein Arbeitsauftrag, bis Lea/ChatGPT einen neuen Auftrag ausdrücklich freigibt.

## Modularchitektur

Für neue oder zu reparierende Module gilt `ModuleCreation.md` als aktueller Arbeitsvertrag. Ein optionales Modul darf Core oder unabhängige Module nicht zu seiner Voraussetzung machen. Harte Modulabhängigkeiten sind Ausnahmefälle und müssen vor Verwendung architektonisch begründet werden.
