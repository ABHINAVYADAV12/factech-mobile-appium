# Factech Mobile Appium

Read-only Android automation for the iSocietyManager Resident and Facility Manager Technician apps. The stack is WebdriverIO, TypeScript, Mocha, Appium, and UiAutomator2.

## Prerequisites

- Node.js 24
- Java 17+
- Android SDK Platform Tools (`adb` must be on `PATH`)
- USB debugging or Wireless debugging enabled on the selected Android device
- The selected app installed from the Play Store, or an approved `.e2e` QA APK

## First-time setup

Run these commands from the repository root:

```powershell
npm ci
npm run appium:setup
```

Then create `.env`, select and connect exactly one device, and make sure the selected app is installed. Only after those steps run:

```powershell
npm run doctor
npm run check
npm run test:production-smoke # or the required test lane
```

The test command starts and stops the local Appium service automatically. A separate Appium terminal is not required. On the first run, allow extra time for UiAutomator2 to initialize on the phone.

The selected app installed from Google Play is the default; no local app build is required. Before a
production-regression run, the preflight opens that app's Google Play listing on the selected device.
It installs the app when missing, applies an available update, or continues when Google Play reports
Open. The selected Android image must include Google Play and already be signed in; otherwise the
preflight stops with an instruction to complete sign-in.

Resident live rollout is deliberately isolated:

```powershell
npm run resident:accounts:preflight
npm run resident:playstore:preflight
npm run resident:readiness
# Set exactly one RESIDENT_SOURCE_CASE and RESIDENT_ACCOUNT_COHORT in ignored .env
npm run resident:regression:case
```

`RESIDENT_SOURCE_CASE` accepts only `ISM_SK002`, `ISM_SK007`, `ISM_SK011`, or `ISM_SK012`;
`RESIDENT_ACCOUNT_COHORT` accepts `new` or `legacy`. The regression command refuses to start when
either is absent. Run one case for `new`, verify cleanup or restoration, then run the same case for
`legacy` before advancing. `ISM_SK002` and `ISM_SK007` additionally require the approved disposable
`RESIDENT_TEST_CONTACT_MOBILE` and `RESIDENT_TEST_CONTACT_EMAIL`; existing family-account
credentials remain read-only inventory.

Set `APP_EXPECTED_PLAYSTORE_VERSION_CODE` to the approved Resident release code before preflight.
Google Play showing **Open** proves only that no update is offered to the selected account/track; the
preflight also compares the installed version code and refuses readiness when it is below the
approved release.

## Create `.env`

Create the ignored local configuration from the committed template:

```powershell
Copy-Item .env.example .env
```

Edit `.env`; do not set these values as temporary PowerShell variables if you expect later commands to reuse them. Never commit `.env`, credentials, device identifiers, APKs, reports, or authentication state.

For the installed Technician production app on a physical device, use:

```dotenv
APP_TARGET=technician
APP_ENV=production
DEVICE_TARGET=physical
ANDROID_UDID=<exact-adb-device-id>
APP_SOURCE=installed
PLAYSTORE_BETA_CONFIRMED=false
PRODUCTION_SMOKE_CONFIRMED=true
PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED=true
PRODUCTION_TEST_ACCOUNT_CONFIRMED=false

TEST_API_BASE_URL=https://test.isocietymanager.com
RESET_MODE=retain
TEST_LANE=production-smoke
RUN_HARDWARE_TESTS=false
ALLOW_MUTATIONS=false
AVD_NAME=Pixel_9_Pro

TECHNICIAN_USERNAME=<approved-production-test-account>
TECHNICIAN_PASSWORD=<secret>
```

Replace `ANDROID_UDID` with the exact selected device shown by `adb devices -l`. Set `PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED=true` only when the account is explicitly approved for production login. Production smoke runs must remain installed-app, retained-session, and read-only.

### One-click Technician beta smoke

On Windows, the combined runner starts or reuses the Android emulator, checks the installed beta,
prepares Appium, applies the reversible `PPM_WOV.R` admin gate, and runs the Technician production
smoke suite. Configure the normal Technician account and the admin gate in the repository `.env`:

