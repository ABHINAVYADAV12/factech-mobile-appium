import { $, $$, browser, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';

function textSelector(text: string) {
  return $(`android=new UiSelector().text("${text}")`);
}

function descriptionContains(text: string) {
  return $(`android=new UiSelector().descriptionContains("${text}")`);
}

async function openMoreTab(): Promise<void> {
  const heading = await textSelector('MORE');
  if (await heading.isDisplayed()) return;

  const offlineShortcut = await descriptionContains('Go Offline');
  if (await offlineShortcut.isDisplayed()) {
    await offlineShortcut.click();
  } else {
    // The live app's bottom tabs do not currently expose labels or testIDs. More is
    // the final clickable android.view.View in the bottom-navigation hierarchy.
    const unlabeledMoreTab = await $('(//android.view.View[@clickable="true"])[last()]');
    await unlabeledMoreTab.waitForDisplayed({
      timeout: 30_000,
      timeoutMsg: 'Technician bottom navigation was not displayed',
    });
    await unlabeledMoreTab.click();
  }

  await heading.waitForDisplayed({
    timeout: 30_000,
    timeoutMsg: 'Technician More page did not open',
  });
}

async function openHomeTab(): Promise<void> {
  const homeEvidence = await descriptionContains('Open Work Orders');
  if (await homeEvidence.isDisplayed()) return;

  const window = await browser.getWindowSize();
  const clickableViews = await $$('//android.view.View[@clickable="true"]');
  const bottomTabs: Array<{ element: WebdriverIO.Element; x: number }> = [];
  for (const element of clickableViews) {
    if (!(await element.isDisplayed())) continue;
    const location = await element.getLocation();
    if (location.y >= window.height * 0.82) bottomTabs.push({ element, x: location.x });
  }
  bottomTabs.sort((left, right) => left.x - right.x);
  const homeTab = bottomTabs[0]?.element;
  if (!homeTab) throw new Error('Technician Home tab was not displayed');
  await homeTab.click();
  await homeEvidence.waitForDisplayed({
    timeout: 30_000,
    timeoutMsg: 'Technician Home page did not open for sync evidence',
  });
}

async function syncAction() {
  const stableAction = await byTestId('technician.offline-sync.action', 'Sync Offline Data');
  if (await stableAction.isDisplayed()) return stableAction;

  const scrollAction = await $(
    'android=new UiScrollable(new UiSelector().scrollable(true)).scrollTextIntoView("Sync Offline Data")',
  );
  await scrollAction.waitForDisplayed({ timeout: 30_000 });
  return scrollAction;
}

async function runSyncCycle(timeoutMessage: string): Promise<void> {
  await (await syncAction()).click();
  const ready = await textSelector('Ready to Use');
  // A warm cache can finish before Appium observes the transient fetching label.
  // The exact cached-record assertions that follow prove the refresh took effect.
  await browser.pause(750);
  await ready.waitForDisplayed({ timeout: 180_000, timeoutMsg: timeoutMessage });
  await expect(ready).toBeDisplayed();
}

export const technicianOfflineSyncScreen = {
  async fetchOfflineData(): Promise<void> {
    await openMoreTab();
    await runSyncCycle('Offline data fetch did not reach Ready to Use');
  },

  async expectOfflineDataReady(): Promise<void> {
    const ready = await textSelector('Ready to Use');
    await ready.waitForDisplayed({
      timeout: 45_000,
      timeoutMsg: 'Offline data fetch did not remain ready for offline use',
    });
    await expect(ready).toBeDisplayed();
  },

  async expectPendingWork(): Promise<void> {
    const pendingCount = await $(
      'android=new UiSelector().textMatches("[1-9][0-9]* items remaining")',
    );
    const pending = await textSelector('Pending');
    await browser.waitUntil(
      async () => (await pendingCount.isDisplayed()) || (await pending.isDisplayed()),
      {
        timeout: 45_000,
        interval: 1_000,
        timeoutMsg: 'Offline completions did not appear in the pending synchronization queue',
      },
    );
  },

  async synchronizePendingWork(): Promise<void> {
    await openMoreTab();
    await runSyncCycle('Reconnected synchronization did not return to Ready to Use');
  },

  async expectQueueDrained(): Promise<void> {
    await openMoreTab();
    const ready = await textSelector('Ready to Use');
    await ready.waitForDisplayed({
      timeout: 45_000,
      timeoutMsg: 'Offline synchronization did not remain ready after upload',
    });

    await openHomeTab();
    const emptyQueue = await textSelector('0 items remaining');
    const lastSyncText = await $('android=new UiSelector().textStartsWith("Last:")');
    const lastSyncDescription = await descriptionContains('Last:');
    await browser.waitUntil(
      async () => {
        const lastSyncDisplayed =
          (await lastSyncText.isDisplayed()) || (await lastSyncDescription.isDisplayed());
        return (await emptyQueue.isDisplayed()) && lastSyncDisplayed;
      },
      {
        timeout: 120_000,
        interval: 1_000,
        timeoutMsg: 'Technician Home did not show zero queued items and last-sync evidence',
      },
    );
  },
};
