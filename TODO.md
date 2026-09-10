# NEUTRAL – nächste ausführbare Arbeiten

**Stand:** 2026-09-11
**Regel:** Reihenfolge ist verbindlich; keine Aufgabe gilt durch lokale Tests allein als live bestanden.

1. Profile Activation `Internal Server Error` reproduzieren und beheben; Core-/Modulmigrations-Doppelzuständigkeit prüfen; aktiv/deaktiv/re-aktiv mit Datenerhalt testen.
2. Media & Upload Install `Load failed` reproduzieren und beheben; danach sicheren generischen Upload-/Storagevertrag statt Status-Scaffold implementieren.
3. Unlimited-Device-Auflösung über Package → User → Login/Session/API/UI ursächlich beheben; `NULL/unlimited` darf nirgends `0` werden.
4. User-Login-Eye auf tatsächlichem iPad normal/privat sichtbar machen; Scriptreihenfolge, CSS, Service-Worker-/Cache-Update und Touch prüfen.
5. User Management auf kleinen Screens in getrennte List- und Edit/Create-States umbauen; Save/Cancel/Back zur Liste.
6. Rollenbezogene Module Visibility/Navigation getrennt von Permissions implementieren; Systemmodule dürfen User-unsichtbar bleiben.
7. Systemmodule live erneut lifecycle-testen; Lifecycle und Fachfunktion getrennt protokollieren.
8. Profile vollständig live prüfen und Avatarworkflow (Crop, optimiert ≤256×256, Replace/Delete, rund, Gender-Defaults, Cache/Backup) vervollständigen.
9. Danach Field Notes als separaten Neubau-/Freeze-Test ohne fachliche Core-Änderung implementieren.
10. Erst nach den Freeze-Gates die in `ROADMAP.md` definierte weitgehend selbsterkennende Setup-Routine umsetzen.

Keine destruktive Produktionsaktion und kein Production-Restore als Test.
