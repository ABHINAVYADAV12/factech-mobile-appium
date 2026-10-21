import {
  loadRuntimeConfig,
  requireResidentFixture,
  RESIDENT_REGRESSION_COHORTS,
} from '../../../src/config/runtime.js';
import { createRunMarker } from '../../../src/fixtures/run-marker.js';
import { selectResidentProductionAccount } from '../../../src/flows/resident-production-authentication.js';
import { residentComplaintsScreen } from '../../../src/screens/resident/complaints.screen.js';
import { residentFamilyScreen } from '../../../src/screens/resident/family.screen.js';
import { residentPassesScreen } from '../../../src/screens/resident/passes.screen.js';
import { residentSettingsScreen } from '../../../src/screens/resident/settings.screen.js';
import { sourceCase } from '../../../src/traceability/catalog.js';
import { sourceIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();

for (const accountCohort of RESIDENT_REGRESSION_COHORTS) {
  describe(`Resident approved production test-account regression (${accountCohort})`, () => {
    beforeEach(async () => {
      await selectResidentProductionAccount(runtime, accountCohort);
    });

    sourceIt(
      sourceCase('ISM_SK002'),
      async () => {
        const guestMobile = requireResidentFixture(runtime, 'contactMobile');
        const createdMarkers: string[] = [];

        await residentPassesScreen.openFromHome();
        try {
          for (const type of ['delivery', 'guest'] as const) {
            const marker = `${createRunMarker('ISM_SK002')}-${accountCohort}-${type}`;
            await residentPassesScreen.createSinglePass(type, marker, guestMobile);
            createdMarkers.push(marker);
          }
        } finally {
          for (const marker of [...createdMarkers].reverse()) {
            await residentPassesScreen.cancel(marker);
          }
        }
      },
      { accountCohort },
    );

    sourceIt(
      sourceCase('ISM_SK007'),
      async () => {
        const marker = `${createRunMarker('ISM_SK007')}-${accountCohort}`;
        const mobile = requireResidentFixture(runtime, 'contactMobile');
        const email = requireResidentFixture(runtime, 'contactEmail');

        await residentFamilyScreen.openFromHome();
        try {
          await residentFamilyScreen.add(marker, mobile, email);
        } finally {
          await residentFamilyScreen.remove(marker);
        }
      },
      { accountCohort },
    );

    sourceIt(
      sourceCase('ISM_SK011'),
      async () => {
        await residentSettingsScreen.openFromHome();
        const original = await residentSettingsScreen.readState();
        const changed = {
          homeAway: !original.homeAway,
          ivr: !original.ivr,
          visitNotifications: !original.visitNotifications,
        };

        try {
          await residentSettingsScreen.setState(changed);
          await residentSettingsScreen.reopen();
          await residentSettingsScreen.expectState(changed);
        } finally {
          await residentSettingsScreen.setState(original);
          await residentSettingsScreen.reopen();
          await residentSettingsScreen.expectState(original);
        }
      },
      { accountCohort },
    );

    sourceIt(
      sourceCase('ISM_SK012'),
      async () => {
        const marker = `${createRunMarker('ISM_SK012')}-${accountCohort}`;
        const category = requireResidentFixture(runtime, 'complaintCategory');
        const subcategory = requireResidentFixture(runtime, 'complaintSubcategory');
        const siteId = requireResidentFixture(runtime, 'siteId');
        const areaType = requireResidentFixture(runtime, 'complaintAreaType') as 'unit' | 'common';
        const location =
          areaType === 'common' ? requireResidentFixture(runtime, 'complaintLocation') : undefined;

        if (siteId !== '670') {
          throw new Error(
            `ISM_SK012 fixtures are approved only for Resident site 670, got ${siteId}`,
          );
        }

        await residentComplaintsScreen.openFromHome();
        await residentComplaintsScreen.create(marker, category, subcategory, areaType, location);
      },
      { accountCohort },
    );
  });
}
