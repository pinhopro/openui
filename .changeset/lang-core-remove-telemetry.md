---
"@openuidev/lang-core": patch
---

Remove install-time telemetry (the `postinstall` script, `postinstall.cjs` and the `ci-info` dependency) and make the opt-in runtime telemetry hooks no-ops. Nothing is sent anymore.
