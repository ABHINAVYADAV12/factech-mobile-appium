import { browser, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';

export const technicianQrScreen = {
  async waitForReady(): Promise<void> {
    await expect(await byTestId('technician.qr.screen', 'Asset QR scanner')).toBeDisplayed();
    const denied = await byTestId('technician.qr.permission-denied', 'Camera permission required');
    if (await denied.isDisplayed()) {
      throw new Error('Camera permission is denied; grant it on the selected physical device');
    }
    await expect(
      await byTestId('technician.qr.camera-wrapper', 'QR camera preview'),
    ).toBeDisplayed();
  },

  async waitForScanResult(): Promise<void> {
    await browser.waitUntil(
      async () =>
        await (await byTestId('technician.workorders.screen', 'Work orders screen')).isDisplayed(),
      { timeout: 90_000, timeoutMsg: 'No work-order screen appeared after the QR scan' },
    );
  },
};
