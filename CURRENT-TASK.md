# CURRENT TASK – PRODUCTION MODULE CATALOG RECOVERY

**Status:** IMPLEMENTIERT – DEPLOYMENT/LIVE-RETEST AUSSTEHEND
**Datum:** 2026-09-12

- [x] Anonymous/authenticated request order, credentials, response scope and timing instrumented.
- [x] Online catalog made authoritative; anonymous cache restricted to offline fallback.
- [x] Delayed anonymous vs authenticated login race reproduced and fixed with latest-request-wins reconciliation.
- [x] Catalog failure remains retryable and successful retry updates state without reload.
- [x] Ralf/Tester, Developer and Administrator visibility audiences behavior-tested with effective GPS permissions.
- [x] Profile removed from commercial entitlement filtering via generic manifest contract.
- [x] Repeated visibility projection work removed from the server catalog hot path.
- [x] Production smoke extended with catalog scope, duration and server timing.
- [x] Theme one-change behavior and shared table border corrected.
- [x] Full local suite passed.
- [ ] Push, CodeQL, FTPS, production smoke and ordered operator retest.

Core Freeze remains not declared.
