# End-to-end tests

Playwright tests that drive the real site in Chromium (install once: `npx playwright install chromium`).

```
npm run test:e2e          # build, start on :3000, run everything
npx playwright test       # reuse a server already running on :3000
npx playwright show-report e2e/report
```

The tests use the real Neon database and blob store. Global setup
creates throwaway accounts (`e2e-*@e2e.test`) and everything the tests
create is titled `[E2E] …`; global teardown deletes all of it and puts
Site Settings back the way they were. Setup also clears the
`rate_limit` table so earlier runs don't block sign-in.
