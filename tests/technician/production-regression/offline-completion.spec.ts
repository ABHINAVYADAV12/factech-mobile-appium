import { browser } from '@wdio/globals';

import { AndroidConnectivityController } from '../../../src/config/android-connectivity.js';
import { isWirelessAdbUdid } from '../../../src/config/android-device.js';
import { loadRuntimeConfig } from '../../../src/config/runtime.js';
import { ensureTechnicianProductionHome } from '../../../src/flows/technician-production-authentication.js';
import { technicianOfflineSyncScreen } from '../../../src/screens/technician/offline-sync.screen.js';
import { technicianWorkOrderCreationScreen } from '../../../src/screens/technician/work-order-creation.screen.js';
import { technicianWorkOrderTemplateCreationScreen } from '../../../src/screens/technician/work-order-template-creation.screen.js';
import { sourceCase } from '../../../src/traceability/catalog.js';
import { internalIt, sourceIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();
const connectivity = new AndroidConnectivityController(runtime.androidUdid);
let preparedSequences: string[] = [];
let offlineDataReady = false;
let offlineCompletionsSynced = false;

function requirePreparedSequences(): string[] {
  if (preparedSequences.length !== 3) {
    throw new Error('Offline completion requires prepared PM, Housekeeping, and Logbook records');
  }
  return preparedSequences;
}

describe('Technician offline completion and synchronization', () => {
  before(async () => {
    if (runtime.deviceTarget === 'physical' && isWirelessAdbUdid(runtime.androidUdid)) {
      throw new Error(
        'Offline completion on a physical device requires USB ADB because disabling Wi-Fi would disconnect Appium',
      );
    }
    await ensureTechnicianProductionHome(runtime);
    await technicianWorkOrderCreationScreen.openFromHome();

    const workOrder =
      await technicianWorkOrderTemplateCreationScreen.createFirstConfiguredTemplate('PM');
    const housekeeping =
      await technicianWorkOrderTemplateCreationScreen.createFirstConfiguredTemplate('HK');
    const logbook =
      await technicianWorkOrderTemplateCreationScreen.createFirstConfiguredTemplate('LB');

    preparedSequences = [workOrder, housekeeping, logbook];
    if (preparedSequences.some((sequence) => /^BR[- ]?\d+$/i.test(sequence))) {
      throw new Error('Breakdown records are excluded from the offline-completion fixture set');
    }
  });

  after(async () => {
    connectivity.restore();
  });

  sourceIt(sourceCase('TEC_SK005'), async () => {
    const sequences = requirePreparedSequences();
    try {
      await ensureTechnicianProductionHome(runtime);
      await technicianOfflineSyncScreen.fetchOfflineData();
      await technicianOfflineSyncScreen.expectOfflineDataReady();
      await ensureTechnicianProductionHome(runtime);

      connectivity.disconnect();

      await technicianWorkOrderCreationScreen.openFromHome();
      await technicianWorkOrderCreationScreen.expectOfflineTemplateRecordsAccessible(sequences);
      offlineDataReady = true;
    } catch (error) {
      connectivity.restore();
      throw error;
    }
  });

  internalIt(
    'TEC-AUTO-012',
    'completes cached PM, Housekeeping, and Logbook records offline and synchronizes them online',
    'technician',
    async () => {
      if (!offlineDataReady || !connectivity.disconnected) {
        throw new Error('Offline completion requires a successful TEC_SK005 cache fetch');
      }

      try {
        for (const sequence of requirePreparedSequences()) {
          await ensureTechnicianProductionHome(runtime);
          await technicianWorkOrderCreationScreen.openFromHome();
          await technicianWorkOrderCreationScreen.completeOpenTemplateRecord(
            sequence,
            `Offline completion by E2E ${Date.now()}`,
          );
        }

        await ensureTechnicianProductionHome(runtime);
        await technicianOfflineSyncScreen.expectPendingWork();

        connectivity.restore();
        await technicianOfflineSyncScreen.synchronizePendingWork();
        await ensureTechnicianProductionHome(runtime);
        offlineCompletionsSynced = true;
      } catch (error) {
        connectivity.restore();
        throw error;
      }
    },
    { deviceRequirement: 'either', mutation: 'data-changing' },
  );

  sourceIt(sourceCase('TEC_SK008'), async () => {
    if (!offlineCompletionsSynced || connectivity.disconnected) {
      throw new Error('Sync verification requires three synchronized offline completions');
    }
    try {
      await technicianOfflineSyncScreen.expectQueueDrained();

      await browser.reloadSession();
      await ensureTechnicianProductionHome(runtime);
      await technicianWorkOrderCreationScreen.openFromHome();
      await technicianWorkOrderCreationScreen.expectCompletedTemplateRecords(
        requirePreparedSequences(),
      );
    } finally {
      connectivity.restore();
    }
  });
});
