# Documentation Consistency Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the identified stale statements from the authoritative Neutral documentation without changing architecture or release scope.

**Architecture:** Treat `VISION.md` and `CORE-1.0.md` as requirements, `API.md`/code as technical evidence, and update only stale lower-level status statements. Record the documentation-only correction in the changelog and workflow.

**Tech Stack:** Markdown, GitHub repository documentation.

**Spec:** `DOCUMENTATION.md`

## Global Constraints

- Do not invent new architecture, features, or release requirements.
- Keep Node.js optional for production.
- Preserve GPS as the device/client technical reference while identifying `reference-notes` as the independent server module-contract reference.
- API versioning is implemented: `/api/v1` canonical, `/api` compatible, `X-Neutral-API-Version: 1`.

---

### Task 1: Correct Architecture status

**Files:**
- Modify: `Architecture.md`

- [ ] Replace the stale statement that GPS is the only concrete reference extension with the precise split between GPS and `reference-notes`.
- [ ] Replace the stale API-versioning gap with the implemented `/api/v1` contract; retain only the missing general safe retry policy as a gap.

### Task 2: Record the correction

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `WORKFLOW.md`

- [ ] Add a dated documentation-consistency entry describing only the corrected contradictions.
- [ ] Record executor, evidence, result, and unchanged open TODOs in the workflow log.

### Task 3: Verify consistency

**Files:**
- Read: `VISION.md`, `CORE-1.0.md`, `Architecture.md`, `API.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `CHANGELOG.md`, `WORKFLOW.md`

- [ ] Confirm no remaining claim says API versioning is missing.
- [ ] Confirm GPS/reference-notes roles are not conflated.
- [ ] Confirm TODO ordering and Core-1.0 scope were not changed.
- [ ] Verify the resulting GitHub `main` contents directly.
