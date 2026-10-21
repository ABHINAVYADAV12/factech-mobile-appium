# Resident Appium testability contract

Status: **upstream dependency** for the isolated Resident `.e2e` build. This repository does not
own or change Resident product behaviour.

The test suite resolves `testID` first and uses the listed accessibility wording only as a readable
fallback. Product controls must keep their visible accessibility labels meaningful. Result rows use
the exact generated marker so a run cannot accidentally verify another user's record.

## Required selector groups

The canonical selector constants live in `src/screens/resident/test-ids.ts`:

- navigation: Visitors, Service Requests, and More tabs;
- single passes: screen/create/type/single-tab when present, inputs, visit-date/tomorrow, submit,
  success, exact-marker result, and cancellation controls;
- family members: Home Services entry, screen/add/inputs/relation/submit/success, exact-marker result,
  and removal;
- vehicles: More entry, screen/add/registration/owner/type/model/sticker/submit/success, and an
  exact-registration result;
- settings: More entry, screen, and Home Away/IVR/visit-notification toggles;
- complaints: screen/add/category search/category/subcategory, unit/common-area choice, hierarchical
  location picker/search/result, description/submit/success, and exact-marker result;
- multi-account login: account-selector root and a stable account row keyed by the configured unit.

Every switch must expose its state through Android `checked` or `selected`. Success evidence must
remain visible until Appium can observe it. Dynamic result `testID` values must append the exact
marker or registration supplied by the test.

## Safety and fixtures

These selectors do not authorize a mutation. The corresponding tests run only in the guarded
`production-regression` lane with an approved production test account and explicit mutation opt-in.
Normal Resident smoke uses `RESIDENT_USERNAME` and `RESIDENT_PASSWORD`, which represent the new
user/unit model. Production regression runs every implemented Resident source case once with the
`new` cohort and once with the `legacy` cohort configured by `RESIDENT_LEGACY_USERNAME` and
`RESIDENT_LEGACY_PASSWORD`. Reports contain only the cohort label; account identifiers and secrets
must never be attached.

Verified legacy family-member login inventory may be supplied through the ignored
`RESIDENT_LEGACY_FAMILY_ACCOUNTS_JSON` value. Each entry carries a non-secret label, username,
password, and explicit legacy unit. This inventory is configuration only until a Confluence source
scenario explicitly requires family-member authentication. Tenant credentials are excluded until
their production login path is deterministic and verified.

Run `npm run resident:accounts:preflight` before Resident production regression. The preflight uses
the production login API only, verifies the new resident, legacy resident, and every configured
legacy family account against the approved site and explicit unit, and emits labels without account
identifiers. It performs no application or database mutation.

Then run `npm run resident:playstore:preflight` and `npm run resident:readiness`. Readiness records
the installed version and requires the stable selector contract without changing data. A live
mutation command requires exactly one `RESIDENT_SOURCE_CASE` and one `RESIDENT_ACCOUNT_COHORT`, so
the new and legacy executions cannot be started as an accidental batch. Production failures capture
only a screenshot; page source and logcat remain disabled in production.

Approved contact values and complaint classification are read from ignored environment variables.
One disposable `RESIDENT_TEST_CONTACT_MOBILE`/`RESIDENT_TEST_CONTACT_EMAIL` pair is shared by the
pass and family-member cases. Verified sibling/father accounts are authentication inventory only and
must not be added, removed, reassigned, or reset by mutation tests.
The complaint fixture also pins the approved site, area type, and exact location. The current local
site-670 fixture is read from the live authenticated Resident APIs; values are not copied into the
committed example environment file. Multi-account cohorts select an explicit unit so both A/B runs
land on the approved site instead of relying on account-list order.
Pass and family-member tests clean up their generated records; their native Android confirmation
buttons use the documented `Delete` accessibility-text fallback. Settings are restored in a
`finally` block. Complaint creation is retained with its unique `ISM_SK012-<timestamp>` marker when
the Resident app offers no safe delete operation.

Current product constraints keep two source cases below complete automation: the Cab pass form has
no marker-capable persisted field, so `ISM_SK002` executes only Delivery and Guest; the vehicle API
and UI expose no delete/remove route, so `ISM_SK009` is not executed in production regression until
approved cleanup exists. These constraints must not be bypassed by matching the newest unmarked
record or by leaving test vehicles behind.

OTP, VMS verification, push notifications, IVR, domestic-staff events, panic alerts, and payments
remain outside this contract until deterministic external fixtures are approved.
