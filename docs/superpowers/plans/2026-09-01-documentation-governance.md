# Documentation Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a contradiction-resistant documentation hierarchy and an evidence-based Core 1.0 progress record.

**Architecture:** Add a single documentation entry point and separate durable requirements from mutable status, immediate tasks and historical changes. Normalize existing contract documents to the approved hierarchy and the PHP-first minimum-hosting boundary.

**Tech Stack:** Markdown, Git, Node.js repository tests

**Spec:** `docs/superpowers/specs/2026-09-01-documentation-governance-design.md`

## Global Constraints

- PHP 8.x, MySQL/MariaDB and HTTPS are the required Core 1.0 production platform.
- Node.js and professional infrastructure remain optional future adapters.
- Only code-, test- or live-check-backed capabilities may be marked `VORHANDEN`.
- No secrets, credentials or host-local values may enter documentation or commits.

---

### Task 1: Establish documentation authority

**Files:**
- Create: `DOCUMENTATION.md`
- Modify: `VISION.md`
- Modify: `WORKFLOW.md`

**Interfaces:**
- Produces: the repository-wide authority order and maintenance rules consumed by every other document.

- [ ] Add the documentation map, conflict rules, status vocabulary and update matrix.
- [ ] Restrict `VISION.md` to long-term intent and record the PHP-first portability principle.
- [ ] Change `WORKFLOW.md` so future completion history goes to `CHANGELOG.md`.
- [ ] Verify all named document paths exist.
- [ ] Commit the documentation governance foundation.

### Task 2: Define the finite Core 1.0 release

**Files:**
- Create: `CORE-1.0.md`
- Create: `STATUS.md`
- Create: `ROADMAP.md`

**Interfaces:**
- Consumes: authority and vocabulary from `DOCUMENTATION.md`.
- Produces: finite acceptance criteria, evidence snapshot and explicitly deferred scope.

- [ ] Define Core 1.0 goals, non-goals, platform floor and acceptance gates.
- [ ] Map every Core 1.0 capability to `VORHANDEN`, `TEILWEISE`, `GEPLANT` or `FEHLT` with evidence.
- [ ] Move PWA, stores, Node, WebSockets and scaling into the post-1.0 roadmap.
- [ ] Check that no deferred item remains a Core 1.0 acceptance requirement.
- [ ] Commit the Core 1.0 contract and status baseline.

### Task 3: Normalize detailed contracts and executable work

**Files:**
- Modify: `Architecture.md`
- Modify: `API.md`
- Modify: `Database.md`
- Modify: `Functions.md`
- Modify: `ModuleCreation.md`
- Modify: `Security.md`
- Replace: `TODO.md`
- Create: `CHANGELOG.md`
- Modify: `docs/superpowers/specs/2026-09-01-split-app-admin-deployment-design.md`

**Interfaces:**
- Consumes: Core 1.0 scope and status vocabulary.
- Produces: consistent detailed contracts, short ordered next-work list and historical record.

- [ ] Add authority/status headers and cross-links to detailed documents.
- [ ] Correct stale API-timeout statements against the current `ApiClient` implementation and tests.
- [ ] Reduce `TODO.md` to the next ordered Core 1.0 work packages.
- [ ] Mark the earlier split-deployment draft as non-authoritative pending reconciliation.
- [ ] Record this documentation baseline in `CHANGELOG.md`.
- [ ] Commit the normalized documentation set.

### Task 4: Verify and publish

**Files:**
- Test: all tracked Markdown files and repository test suite

**Interfaces:**
- Consumes: the complete documentation set.
- Produces: a clean, pushed `main` commit available on GitHub.

- [ ] Scan for broken relative Markdown links and inconsistent status vocabulary.
- [ ] Scan for secrets and accidental host-local values.
- [ ] Run `npm test` and record the result in `STATUS.md` only if it completed successfully.
- [ ] Review `git diff --check`, `git status` and the final diff.
- [ ] Commit any verification corrections and push `main` to `origin`.