```dotenv
APP_EXPECTED_IN_APP_VERSION=2.2.57
APP_EXPECTED_PLAYSTORE_VERSION_NAME=6.0.7
TECHNICIAN_USERNAME=<approved-technician-account>
TECHNICIAN_PASSWORD=<secret>
TECHNICIAN_EXPECTED_GREETING=Hi Approved Technician! 👋
TECHNICIAN_WOV_EXPECTED_SEQUENCE=<controlled-work-order-sequence>
ISM_API_BASE_URL=<approved-ism-api-base-url>
ADMIN_USER=<approved-site-admin>
ADMIN_PASSWORD=<secret>
TECHNICIAN_ADMIN_PERMISSION_MUTATION_CONFIRMED=true
TECHNICIAN_ADMIN_PERMISSION_STATE_FILE=artifacts/admin-gates/technician-ppm-wov.json
```

Then run from the repository root:

```powershell
pwsh -File .\scripts\run-technician-beta-smoke.ps1
```

The admin step derives the Technician's exact site and role, preserves the complete permission map,
verifies `PPM_WOV.R` on and off, leaves it off while smoke verifies QR-scanner routing, and restores
the original map even when smoke fails. The mobile flow logs out any retained session after the
permission change and signs in with `TECHNICIAN_USERNAME`, ensuring both the account and cached
permissions are current. This is a role-level change, so use only an approved site and execution
window. See [Technician beta smoke PowerShell runner](docs/TECHNICIAN_BETA_SMOKE_POWERSHELL.md) for
the full workflow and recovery behavior.

For the approved Live test account regression lane, keep the same installed-app and retained-session settings, then change:

```dotenv
PRODUCTION_TEST_ACCOUNT_CONFIRMED=true
TEST_LANE=production-regression
ALLOW_MUTATIONS=true
```

The production-regression lane includes an offline-completion journey. It supports either an Android
Studio emulator or a physical device connected through USB ADB. Do not run it on a physical device
over Wireless debugging: the journey disables Wi-Fi and mobile data and would disconnect Appium. It
prepares standard PM Work Order, Housekeeping, and Logbook records, completes the cached records
offline, restores the original connectivity state, synchronizes, and verifies fresh server-backed
completed results. Offline record creation and Breakdown completion are excluded.

For an Android Studio emulator, install the approved Technician Play Store package, authenticate the
approved production test account, and use retained app data:

```dotenv
APP_TARGET=technician
APP_ENV=production
DEVICE_TARGET=emulator
ANDROID_UDID=emulator-5554
APP_SOURCE=installed
RESET_MODE=retain
TEST_LANE=production-regression
RUN_HARDWARE_TESTS=false
```

Keep the production confirmation and mutation values from the production-regression configuration
above. The test disables and restores the emulator's virtual Wi-Fi and mobile-data services; its local
ADB/Appium connection remains available.

These three values are a deliberate write opt-in. Never enable them for a normal production account or site.

