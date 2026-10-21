import { browser } from '@wdio/globals';

import { loadRuntimeConfig } from '../../../src/config/runtime.js';
import { authenticateTechnician } from '../../../src/flows/authentication.js';
import { technicianHomeScreen } from '../../../src/screens/technician/home.screen.js';
import { technicianLoginScreen } from '../../../src/screens/technician/login.screen.js';
import { technicianWorkOrdersScreen } from '../../../src/screens/technician/work-orders.screen.js';
import { sourceCase } from '../../../src/traceability/catalog.js';
import { internalIt, sourceIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();

describe('Technician read-only smoke', () => {
  beforeEach(async () => {
    await browser.reloadSession();
  });

  internalIt(
    'TEC-AUTO-001',
    'rejects invalid credentials without changing account state',
    'technician',
    async () => {
      await technicianLoginScreen.waitForDisplayed();
      await technicianLoginScreen.login(
        runtime.invalidLoginIdentity,
        'DefinitelyNotAValidPassword!',
      );
      await technicianLoginScreen.expectRejected();
    },
  );

  sourceIt(sourceCase('TEC_SK001'), async () => {
    await authenticateTechnician(runtime);
  });

  internalIt(
    'TEC-AUTO-002',
    'loads the work-order list without changing tenant data',
    'technician',
    async () => {
      await authenticateTechnician(runtime);
      await technicianHomeScreen.openWorkOrders();
      await technicianWorkOrdersScreen.waitForDisplayed();
      await technicianWorkOrdersScreen.expectLoadedState();
      await technicianHomeScreen.logout();
      await technicianLoginScreen.waitForDisplayed();
    },
  );
});
