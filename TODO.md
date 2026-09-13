# Neutral — next executable work

1. Finish the read-only/deep-cleanup audit on `lea/repository-deep-cleanup` and keep changes limited to proven historical artifacts, stale comments, dead references and documentation contradictions.
2. Preserve real compatibility and migration paths unless their removal is explicitly proven safe.
3. Before merge: inspect the full branch diff and run the available focused/full tests, syntax/lint/build/package checks and `git diff --check`. If the current execution environment cannot run them, do not claim the branch is verified.
4. Merge the cleanup branch only after verification; do not mix unrelated feature or module work into it.
5. Then resume the three confirmed User-UI repairs as a separate technical block:
   - Start/Home content does not reliably render after navigation.
   - Settings saves correctly but the shared `Successfully saved.` popup is missing in Production.
   - User Login password eye requires double-click instead of one normal click/tap.
6. After those three points pass and are live-retested, continue with the separate module-architecture audit and only then make an explicit Core-Freeze decision.

Later work remains in `ROADMAP.md`, including Referral/Rewards and the guided automatic setup routine.