For a Resident run, `APP_TARGET=resident` and the default `APP_SOURCE=installed` select the Google
Play package `com.sumasamu.iSocietyManager` ([store listing](https://play.google.com/store/apps/details?id=com.sumasamu.iSocietyManager&hl=en_IN)).
No `APP_PATH` is needed. To opt into a local test APK instead, set `APP_SOURCE=apk` and point
`APP_PATH` to an approved `.e2e` APK. APK selection is restricted to the test environment; production
lanes remain installed-app only.

For a test environment, start from `.env.example`. Select the application with
`APP_TARGET=resident` or `APP_TARGET=technician`, keep `APP_ENV=test`, and fill only that
application's username and password. An installed Play Store beta also requires
`PLAYSTORE_BETA_CONFIRMED=true`.

## Connect a physical device with Wireless debugging

The computer and phone must be on the same network. On the phone, open **Developer options → Wireless debugging**.

1. Select **Pair device with pairing code**. Use the displayed pairing address and enter the six-digit code when prompted:

   ```powershell
   adb pair <phone-ip>:<pairing-port>
   ```

2. Return to the main Wireless debugging screen. Connect with its **IP address & port** value:

   ```powershell
   adb connect <phone-ip>:<connection-port>
   ```

   The connection port is often different from the pairing port.

3. Verify the device and copy its exact serial into `ANDROID_UDID` in `.env`:

   ```powershell
   adb devices -l
   ```

The device must show `device`, not `offline` or `unauthorized`. Keep it unlocked and on the same network during the run. Android may change the connection port when Wireless debugging restarts; if that happens, run `adb connect` with the new value and update `.env`.

## Run tests

```powershell
npm run test:smoke
npm run test:regression
npm run test:production-smoke
npm run test:production-regression
npm run test:hardware
```

`test:hardware` additionally requires `DEVICE_TARGET=physical` and `RUN_HARDWARE_TESTS=true`. The framework never auto-selects a device. `ALLOW_MUTATIONS` must remain `false` except in the explicitly confirmed `production-regression` lane.

The selected lane determines which spec directory WebdriverIO loads:

| Command                              | Spec directory                                   |
| ------------------------------------ | ------------------------------------------------ |
| `npm run test:smoke`                 | `tests/<app>/smoke/**/*.spec.ts`                 |
| `npm run test:regression`            | `tests/<app>/regression/**/*.spec.ts`            |
| `npm run test:hardware`              | `tests/<app>/hardware/**/*.spec.ts`              |
| `npm run test:production-smoke`      | `tests/<app>/production-smoke/**/*.spec.ts`      |
| `npm run test:production-regression` | `tests/<app>/production-regression/**/*.spec.ts` |

## Troubleshooting

| Symptom                                          | Check or fix                                                                                                                                                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adb` is not recognized                          | Install Android SDK Platform Tools, add its `platform-tools` directory to `PATH`, reopen PowerShell, and run `adb version`.                                                                                            |
| Pairing succeeds but no device is listed         | Run `adb connect <phone-ip>:<connection-port>` using the main Wireless debugging screen. Do not reuse the pairing port. Then run `adb devices -l`.                                                                     |
| Device is `offline` or the wireless port changed | Turn Wireless debugging off and on, connect to the newly displayed connection port, and update `ANDROID_UDID` in `.env`. If needed, run `adb kill-server`, `adb start-server`, and reconnect.                          |
| Device is `unauthorized`                         | Unlock the phone and accept the debugging prompt. If no prompt appears, forget the paired workstation on the phone and pair again.                                                                                     |
| Doctor reports the wrong or missing device       | Copy the exact serial from `adb devices -l` into `ANDROID_UDID`. Do not use a model name, stale port, or implicit device selection.                                                                                    |
| App is not installed                             | Install the selected Play Store app or approved `.e2e` APK, then rerun `npm run doctor`. Confirm `APP_TARGET` and `APP_SOURCE` match the installed package.                                                            |
| UiAutomator2/Appium driver is missing            | Run `npm run appium:setup`, then `npm run doctor`.                                                                                                                                                                     |
| No specs run                                     | Check `APP_TARGET`, `TEST_LANE`, and that the file ends in `.spec.ts` under the matching lane directory. The npm lane commands override `TEST_LANE` for that run.                                                      |
| Production smoke is refused                      | Production smoke requires `APP_ENV=production`, `APP_SOURCE=installed`, `TEST_LANE=production-smoke`, `RESET_MODE=retain`, `PRODUCTION_SMOKE_CONFIRMED=true`, `RUN_HARDWARE_TESTS=false`, and `ALLOW_MUTATIONS=false`. |
| Production regression is refused                 | It additionally requires `TEST_LANE=production-regression`, `PRODUCTION_TEST_ACCOUNT_CONFIRMED=true`, `PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED=true`, and `ALLOW_MUTATIONS=true`.                                        |
| Port `4723` is already in use                    | Stop the other Appium process; this repository starts its own service.                                                                                                                                                 |
| A selector fails only on the Play Store build    | Confirm the installed app version and visible label. Production builds may not contain newer product `testID` values; use a stable human-readable accessibility fallback, never coordinates or tenant-specific text.   |

Do not paste credentials, full page-source dumps, tenant data, or device identifiers into tickets or commits. Production failure artifacts are deliberately suppressed.

## Add a test case, page object, or spec

1. Define deterministic test data and the expected observable result. Data-changing cases may run only in the explicitly confirmed `production-regression` lane and must use unique E2E markers plus cleanup or an auditable terminal state.
2. Resolve traceability before writing the test:
   - For an existing Confluence source case, preserve its `ISM_SK*` or `TEC_SK*` identifier and add or update its record in `src/traceability/catalog.ts`.
   - Do not invent Feature, Story, Acceptance Criteria, or `MTC-*` identifiers. Keep unverified mappings pending registry validation.
   - Use `sourceIt(sourceCase('...'), ...)` for a catalog-backed case. Use `internalIt(...)` only for a repository-owned technical observation that has no source case.
3. Put reusable UI behavior in `src/screens/<app>/<feature>.screen.ts`. A page object should expose actions and observable loaded/empty/error states; it should not contain Mocha tests.
4. Select elements through `byTestId('<stable-product-testID>', '<human-readable accessibility fallback>')`. Prefer a stable product `testID`; avoid XPath, screen coordinates, translated copy, counts, dates, and tenant-specific content.
5. Add the spec to the lane that matches its purpose:
   - `smoke`: small routine read-only journey.
   - `regression`: broader read-only coverage.
   - `hardware`: QR, camera, NFC, GPS, push, or other explicitly selected physical-device behavior.
   - `production-smoke`: minimal approved observation of the installed production app.
   - `production-regression`: approved Live test-account journeys, including controlled data changes.
6. Import local TypeScript modules with `.js` extensions, use page objects instead of duplicating selectors, and leave the app in a repeatable state by navigating back or logging out when appropriate.
7. Keep a new catalog case at `planned-read-only` until its automated test has passed. After evidence from a successful run, change it to `automated-observe` or `automated-hardware-observe` as applicable.
8. Validate before committing:

   ```powershell
   npm run check
   npm run test:smoke # replace with the lane containing the new spec
   ```

Minimal page-object pattern:

```typescript
import { expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';

export const technicianExampleScreen = {
  async waitForDisplayed(): Promise<void> {
    const screen = await byTestId('technician.example.screen', 'Example screen');
    await screen.waitForDisplayed({ timeout: 30_000 });
    await expect(screen).toBeDisplayed();
  },
};
```

Minimal catalog-backed spec pattern:

```typescript
import { sourceCase } from '../../../src/traceability/catalog.js';
import { sourceIt } from '../../../src/traceability/traceable-test.js';

describe('Technician read-only behavior', () => {
  sourceIt(sourceCase('TEC_SK007'), async () => {
    // Call page-object actions and assert an observable read-only result.
  });
});
```

Treat the identifier above as an example of referencing an existing catalog entry, not as a template for allocating a new identifier. The Technician complaint-addition test currently uses repository-internal `TEC-AUTO-003` with registry validation pending; no new `TEC_SK*` or `MTC-*` identifier was invented.

The complaint-addition spec generates a harmless image fixture, places it in the selected phone's Downloads folder, selects it through Android's gallery picker, creates a uniquely marked complaint, and verifies the resulting OPEN complaint card.

The Technician production-regression specs exercise complaint creation and closure plus template-based Work Order, Housekeeping, and Logbook creation, checklist completion, submission, and completed-state verification. Records are created only through configured templates; discovery rejects zero or multiple new candidate sequences instead of guessing which record was created. Completed verification reopens each exact server-refreshed sequence and confirms its saved checklist is finished. The suite does not use Manual Work Order creation or select Breakdown records.

Current Technician source-case coverage is intentionally strict:

- `TEC_SK003`, `TEC_SK004`, `TEC_SK005`, and `TEC_SK008` have complete automated paths. Offline fetch and sync support Android Studio emulators as well as USB-connected physical devices.
- `TEC_SK001` remains partial because password login does not cover the source OTP expectation.
- `TEC_SK002` remains partial and hardware-only; the controlled QR payload must identify an expected asset-associated sequence through `TECHNICIAN_QR_EXPECTED_SEQUENCE`.
- `TEC_SK006` is not automated because the source requires offline creation, which the live Technician app does not support. The repository-owned offline completion observation is not mapped to this case.
- `TEC_SK007` remains partial until an approved upcoming-work fixture can prove the complete expected schedule; visible cards are currently checked for due dates inside the selected range.
- `TEC_SK009` remains unautomated because it requires physical NFC hardware and a controlled NFC fixture.

The approved Technician registry currently has no canonical feature for these login, task-management, asset-scan, or offline-sync cases, so their canonical mappings remain pending rather than inventing Feature, Story, AC, or `MTC-*` identifiers.

Installed Play Store package IDs:

| App        | Package                             |
| ---------- | ----------------------------------- |
| Resident   | `com.sumasamu.iSocietyManager`      |
| Technician | `com.sumasamu.isocietyManagerAdmin` |

Automated tests remain `@observe`. Existing `ISM_SK*` and `TEC_SK*` values are source case IDs; do not invent Feature, Story, Acceptance Criteria, or `MTC-*` identifiers.
