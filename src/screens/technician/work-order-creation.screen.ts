import { $, $$, browser, expect } from '@wdio/globals';

import { parseChecklistProgress } from './checklist-progress.js';
import { recordStatusDescription } from './template-types.js';

function textSelector(text: string) {
  return $(`android=new UiSelector().text("${text}")`);
}

function descriptionContains(text: string) {
  return $(`android=new UiSelector().descriptionContains("${text}")`);
}

async function scrollToDescription(text: string, timeoutMsg: string) {
  let target = await descriptionContains(text);
  if (await target.isDisplayed()) return target;

  const beginning = await $(
    'android=new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(50).scrollToBeginning(50)',
  );
  await beginning.isExisting();

  const scrollResult = await $(
    `android=new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(50).scrollIntoView(new UiSelector().descriptionContains("${text}"))`,
  );
  await scrollResult.waitForExist({ timeout: 45_000, timeoutMsg });

  // UiAutomator returns the ScrollView used by scrollIntoView on this live
  // screen, not the matching card. Resolve the card again after scrolling.
  target = await descriptionContains(text);
  await target.waitForDisplayed({ timeout: 45_000, timeoutMsg });
  return target;
}

async function openTemplateRecord(name: string): Promise<void> {
  const checklist = await textSelector('Checklist');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const card = await scrollToDescription(
      name,
      `${name} was not available in the selected work-order list`,
    );
    await card.click();

    try {
      // Cached records can take substantially longer to hydrate their detail
      // screen after connectivity is removed. Do not re-tap while that offline
      // transition is still in flight.
      await checklist.waitForDisplayed({ timeout: 45_000 });
      return;
    } catch {
      if (!(await textSelector('OPEN').isDisplayed())) {
        throw new Error(`${name} opened without a Checklist view`);
      }
    }
  }

  throw new Error(`${name} did not open after three card taps`);
}

async function firstDisplayedExactText(text: string) {
  const matches = await $$(`android=new UiSelector().text("${text}")`);
  for (const match of matches) {
    if (await match.isDisplayed()) return match;
  }
  throw new Error(`No displayed element matched ${text}`);
}

