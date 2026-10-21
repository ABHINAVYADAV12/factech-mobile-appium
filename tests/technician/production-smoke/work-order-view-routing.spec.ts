import { loadRuntimeConfig } from '../../../src/config/runtime.js';
import { ensureTechnicianProductionHome } from '../../../src/flows/technician-production-authentication.js';
import { technicianHomeScreen } from '../../../src/screens/technician/home.screen.js';
import { technicianQrScreen } from '../../../src/screens/technician/qr.screen.js';
import { technicianWorkOrdersScreen } from '../../../src/screens/technician/work-orders.screen.js';
import { internalIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();
const sequence = process.env.TECHNICIAN_WOV_EXPECTED_SEQUENCE?.trim();
if (!sequence || !/^(WO|HK|HW|LB|LG|BR)[- ]?\d+$/i.test(sequence)) {
  throw new Error('TECHNICIAN_WOV_EXPECTED_SEQUENCE must be an exact work-order sequence');
}

describe('Technician production smoke PPM_WOV routing', () => {
  internalIt(
    'TEC-AUTO-017',
    'routes direct checklist access through the QR scanner when PPM_WOV read is off',
    'technician',
    async () => {
      await ensureTechnicianProductionHome(runtime);
      await technicianHomeScreen.openWorkOrders();
      await technicianWorkOrdersScreen.waitForDisplayed();
      await technicianWorkOrdersScreen.expectLoadedState();
      await technicianWorkOrdersScreen.openSequence(sequence);
      await technicianQrScreen.waitForReady();
    },
    { deviceRequirement: 'either', mutation: 'read-only' },
  );
});
