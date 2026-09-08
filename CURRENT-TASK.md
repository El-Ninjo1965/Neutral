# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Die heute verifizierte Codex-Arbeitsumgebung `Neutral` als dauerhaften,
secretsicheren Betriebsweg für `El-Ninjo1965/Neutral` dokumentieren, damit neue
Codex-Sitzungen Repository-, GitHub-, FTPS- und ENV-Zugänge zuerst über diesen
Standardweg prüfen und nicht erneut die gesamte Zugangshistorie untersuchen.

Dieser Auftrag ist ausschließlich Dokumentationsarbeit. P1 bleibt
`LIVE BESTANDEN`, P4 bleibt `PENDING`; keine P4- oder sonstige Featurearbeit.

## Nummerierte, überprüfbare Arbeitspunkte

1. `CODEX.md`, `WORKFLOW.md` und die bestehende Betriebsdokumentation vollständig lesen. **Status: ERLEDIGT**
2. Betreiberauftrag vollständig erfassen und gegen diese Arbeitsliste prüfen. **Status: ERLEDIGT**
3. In `CONNECTIONS.md` die Umgebung `Neutral` als verbindliche Codex-Umgebung dokumentieren. **Status: ERLEDIGT**
4. GitHub-Standardweg über `GH_TOKEN`, Konto `El-Ninjo1965`, Repository `El-Ninjo1965/Neutral`, Branch `main` und HTTPS-`origin` dokumentieren. **Status: ERLEDIGT**
5. Die erforderlichen Secret-Namen und ihre Zwecke dokumentieren, ohne Secret-Werte zu speichern oder auszugeben. **Status: ERLEDIGT**
6. GitHub-Actions-FTPS-Weg und direkten manuellen Explicit-FTPS-Weg einschließlich aktueller Hosts, Port, Benutzer und secretsicherem Zielpfad-Verweis dokumentieren; keine historischen FTP-Accounts wiederherstellen. **Status: ERLEDIGT**
7. Start-/Wiederherstellungsablauf für neue austauschbare Sandboxes, fehlendes `origin` und scheinbar fehlenden GitHub-Schreibzugriff dokumentieren. **Status: ERLEDIGT**
8. Vorrang der aktuellen DB-, Bootstrap-, Admin-, Auth- und ENV-Konfiguration sowie der P1-konformen Sessiontrennung dokumentieren. **Status: ERLEDIGT**
9. `WORKFLOW.md` um die verpflichtende Prüfung der Umgebung `Neutral` vor jeder neuen Codex-Task ergänzen und den Übergabekanal beibehalten. **Status: ERLEDIGT**
10. Sicherstellen, dass keine Secret-Werte, künstlichen Testdateien oder Featureänderungen entstanden sind. **Status: ERLEDIGT**
11. Für reine Dokumentationsänderungen erforderliche Prüfungen ausführen und Ergebnisse in `CHATGPT.md` berichten. **Status: ERLEDIGT**
12. Dokumentation committen und authentifiziert nach GitHub `main` pushen. **Status: ERLEDIGT**
13. `CHATGPT.md` mit Ausgangscommit, finalem Stand, Änderungen, Tests, offenen Punkten, Device-Retest, Push, CI, `HEAD == origin/main` und Working Tree aktualisieren und auf GitHub `main` verifizieren. **Status: ERLEDIGT**
14. FTPS, CodeQL und sonstige relevante CI bis zum terminalen Status abwarten. **Status: ERLEDIGT – finaler CodeQL- und FTPS-Lauf terminal erfolgreich; zwei vorherige FTPS-Smoke-Fehlschläge blieben als Diagnoseevidenz erhalten**
15. Abschließend sauberen Working Tree und `HEAD == origin/main` verifizieren. **Status: ERLEDIGT – nach finalem Berichts-Push erneut geprüft**

## Capture-Prüfung

`Neuer Betreiberauftrag == CURRENT-TASK-Anforderungen: JA`

## Sicherheits- und Arbeitsgrenzen

- Nur Namen, Zweck und Verwendung von Secrets dokumentieren; niemals Werte.
- Secrets bleiben in der persistenten Codex-Umgebung beziehungsweise den dafür vorgesehenen Secret-/ENV-Strukturen.
- Repository = dauerhafte nicht geheime Anleitung; Umgebung `Neutral` = dauerhafte Secrets; Sandbox = austauschbar.
- Keine fremden Änderungen verwerfen oder Arbeitsstände blind resetten.
- Keine P4-Featurearbeit beginnen.
