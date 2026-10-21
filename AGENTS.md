# Factech Mobile Appium

- This repository tests the Resident and Technician mobile apps; it does not own product behavior.
- Android v1 uses WebdriverIO, TypeScript, Mocha, Appium, and UiAutomator2.
- Default lanes allow only `APP_ENV=test` and `.e2e` application packages. The explicit `production-smoke` lane may launch the approved installed Play Store package with retained data and no mutations. The `production-regression` lane may change data only in an approved production test account with all runtime confirmation gates enabled.
- Never commit APKs, device serials, credentials, auth state, `.env`, or reports.
- Use stable product `testID` selectors first. Accessibility labels remain human-readable.
- Keep `ISM_SK*` and `TEC_SK*` as source case IDs. Never invent `MTC-*`, Feature, Story, or AC IDs.
- Tests remain `@observe`. Data-changing tests require the guarded `production-regression` lane, unique test markers, result verification, and an explicit mutation opt-in.
- Hardware tests require an explicitly selected physical-device UDID and must not enter the emulator CI gate.
