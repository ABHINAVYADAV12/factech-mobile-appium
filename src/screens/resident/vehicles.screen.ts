import { expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';
import { residentHomeScreen } from './home.screen.js';
import { residentTestIds } from './test-ids.js';

export const residentVehiclesScreen = {
  async openFromHome(): Promise<void> {
    await residentHomeScreen.openMore();
    await (await byTestId(residentTestIds.vehicles.open, 'Vehicles')).click();
    await expect(await byTestId(residentTestIds.vehicles.screen, 'My vehicles')).toBeDisplayed();
  },

  async add(registration: string, marker: string): Promise<void> {
    await (await byTestId(residentTestIds.vehicles.add, 'Add Vehicle')).click();
    await (
      await byTestId(residentTestIds.vehicles.registration, 'e.g. MH12AB1234')
    ).setValue(registration);
    await (await byTestId(residentTestIds.vehicles.owner, 'Enter owner name')).setValue(marker);
    await (await byTestId(residentTestIds.vehicles.type, 'Select Vehicle Type')).click();
    await (await byTestId(residentTestIds.vehicles.typeCar, 'Car')).click();
    await (await byTestId(residentTestIds.vehicles.model, 'Enter vehicle model')).setValue(marker);
    await (
      await byTestId(residentTestIds.vehicles.sticker, 'Enter sticker number')
    ).setValue(marker);
    await (await byTestId(residentTestIds.vehicles.submit, 'Add Vehicle')).click();
    await expect(await byTestId(residentTestIds.vehicles.success, 'Vehicle added')).toBeDisplayed();
    await expect(await byTestId(residentTestIds.vehicles.screen, 'My vehicles')).toBeDisplayed();
    await expect(
      await byTestId(residentTestIds.vehicles.result(registration), registration),
    ).toBeDisplayed();
  },
};
