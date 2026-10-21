import { browser } from '@wdio/globals';

import { loadRuntimeConfig } from '../../../src/config/runtime.js';
import { ensureTechnicianProductionHome } from '../../../src/flows/technician-production-authentication.js';
import { technicianWorkOrderCreationScreen } from '../../../src/screens/technician/work-order-creation.screen.js';
import { technicianWorkOrderTemplateCreationScreen } from '../../../src/screens/technician/work-order-template-creation.screen.js';
import { sourceCase } from '../../../src/traceability/catalog.js';
import { internalIt, sourceIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();
let createdWorkOrderSequence: string | undefined;
let createdHousekeepingSequence: string | undefined;
let createdLogbookSequence: string | undefined;
let workOrderCompleted = false;
let housekeepingCompleted = false;
let logbookCompleted = false;

describe('Technician production test-account regression', () => {
  beforeEach(async () => {
    await browser.activateApp(runtime.packageName);
    await ensureTechnicianProductionHome(runtime);
  });

  internalIt(
    'TEC-AUTO-004',
    'creates and verifies a standard Work Order from a configured template',
    'technician',
    async () => {
      await technicianWorkOrderCreationScreen.openFromHome();
      createdWorkOrderSequence =
        await technicianWorkOrderTemplateCreationScreen.createFirstConfiguredTemplate('PM');
    },
    { deviceRequirement: 'either', mutation: 'data-changing' },
  );

  internalIt(
    'TEC-AUTO-007',
    'creates and verifies a Housekeeping record from a configured template',
    'technician',
    async () => {
      await technicianWorkOrderCreationScreen.openFromHome();
      createdHousekeepingSequence =
        await technicianWorkOrderTemplateCreationScreen.createFirstConfiguredTemplate('HK');
    },
    { deviceRequirement: 'either', mutation: 'data-changing' },
  );

  internalIt(
    'TEC-AUTO-008',
    'creates and verifies a Logbook record from a configured template',
    'technician',
    async () => {
      await technicianWorkOrderCreationScreen.openFromHome();
      createdLogbookSequence =
        await technicianWorkOrderTemplateCreationScreen.createFirstConfiguredTemplate('LB');
    },
    { deviceRequirement: 'either', mutation: 'data-changing' },
  );

  sourceIt(sourceCase('TEC_SK003'), async () => {
    const sequences = [
      createdWorkOrderSequence,
      createdHousekeepingSequence,
      createdLogbookSequence,
    ];
    if (sequences.some((sequence) => !sequence)) {
      throw new Error('TEC_SK003 requires successful PM, Housekeeping, and Logbook creation');
    }

    await technicianWorkOrderCreationScreen.openFromHome();
    await technicianWorkOrderCreationScreen.expectOpenTemplateRecords(sequences as string[]);
  });

  internalIt(
    'TEC-AUTO-005',
    'completes and verifies the newly created Work Order in the approved production test account',
    'technician',
    async () => {
      if (!createdWorkOrderSequence) {
        throw new Error('Work Order completion requires the preceding creation test');
      }
      await technicianWorkOrderCreationScreen.openFromHome();
      await technicianWorkOrderCreationScreen.completeOpenTemplateRecord(
        createdWorkOrderSequence,
        `Completed by E2E ${Date.now()}`,
      );
      workOrderCompleted = true;
    },
    { deviceRequirement: 'either', mutation: 'data-changing' },
  );

  internalIt(
    'TEC-AUTO-010',
    'completes the checklist and submits the newly created Housekeeping record',
    'technician',
    async () => {
      if (!createdHousekeepingSequence) {
        throw new Error('Housekeeping completion requires the preceding template-creation test');
      }
      await technicianWorkOrderCreationScreen.openFromHome();
      await technicianWorkOrderCreationScreen.completeOpenTemplateRecord(
        createdHousekeepingSequence,
        `Housekeeping completed by E2E ${Date.now()}`,
      );
      housekeepingCompleted = true;
    },
    { deviceRequirement: 'either', mutation: 'data-changing' },
  );

  internalIt(
    'TEC-AUTO-011',
    'completes the checklist and submits the newly created Logbook record',
    'technician',
    async () => {
      if (!createdLogbookSequence) {
        throw new Error('Logbook completion requires the preceding template-creation test');
      }
      await technicianWorkOrderCreationScreen.openFromHome();
      await technicianWorkOrderCreationScreen.completeOpenTemplateRecord(
        createdLogbookSequence,
        `Logbook completed by E2E ${Date.now()}`,
      );
      logbookCompleted = true;
    },
    { deviceRequirement: 'either', mutation: 'data-changing' },
  );

  sourceIt(sourceCase('TEC_SK004'), async () => {
    if (!workOrderCompleted || !housekeepingCompleted || !logbookCompleted) {
      throw new Error('TEC_SK004 requires successful PM, Housekeeping, and Logbook completion');
    }

    const sequences = [
      createdWorkOrderSequence,
      createdHousekeepingSequence,
      createdLogbookSequence,
    ];
    if (sequences.some((sequence) => !sequence)) {
      throw new Error('TEC_SK004 requires created PM, Housekeeping, and Logbook records');
    }

    await technicianWorkOrderCreationScreen.openFromHome();
    await technicianWorkOrderCreationScreen.expectCompletedTemplateRecords(sequences as string[]);
  });
});
