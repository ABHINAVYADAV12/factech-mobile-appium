import { browser } from '@wdio/globals';
import QRCode from 'qrcode';

import { loadRuntimeConfig } from '../../../src/config/runtime.js';
import { ensureTechnicianProductionHome } from '../../../src/flows/technician-production-authentication.js';
import { technicianComplaintsScreen } from '../../../src/screens/technician/complaints.screen.js';
import { internalIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();
const fixtureFileName = 'factech-e2e-complaint.png';
const fixtureDevicePath = `/sdcard/Download/${fixtureFileName}`;
let createdComplaintMarker: string | undefined;

describe('Technician production test-account regression', () => {
  before(async () => {
    await browser.activateApp(runtime.packageName);
    const fixtureDataUrl = await QRCode.toDataURL('FACTECH E2E COMPLAINT ATTACHMENT', {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
    });
    const fixtureBase64 = fixtureDataUrl.split(',', 2)[1];
    if (!fixtureBase64) throw new Error('Complaint image fixture generation failed');
    await browser.pushFile(fixtureDevicePath, fixtureBase64);
  });

  beforeEach(async () => {
    await ensureTechnicianProductionHome(runtime);
  });

  internalIt(
    'TEC-AUTO-003',
    'creates and verifies a complaint in the approved production test account',
    'technician',
    async () => {
      const marker = `E2E-COMPLAINT-${Date.now()}`;
      await technicianComplaintsScreen.openFromHome();
      await technicianComplaintsScreen.openRaiseComplaint();
      await technicianComplaintsScreen.selectFirstCategoryAndSubcategory();
      await technicianComplaintsScreen.selectFirstLocation();
      await technicianComplaintsScreen.attachFixtureFromGallery(fixtureFileName);
      await technicianComplaintsScreen.createComplaint(marker);
      createdComplaintMarker = marker;
    },
    { deviceRequirement: 'physical', mutation: 'data-changing' },
  );

  internalIt(
    'TEC-AUTO-009',
    'self-assigns and closes the newly created complaint in the approved production test account',
    'technician',
    async () => {
      if (!createdComplaintMarker) {
        throw new Error('Complaint lifecycle requires the preceding complaint-creation test');
      }
      await technicianComplaintsScreen.openFromHome();
      await technicianComplaintsScreen.closeCreatedComplaint(createdComplaintMarker);
    },
    { deviceRequirement: 'physical', mutation: 'data-changing' },
  );
});
