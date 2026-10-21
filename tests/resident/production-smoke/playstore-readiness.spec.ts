import allureReporter from '@wdio/allure-reporter';
import { browser, expect } from '@wdio/globals';

import { readInstalledAppVersion } from '../../../src/config/android-tools.js';
import { loadRuntimeConfig, requireResidentFixture } from '../../../src/config/runtime.js';
import { ensureResidentProductionHome } from '../../../src/flows/resident-production-authentication.js';
import { byExactTestId } from '../../../src/selectors/test-id.js';
import { residentComplaintsScreen } from '../../../src/screens/resident/complaints.screen.js';
import { residentFamilyScreen } from '../../../src/screens/resident/family.screen.js';
import { residentPassesScreen } from '../../../src/screens/resident/passes.screen.js';
import { residentSettingsScreen } from '../../../src/screens/resident/settings.screen.js';
import { residentTestIds } from '../../../src/screens/resident/test-ids.js';
import { internalIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();

async function expectStable(testIds: string[]): Promise<void> {
  for (const testId of testIds) {
    await expect(await byExactTestId(testId)).toBeDisplayed();
  }
}

internalIt(
  'RES-AUTO-PLAYSTORE-READINESS',
  'qualifies stable Resident selectors without changing data',
  'resident',
  async () => {
    const version = readInstalledAppVersion(runtime);
    allureReporter.addLabel('appVersionName', version.versionName);
    allureReporter.addLabel('appVersionCode', version.versionCode);

    await ensureResidentProductionHome(runtime);

    await residentFamilyScreen.openFromHome();
    await expectStable([residentTestIds.family.screen, residentTestIds.family.add]);
    await (await byExactTestId(residentTestIds.family.add)).click();
    await expectStable([
      residentTestIds.family.name,
      residentTestIds.family.mobile,
      residentTestIds.family.email,
      residentTestIds.family.relation,
      residentTestIds.family.submit,
    ]);
    await browser.back();
    await browser.back();

    await residentPassesScreen.openFromHome();
    await expectStable([residentTestIds.passes.screen, residentTestIds.passes.create]);
    await (await byExactTestId(residentTestIds.passes.create)).click();
    await expectStable([
      residentTestIds.passes.type('delivery'),
      residentTestIds.passes.type('guest'),
      residentTestIds.passes.type('cab'),
    ]);
    await browser.back();

    await residentSettingsScreen.openFromHome();
    await expectStable([
      residentTestIds.settings.screen,
      residentTestIds.settings.homeAway,
      residentTestIds.settings.ivr,
      residentTestIds.settings.visitNotifications,
    ]);
    await browser.back();

    await residentComplaintsScreen.openFromHome();
    await expectStable([residentTestIds.complaints.screen, residentTestIds.complaints.add]);
    await (await byExactTestId(residentTestIds.complaints.add)).click();
    await expectStable([residentTestIds.complaints.categorySearch]);

    const category = requireResidentFixture(runtime, 'complaintCategory');
    const subcategory = requireResidentFixture(runtime, 'complaintSubcategory');
    const search = await byExactTestId(residentTestIds.complaints.categorySearch);
    await search.setValue(category);
    await expectStable([residentTestIds.complaints.category(category)]);
    await (await byExactTestId(residentTestIds.complaints.category(category))).click();
    await expectStable([residentTestIds.complaints.subcategory(subcategory)]);
    await (await byExactTestId(residentTestIds.complaints.subcategory(subcategory))).click();
    await expectStable([
      residentTestIds.complaints.areaCommon,
      residentTestIds.complaints.areaUnit,
      residentTestIds.complaints.description,
      residentTestIds.complaints.submit,
    ]);
  },
  { mutation: 'read-only', deviceRequirement: 'either' },
);
