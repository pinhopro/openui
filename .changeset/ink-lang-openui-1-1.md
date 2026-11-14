---
"@openuidev/ink-lang": minor
---

OpenUI 1.1: the query manager evaluates the program's queries itself (`evaluateStatements`), so a Query whose arguments read another query's result waits for it and runs again when it changes, queries that read each other report `query-cycle` and do not run, and a `$state` reached through a referenced statement refetches when it changes. The schema parity test now compares `inkLibrary` with `@openuidev/react-ui`'s library directly instead of a generated docs file.
