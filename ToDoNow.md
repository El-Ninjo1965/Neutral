# To Do Now

Nächster Implementierungsauftrag: **Profile Activation Internal Server Error** reproduzieren und beheben. Dabei zuerst die bereits im Core-Schema vorhandene `user_profiles`-Tabelle gegen die Profile-Modulmigration (`gender`, `avatar_data`) sowie Migrationstombstone/-hash und Aktivierungsfehlerabbildung prüfen. Danach Profile aktivieren, deaktivieren und erneut aktivieren und Datenerhalt nachweisen. Keine anderen Features, kein Field Notes und kein Production-Restore in diesen Auftrag hineinziehen.

Anschließende feste Reihenfolge: Media Install → Unlimited Devices → User Login Eye → mobile User List/Edit → rollenbezogene Module Visibility → Systemmodul-/Profile-Live-Retest → Field Notes.
