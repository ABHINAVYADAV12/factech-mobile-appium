import { loadRuntimeConfig } from '../../../src/config/runtime.js';
import { authenticateTechnician } from '../../../src/flows/authentication.js';
import { technicianHomeScreen } from '../../../src/screens/technician/home.screen.js';
import { technicianQrScreen } from '../../../src/screens/technician/qr.screen.js';
import { technicianWorkOrdersScreen } from '../../../src/screens/technician/work-orders.screen.js';
import { sourceCase } from '../../../src/traceability/catalog.js';
import { sourceIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();

describe('Technician physical-device hardware', () => {
  sourceIt(sourceCase('TEC_SK002'), async () => {
    if (!runtime.technicianQrPayload) {
      throw new Error('TECHNICIAN_QR_PAYLOAD is required to identify the controlled test QR');
    }
    if (!runtime.technicianQrExpectedSequence) {
      throw new Error(
        'TECHNICIAN_QR_EXPECTED_SEQUENCE is required to verify the asset-associated work order',
      );
    }
    await authenticateTechnician(runtime);
    await technicianHomeScreen.openQrScanner();
    await technicianQrScreen.waitForReady();
    await technicianQrScreen.waitForScanResult();
    await technicianWorkOrdersScreen.expectLoadedState();
    await technicianWorkOrdersScreen.expectSequenceDisplayed(runtime.technicianQrExpectedSequence);
  });
});