async function populateVisibleInstructionTextInputs(): Promise<void> {
  const inputs = await $$('android=new UiSelector().className("android.widget.EditText")');
  for (const input of inputs) {
    if (!(await input.isDisplayed()) || !(await input.isEnabled())) continue;

    const currentValue = ((await input.getAttribute('text')) || (await input.getText()))?.trim();
    if (currentValue && !/^Enter |^Value \(/i.test(currentValue)) continue;

    await input.click();
    await input.setValue('1');
    await browser.execute('mobile: pressKey', { keycode: 66 });
    await browser.hideKeyboard();
    await browser.pause(4_000);
  }
}

async function populateVisibleInstructionDates(): Promise<void> {
  for (let completed = 0; completed < 6; completed += 1) {
    let unpopulated = await $(
      'android=new UiSelector().className("android.view.ViewGroup").clickable(true).descriptionContains("Select Date/Time")',
    );
    if (!(await unpopulated.isExisting()) || !(await unpopulated.isDisplayed())) return;

    const y = await unpopulated.getLocation('y');
    if (y > 2_400) {
      await browser.execute('mobile: swipeGesture', {
        left: 50,
        top: 900,
        width: 980,
        height: 1_000,
        direction: 'up',
        percent: 0.75,
      });
      unpopulated = await $(
        'android=new UiSelector().className("android.view.ViewGroup").clickable(true).descriptionContains("Select Date/Time")',
      );
      await unpopulated.waitForDisplayed({ timeout: 10_000 });
    }

    await unpopulated.click();
    await browser.pause(750);
    const confirmDate = await $('id=android:id/button1');
    if (!(await confirmDate.isDisplayed())) {
      // The live app auto-populates the current value for cached offline
      // instructions instead of presenting the native picker.
      continue;
    }
    await confirmDate.click();

    // A datetime instruction presents a time picker immediately after its date picker.
    await browser.pause(500);
    const confirmTime = await $('id=android:id/button1');
    if ((await confirmTime.isExisting()) && (await confirmTime.isDisplayed())) {
      await confirmTime.click();
    }
    await browser.pause(1_500);
  }

  throw new Error('More than six unpopulated date/time instructions were visible');
}

async function populateVisibleSignature(): Promise<void> {
  const missingSignature = await textSelector('No sign');
  if (!(await missingSignature.isExisting()) || !(await missingSignature.isDisplayed())) return;

  const signActions = await $$('//android.widget.TextView[@text="Sign"]');
  let signAction: WebdriverIO.Element | undefined;
  for (const candidate of signActions) {
    if (await candidate.isDisplayed()) {
      signAction = candidate;
      break;
    }
  }
  if (!signAction)
    throw new Error('A mandatory signature is empty but its Sign action is unavailable');

  await signAction.click();
  await textSelector('Signature').waitForDisplayed({ timeout: 15_000 });
  await browser.pause(1_000);

  const { width, height } = await browser.getWindowSize();
  await browser.performActions([
    {
      type: 'pointer',
      id: 'signature-finger',
      parameters: { pointerType: 'touch' },
      actions: [
        {
          type: 'pointerMove',
          duration: 0,
          x: Math.round(width * 0.25),
          y: Math.round(height * 0.45),
        },
        { type: 'pointerDown', button: 0 },
        {
          type: 'pointerMove',
          duration: 300,
          x: Math.round(width * 0.5),
          y: Math.round(height * 0.55),
        },
        {
          type: 'pointerMove',
          duration: 300,
          x: Math.round(width * 0.75),
          y: Math.round(height * 0.42),
        },
        { type: 'pointerUp', button: 0 },
      ],
    },
  ]);
  await browser.releaseActions();
  await (await firstDisplayedExactText('Save')).click();

  await browser.waitUntil(async () => !(await textSelector('No sign').isDisplayed()), {
    timeout: 45_000,
    interval: 500,
    timeoutMsg: 'The mandatory signature was not saved',
  });
}

async function checklistProgress(): Promise<{ completed: number; total: number } | undefined> {
  const labels = await $$('android=new UiSelector().className("android.widget.TextView")');
  for (const label of labels) {
    if (!(await label.isDisplayed())) continue;
    const text = (await label.getAttribute('text'))?.trim();
    const progress = text ? parseChecklistProgress(text) : undefined;
    if (progress) return progress;
  }
  return undefined;
}

async function populateChecklistToggles(): Promise<void> {
  let progress = await checklistProgress();
  if (!progress || progress.completed === progress.total) return;

  const window = await browser.getWindowSize();
  let consecutiveSwipes = 0;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const unselectedToggles = await $$(
      '//android.view.ViewGroup[android.widget.TextView[1][contains(@text,".")]]/android.view.ViewGroup[@index="1" and @clickable="true" and @content-desc="" and count(*)=1 and following-sibling::android.view.ViewGroup[1][@clickable="true" and @content-desc!=""]]',
    );
    let selectedVisibleToggle = false;

    for (const toggle of unselectedToggles) {
      if (!(await toggle.isDisplayed())) continue;
      const location = await toggle.getLocation();
      const size = await toggle.getSize();
      const safeTop = window.height * 0.15;
      const safeBottom = window.height * 0.82;
      if (location.y < safeTop || location.y + size.height > safeBottom) continue;

      const progressBeforeClick = progress;
      if (!progressBeforeClick) return;
      const completedBeforeClick = progressBeforeClick.completed;
      await toggle.click();
      await browser.waitUntil(
        async () => {
          const updatedProgress = await checklistProgress();
          if (!updatedProgress || updatedProgress.completed <= completedBeforeClick) return false;
          progress = updatedProgress;
          return true;
        },
        {
          timeout: 10_000,
          interval: 500,
          timeoutMsg: `Checklist progress did not advance beyond ${completedBeforeClick}/${progressBeforeClick.total}`,
        },
      );
      selectedVisibleToggle = true;
      consecutiveSwipes = 0;
      break;
    }

    progress = await checklistProgress();
    if (progress?.completed === progress?.total) return;
    if (selectedVisibleToggle) continue;

    // Swipe the checklist content upward to reveal later instructions. Appium's
    // swipe direction describes the finger movement, matching the physical
    // gesture that exposes checklist items below the fold.
    await browser.execute('mobile: swipeGesture', {
      left: Math.round(window.width * 0.05),
      top: Math.round(window.height * 0.2),
      width: Math.round(window.width * 0.9),
      height: Math.round(window.height * 0.55),
      direction: 'up',
      percent: 0.75,
    });
    await browser.pause(500);
    consecutiveSwipes += 1;
    if (consecutiveSwipes >= 8) return;
  }
}

