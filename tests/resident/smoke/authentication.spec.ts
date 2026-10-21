import { browser } from '@wdio/globals';

import { loadRuntimeConfig, requireCredentials } from '../../../src/config/runtime.js';
import { authenticateResident } from '../../../src/flows/authentication.js';
import { residentHomeScreen } from '../../../src/screens/resident/home.screen.js';
import { residentLoginScreen } from '../../../src/screens/resident/login.screen.js';
import { sourceCase } from '../../../src/traceability/catalog.js';
import { internalIt, sourceIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();

describe('Resident read-only smoke', () => {
  beforeEach(async () => {
    await browser.reloadSession();
  });

  internalIt(
    'RES-AUTO-001',
    'rejects invalid credentials without changing account state',
    'resident',
    async () => {
      await residentLoginScreen.waitForDisplayed();
      await residentLoginScreen.login(runtime.invalidLoginIdentity, 'DefinitelyNotAValidPassword!');
      await residentLoginScreen.expectRejected();
    },
  );

  sourceIt(sourceCase('ISM_SK001'), async () => {
    await authenticateResident(runtime);
  });

  internalIt(
    'RES-AUTO-002',
    'opens read-only navigation and clears the session on logout',
    'resident',
    async () => {
      requireCredentials(runtime);
      await authenticateResident(runtime);
      await residentHomeScreen.openMore();
      await residentHomeScreen.logout();
      await residentLoginScreen.waitForDisplayed();
    },
  );
});
