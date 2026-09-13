# NEUTRAL – CODEX HANDOFF

**Status:** KEIN AKTIVER CODEX-AUFTRAG
**Datum:** 2026-09-13

Der frühere Offline-First-/GPS-Auftrag ist abgeschlossen und darf nicht erneut ausgeführt werden.

Vor jedem neuen Auftrag zuerst lesen:
- `CHATGPT.md`
- `CURRENT-TASK.md`
- `WORKFLOW.md`
- `VISION.md`
- `Architecture.md`
- `CORE-1.0.md`
- bei Modulen zusätzlich `ModuleCreation.md`
- danach den aktuellen relevanten Code und die Tests.

Aktuell bekannte, durch Operator-Livetest bestätigte User-UI-Punkte stehen in `CHATGPT.md`:
1. Start/Home markiert sich aktiv, aber der Content wechselt nicht auf Home.
2. Settings Save speichert, aber das Success-Popup fehlt im realen Browser.
3. Das Passwort-Auge benötigt Doppelklick statt Einzelklick/Tap.

Diese Punkte sind noch kein Codex-Auftrag, solange Lea/ChatGPT keinen neuen Auftrag ausdrücklich freigibt.

Für Module gilt `ModuleCreation.md` als operativer Vertrag. App Modules und System Modules verwenden dieselbe Runtime. Optionale Module dürfen Core oder unabhängige Module nicht blockieren. Neue harte Modulabhängigkeiten sind Ausnahmefälle und müssen vorab architektonisch begründet werden.

Kein Merge nach `main` und kein Deployment ohne ausdrückliche Freigabe im jeweiligen Auftrag.
