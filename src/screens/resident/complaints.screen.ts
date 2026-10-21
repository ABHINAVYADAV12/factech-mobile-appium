import { expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';
import { residentHomeScreen } from './home.screen.js';
import { residentTestIds } from './test-ids.js';

export const residentComplaintsScreen = {
  async openFromHome(): Promise<void> {
    await residentHomeScreen.openServiceRequests();
    await expect(
      await byTestId(residentTestIds.complaints.screen, 'Service Request'),
    ).toBeDisplayed();
  },

  async create(
    marker: string,
    category: string,
    subcategory: string,
    areaType: 'unit' | 'common',
    location?: string,
  ): Promise<void> {
    await (await byTestId(residentTestIds.complaints.add, 'Add complaint')).click();
    const search = await byTestId(residentTestIds.complaints.categorySearch, 'Search category...');
    await search.setValue(category);
    await (await byTestId(residentTestIds.complaints.category(category), category)).click();
    await (
      await byTestId(residentTestIds.complaints.subcategory(subcategory), subcategory)
    ).click();
    if (areaType === 'common') {
      if (!location) throw new Error('A complaint location is required for common-area cases');
      await (await byTestId(residentTestIds.complaints.areaCommon, 'Common Area')).click();
      await (
        await byTestId(residentTestIds.complaints.locationPicker, 'Select specific location')
      ).click();
      const locationSearch = await byTestId(
        residentTestIds.complaints.locationSearch,
        'Search locations...',
      );
      await locationSearch.setValue(location);
      await (await byTestId(residentTestIds.complaints.location(location), location)).click();
    } else {
      await (await byTestId(residentTestIds.complaints.areaUnit, 'My Unit')).click();
    }
    await (
      await byTestId(residentTestIds.complaints.description, 'Describe the issue in detail…')
    ).setValue(marker);
    await (await byTestId(residentTestIds.complaints.submit, 'Submit Complaint')).click();
    await expect(
      await byTestId(residentTestIds.complaints.success, 'Complaint submitted'),
    ).toBeDisplayed();
    await expect(
      await byTestId(residentTestIds.complaints.screen, 'Service Request'),
    ).toBeDisplayed();
    await expect(await byTestId(residentTestIds.complaints.result(marker), marker)).toBeDisplayed();
  },
};
