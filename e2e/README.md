# End-to-End Testing

End-to-end test scaffolding has been removed from this repository as part of simplification.

## Current Status

- No Playwright configuration file is tracked.
- No `e2e/*.spec.ts` files are tracked.
- No shared E2E fixtures are tracked.

If browser-level E2E coverage is needed again, reintroduce it intentionally with a fresh
`playwright.config.ts` and new spec files under `e2e/`.
