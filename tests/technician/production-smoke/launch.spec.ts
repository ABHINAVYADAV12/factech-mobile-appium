import assert from 'node:assert/strict';

import { $, $$, browser, expect } from '@wdio/globals';

import { loadRuntimeConfig, requireCredentials } from '../../../src/config/runtime.js';
import { dueDateIsWithinRange } from '../../../src/screens/technician/upcoming-work.js';
import { technicianHomeScreen } from '../../../src/screens/technician/home.screen.js';
import { sourceCase } from '../../../src/traceability/catalog.js';
import { internalIt, sourceIt } from '../../../src/traceability/traceable-test.js';

const runtime = loadRuntimeConfig();

describe('Technician production launch smoke', () => {
  before(async () => {
    await browser.activateApp(runtime.packageName);
  });

  internalIt(
    'TEC-PROD-OBS-001',
    'launches the installed Play Store app in a known authentication state',
    'technician',
    async () => {
      assert.equal(await browser.getCurrentPackage(), runtime.packageName);
      const login = await $('~Login');
      const workOrders = await $(
        'android=new UiSelector().descriptionContains("Open Work Orders")',
      );
      await browser.waitUntil(
        async () => (await login.isDisplayed()) || (await workOrders.isDisplayed()),
        { timeout: 45_000, timeoutMsg: 'Login or authenticated home did not become visible' },
      );
      if (
        (await workOrders.isDisplayed()) &&
        process.env.TECHNICIAN_FORCE_RELOGIN_AFTER_PERMISSION_CHANGE === 'true'
      ) {
        await technicianHomeScreen.logout();
        await login.waitForDisplayed({ timeout: 30_000 });
      }
    },
  );

  if (runtime.productionCredentialLoginConfirmed) {
    sourceIt(sourceCase('TEC_SK001'), async () => {
      const workOrders = await $(
        'android=new UiSelector().descriptionContains("Open Work Orders")',
      );
      if (await workOrders.isDisplayed()) {
        await expect(workOrders).toBeDisplayed();
        return;
      }

      const credentials = requireCredentials(runtime);
      const identity = await $(
        'android=new UiSelector().className("android.widget.EditText").text("Email Or Phone Number")',
      );
      const password = await $(
        'android=new UiSelector().className("android.widget.EditText").text("Password")',
      );

      await identity.setValue(credentials.username);
      await password.setValue(credentials.password);
      await (await $('~Login')).click();

      await workOrders.waitForDisplayed({ timeout: 45_000 });
    });

    sourceIt(sourceCase('TEC_SK007'), async () => {
      const upcomingWork = await $('android=new UiSelector().descriptionContains("Upcoming Work")');
      await upcomingWork.waitForDisplayed({ timeout: 45_000 });
      await upcomingWork.click();

      const screenTitle = await $('android=new UiSelector().text("Upcoming WO")');
      const upcomingItem = await $('android=new UiSelector().text("UPCOMING")');
      const emptyState = await $(
        'android=new UiSelector().text("No work orders found for the selected dates")',
      );

      try {
        await screenTitle.waitForDisplayed({ timeout: 30_000 });
        await browser.waitUntil(
          async () => (await upcomingItem.isDisplayed()) || (await emptyState.isDisplayed()),
          {
            timeout: 45_000,
            timeoutMsg: 'Upcoming work orders did not finish loading',
          },
        );

        if (await upcomingItem.isDisplayed()) {
          const dueLabels = await $$('android=new UiSelector().textMatches("Due: .+")');
          const visibleDueLabels: string[] = [];
          for (const label of dueLabels) {
            if (await label.isDisplayed()) visibleDueLabels.push(await label.getText());
          }
          assert.ok(visibleDueLabels.length > 0, 'Upcoming cards did not display due dates');

          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          for (const label of visibleDueLabels) {
            assert.equal(
              dueDateIsWithinRange(label, today, tomorrow),
              true,
              `${label} is outside the default upcoming date range`,
            );
          }
        }
      } finally {
        if (await screenTitle.isDisplayed()) {
          await browser.back();
          await upcomingWork.waitForDisplayed({ timeout: 30_000 });
        }
      }
    });
  }
});
