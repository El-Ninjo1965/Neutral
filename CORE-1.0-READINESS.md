# Neutral Core 1.0 – Readiness

**Stand:** 2026-09-11
**Gesamtstatus:** **NICHT FREEZE-BEREIT**

## Nachgewiesene Grundlage

- Produktionsfähige PHP/MySQL-/HTTPS-Basis, Auth/RBAC/CSRF, getrennte Sessions, Audit und Adminbetrieb.
- Generischer Modulvertrag mit Discovery, Registration/Installation, Activation, Permission-/CSRF-Routen, Migrationen, Settings und Backupdeklaration.
- Unsichtbare Systemmodulpräsentation und optionale Dependency-Metadaten.
- Packages/Licenses/direct Package, Sessions/Installation-ID, konfigurierbarer Backup-Pfad und Backup V2 sind code-/testseitig vorhanden; frühere datierte Livebefunde bleiben in Changelog/Workflow.
- Moderation, Notifications, Postbox und Sharing bestanden am 2026-09-11 real den Lifecycle Install/Activate/Deactivate/Activate; danach deaktiviert. Kein Fachfunktionsnachweis.

## Blockierende Livefehler

- Profile registered/inactive; Activate endet `Internal Server Error`.
- Media discovered/not registered; Install endet `Load failed`.
- Unlimited-Package wird im Session-/Loginfall als `0` behandelt (`2 of 0`) und blockiert Login.
- User-Login-Eye fehlt auf Betreiber-iPad normal und privat.

## Weitere Freeze-Gates

- Profile wirklich disable-/re-enable-stabil mit Datenerhalt; vollständiger Avatar-/Gender-Vertrag live.
- Media als belastbarer generischer Upload-/Storagevertrag; Systemmodul-Scaffolds nicht mit fertigen Fachprodukten verwechseln.
- Rollenbezogene Modul-Visibility/Navigation getrennt von Permissions.
- Mobile User Management mit getrennten List-/Edit-States.
- Systemmodule nach Reparaturen erneut live prüfen.
- Field Notes anschließend als neues unabhängiges Modul ohne fachliche Core-Änderung.
- Offene Host-/Move-/Operatorgates gemäß Status/Installationsvertrag.

Keine Freeze-Erklärung. Kein Produktions-Restore als Abnahmetest.
