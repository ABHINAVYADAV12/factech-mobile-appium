
import { $, expect } from '@wdio/globals';

import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosUpcomingWorkOrderScreen } from '../../../../src/screens/ios/technician/upcoming-work-order.screen.js';

describe('Technician iOS Upcoming Work Orders - Regression', () => {
  beforeEach(async () => {
    await browser.reloadSession();

    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    if (!username || !password) {
      throw new Error(
        'Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD',
      );
    }

    await technicianIosLoginScreen.waitForDisplayed();
    await technicianIosLoginScreen.login(username, password);
    await technicianIosHomeScreen.waitForDisplayed();
    await technicianIosHomeScreen.openUpcomingWork();
  });

  // TC-06: Verify date-range filtering.
  

it('TC-06 - filters work orders by selected date range', async () => {
  // Define the selected date range: today through tomorrow.
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(fromDate);
  toDate.setDate(toDate.getDate() + 1);
  toDate.setHours(23, 59, 59, 999);

  await technicianIosUpcomingWorkOrderScreen.selectDateRange(0, 1);

  // Wait for filtered results to load.
  await browser.pause(5000);

  const total =
    await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount();

  console.log('App-reported total:', total);

  // Verify the empty state if no work orders match.
  if (total === 0) {
    await technicianIosUpcomingWorkOrderScreen.verifyNoWorkOrdersEmptyState();
    return;
  }

  // Collect cards using the existing page-object method.
  const cardNames =
    await technicianIosUpcomingWorkOrderScreen.getAllSearchResults();

  expect(cardNames.length).toBeGreaterThan(0);

  // Validate every collected card.
  for (const cardName of cardNames) {
    expect(cardName).toContain('UPCOMING');

    const scheduledDate =
      technicianIosUpcomingWorkOrderScreen.getScheduledDateFromCard(cardName);

   const isWithinRange =
  technicianIosUpcomingWorkOrderScreen.isDateWithinRange(
    scheduledDate,
    fromDate,
    toDate,
  );

if (!isWithinRange) {
  throw new Error(
    `Work order is outside the selected date range: ${cardName}`,
  );
}
  }
});


it('TC-07 - verifies multiple upcoming work orders and empty state', async () => {
  // Select today as the From date.
 await technicianIosUpcomingWorkOrderScreen.selectDateRange(0, 1);

  // Wait for the list to refresh.
  await browser.pause(5000);

  const totalCount =
    await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount();

  // Verify the empty state when no work orders are available.
  if (totalCount === 0) {
    await technicianIosUpcomingWorkOrderScreen.verifyNoWorkOrdersEmptyState();
    return;
  }

  // Use the existing page-object scrolling functionality.
  const cardNames =
    await technicianIosUpcomingWorkOrderScreen.getAllSearchResults();

  // Verify that multiple upcoming work orders are available.
  expect(cardNames.length).toBeGreaterThan(0);

  // Verify the status of each collected card.
  for (const cardName of cardNames) {
    expect(cardName).toContain('UPCOMING');
  }
});






it('TC-08 - verifies search by title, asset, and location', async () => {
  // Set date range: today to tomorrow.
  await technicianIosUpcomingWorkOrderScreen.selectDateRange(0, 1);
  // Wait for work orders to load.
  await browser.waitUntil(
    async () =>
      (await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount()) > 0,
    {
      timeout: 15000,
      timeoutMsg: 'Upcoming work orders did not load',
    }
  );
   await browser.pause(5000);
  // Reusable search verification.
  const verifySearch = async (
    searchText: string,
    searchType: string
  ): Promise<void> => {
    await technicianIosUpcomingWorkOrderScreen.searchWorkOrders(searchText);
    await browser.keys('Enter');

    // Wait for filtered results.
    await browser.pause(5000);

    // Reuse the existing scrolling functionality.
    const results =
      await technicianIosUpcomingWorkOrderScreen.getAllSearchResults();


    // Ensure at least one result exists.
    expect(results.length).toBeGreaterThan(0);

    // Every collected card must contain the search word.
    for (const cardName of results) {   
expect(
  cardName.toLowerCase(),
).toContain(searchText.toLowerCase());
    }
    // Clear search before the next check.
    await technicianIosUpcomingWorkOrderScreen.clearSearch();
    await browser.pause(5000);
  };

  // Search by title.
  await verifySearch(
    process.env.TECHNICIAN_TEST_WO_TITLE || 'Smoke Test - HK PM',
    'Title',
  );

  // Search by asset.
  await verifySearch(
    process.env.TECHNICIAN_TEST_ASSET || 'Formula Asset with nfc',
    'Asset',
  );

  // Search by location.
  await verifySearch(
    process.env.TECHNICIAN_TEST_LOCATION || 'GF',
    'Location',
  );
});

it('TC-09 - verifies total work-order count against filtered records', async () => {
  // Set date range: today to tomorrow.
  await technicianIosUpcomingWorkOrderScreen.selectDateRange(0, 1);

  // Wait for the initial count.
  await browser.waitUntil(
    async () =>
      (await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount()) > 0,
    {
      timeout: 15000,
      timeoutMsg: 'Work orders did not load',
    }
  );

  const totalBeforeSearch =
    await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount();

  expect(totalBeforeSearch).toBeGreaterThan(0);
  await browser.pause(5000);
  // Search by a known title.
  const searchText = 'Smoke Test - HK PM';

  await technicianIosUpcomingWorkOrderScreen.searchWorkOrders(searchText);
  await browser.keys('Enter');
  await browser.pause(5000);

  // Collect filtered records using the existing scrolling function.
  const filteredRecords =
    await technicianIosUpcomingWorkOrderScreen.getAllSearchResults();

  const matchingRecords = filteredRecords.filter((name) =>
    name.includes(searchText)
  );

  expect(matchingRecords.length).toBeGreaterThan(0);

  // Clear search and verify the original total returns.
  await technicianIosUpcomingWorkOrderScreen.clearSearch();
  await browser.waitUntil(
    async () =>
      (await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount()) ===
      totalBeforeSearch,
    {
      timeout: 15000,
      timeoutMsg: 'Original work-order total did not return after clearing search',
    }
  );
    await browser.pause(5000);

  const totalAfterClear =
    await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount();

  expect(totalAfterClear).toBe(totalBeforeSearch);
});



it('TC-10 - verifies empty work-order state and reload button', async () => {
  await technicianIosUpcomingWorkOrderScreen.selectDateRange(0, 1);

  await browser.waitUntil(
    async () =>
      (await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount()) >= 0,
    {
      timeout: 15000,
      timeoutMsg: 'Work-order count did not load',
    }
  );

  const totalCount =
    await technicianIosUpcomingWorkOrderScreen.getTotalWorkOrderCount();

  if (totalCount === 0) {
    await technicianIosUpcomingWorkOrderScreen.verifyNoWorkOrdersEmptyState();

    // Verify the reload button is visible.
    await expect(
      technicianIosUpcomingWorkOrderScreen.reloadButton
    ).toBeDisplayed();

    // Click Reload once.
    await technicianIosUpcomingWorkOrderScreen.reloadButton.click();

    // Wait for the reload operation to complete.
    await browser.pause(3000);

    // Verify the empty state remains visible after reloading.
    await technicianIosUpcomingWorkOrderScreen.verifyNoWorkOrdersEmptyState();

  } else {
    console.log(
      'Work orders exist for this date range; empty-state and reload verification skipped.'
    );
  }
});

});
