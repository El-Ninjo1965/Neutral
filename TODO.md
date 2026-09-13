# Neutral — next executable work

1. Repair the three confirmed User-UI live failures only:
   - Start/Home active state changes but Home content does not render.
   - Settings saves correctly but the shared `Successfully saved.` popup is missing in Production.
   - User Login password eye requires double-click instead of one normal click/tap.
2. Run focused tests, full suite, syntax/lint/build/package checks, `git diff --check`, deployment and read-only Production Smoke.
3. Perform the targeted operator live retest for those three User-UI points and record the result truthfully.
4. After those three points pass, perform the separate module-architecture audit described in `CHATGPT.md`; do not mix Profile/Moderation/module work into the User-UI repair batch.
5. Make a separate explicit Core-Freeze decision only after the required architecture and live gates are actually complete.

Later work remains in `ROADMAP.md`, including Referral/Rewards and the guided automatic setup routine.