async function populateMandatoryTemplateInstructions(): Promise<void> {
  await populateVisibleInstructionTextInputs();
  await populateVisibleSignature();
  await populateVisibleInstructionDates();
  await populateChecklistToggles();

  const complete = await descriptionContains('Mark as Complete');
  if (await complete.isDisplayed()) return;

  // Each instruction component persists its own result. The completion action appears
  // only after the saved checklist satisfies
  // every mandatory instruction configured on the selected template.
  try {
    await complete.waitForDisplayed({ timeout: 45_000 });
  } catch {
    const progress = await checklistProgress();
    const progressEvidence = progress
      ? `; checklist stopped at ${progress.completed}/${progress.total}`
      : '';
    throw new Error(`Saved checklist answers did not enable record completion${progressEvidence}`);
  }
}

export const technicianWorkOrderCreationScreen = {
  async openFromHome(): Promise<void> {
    const workOrders = await descriptionContains('Open Work Orders');
    await workOrders.waitForDisplayed({ timeout: 45_000 });
    await workOrders.click();
    await textSelector('OPEN').waitForDisplayed({ timeout: 30_000 });
  },

  async completeOpenTemplateRecord(name: string, remark: string): Promise<void> {
    await openTemplateRecord(name);

    await populateMandatoryTemplateInstructions();
    const complete = await descriptionContains('Mark as Complete');
    await complete.waitForDisplayed({ timeout: 45_000 });
    await complete.click();

    const remarkInput = await textSelector('Add your remark (max 250 characters)');
    await remarkInput.waitForDisplayed({ timeout: 15_000 });
    await remarkInput.setValue(remark);
    await browser.hideKeyboard();
    await (await firstDisplayedExactText('Mark as Complete')).click();

    const success = await textSelector('Successfully Marked As Complete');
    const openList = await textSelector('OPEN');
    await browser.waitUntil(
      async () => (await success.isDisplayed()) || (await openList.isDisplayed()),
      {
        timeout: 30_000,
        timeoutMsg: `${name} did not report local completion or return to the OPEN list`,
      },
    );
    if (await success.isDisplayed()) {
      await expect(success).toBeDisplayed();
    }

    await openList.waitForDisplayed({ timeout: 30_000 });
    await (await descriptionContains('Filter')).click();
    await (await textSelector('COMPLETED')).click();
    await (await textSelector('Apply Filters')).click();
    await textSelector('COMPLETED').waitForDisplayed({ timeout: 30_000 });

    const completedCard = await scrollToDescription(
      recordStatusDescription(name, 'COMPLETED'),
      `${name} was not visible after local completion`,
    );
    await expect(completedCard).toBeDisplayed();

    await (await descriptionContains('Filter')).click();
    await (await textSelector('OPEN')).click();
    await (await textSelector('Apply Filters')).click();
    await textSelector('OPEN').waitForDisplayed({ timeout: 30_000 });
  },

  async expectOpenTemplateRecords(names: string[]): Promise<void> {
    await textSelector('OPEN').waitForDisplayed({ timeout: 30_000 });
    for (const name of names) {
      const openCard = await scrollToDescription(
        recordStatusDescription(name, 'OPEN'),
        `${name} was not available in the OPEN work-order cache`,
      );
      await expect(openCard).toBeDisplayed();
    }
  },

  async expectOfflineTemplateRecordsAccessible(names: string[]): Promise<void> {
    const openList = await textSelector('OPEN');
    await openList.waitForDisplayed({ timeout: 30_000 });

    for (const name of names) {
      await openTemplateRecord(name);
      await browser.back();
      await openList.waitForDisplayed({
        timeout: 30_000,
        timeoutMsg: `${name} did not return to the offline OPEN list after cache verification`,
      });
    }
  },

  async expectCompletedTemplateRecords(names: string[]): Promise<void> {
    await textSelector('OPEN').waitForDisplayed({ timeout: 30_000 });
    await (await descriptionContains('Filter')).click();
    await (await textSelector('COMPLETED')).click();
    await (await textSelector('Apply Filters')).click();
    await textSelector('COMPLETED').waitForDisplayed({ timeout: 30_000 });

    for (const name of names) {
      const completedCard = await scrollToDescription(
        recordStatusDescription(name, 'COMPLETED'),
        `${name} was not returned as COMPLETED by the connected app`,
      );
      await expect(completedCard).toBeDisplayed();
      await completedCard.click();

      const progress = await checklistProgress();
      if (!progress || progress.completed !== progress.total) {
        const evidence = progress ? `${progress.completed}/${progress.total}` : 'not displayed';
        throw new Error(
          `${name} completed detail did not retain a finished checklist: ${evidence}`,
        );
      }

      await browser.back();
      await textSelector('COMPLETED').waitForDisplayed({
        timeout: 30_000,
        timeoutMsg: `${name} did not return to the COMPLETED list after detail verification`,
      });
    }
  },
};
