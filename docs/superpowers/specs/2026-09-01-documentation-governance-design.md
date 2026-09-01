# NEUTRAL – Documentation Governance Design

**Status:** Approved on 2026-09-01  
**Scope:** Repository documentation only; no runtime behavior changes

## Goal

Create one durable documentation hierarchy that distinguishes long-term vision, the finishable Core 1.0 contract, verified current state, future roadmap, immediate work and completed changes. Future work must be able to determine both authority and progress without reconstructing earlier conversations.

## Authority hierarchy

1. `VISION.md` defines the long-term product direction and non-negotiable principles.
2. `CORE-1.0.md` defines the finite release scope and acceptance criteria for Neutral Core 1.0.
3. `Architecture.md` and `ModuleCreation.md` define technical boundaries and extension contracts.
4. `API.md`, `Database.md`, `Security.md` and `Functions.md` document specific verified contracts.
5. `STATUS.md` records the evidence-backed implementation state without changing requirements.
6. `TODO.md` contains only the next executable work and may not invent architecture.

`ROADMAP.md` contains work deliberately outside Core 1.0. `CHANGELOG.md` records completed changes. `DOCUMENTATION.md` is the entry point and conflict-resolution guide.

## Status vocabulary

- `VORHANDEN`: implemented and supported by code or a named test.
- `TEILWEISE`: a useful implementation exists, but a named requirement remains open.
- `GEPLANT`: approved target without a complete implementation.
- `FEHLT`: required capability with no dependable implementation.
- `BLOCKIERT`: work cannot continue until a named external condition is met.

No document may present a target as implemented. Operational/live claims require a dated live check.

## Platform boundary

Core 1.0 must run on the confirmed minimum platform: PHP 8.x, MySQL/MariaDB, HTTPS and normal shared-hosting filesystem access. Node.js, permanent workers, Redis, WebSockets and native app tooling are optional future adapters and must not be Core 1.0 runtime requirements. Background processing on the minimum platform uses bounded PHP work and optional hosting cron jobs.

## Progress model

`STATUS.md` is a snapshot and links each claim to code, tests or an explicit live check. `TODO.md` is short and ordered. Completed work moves to `CHANGELOG.md`; it is not retained indefinitely as checked-off TODO history. Every future material change updates the affected contract document, `STATUS.md`, `TODO.md` and `CHANGELOG.md` in the same commit.

## Validation

Documentation is accepted when all Markdown links resolve, status terms use the common definitions, known timeout and hosting contradictions are removed, Core 1.0 has finite acceptance criteria, and the normal repository test suite still passes.
