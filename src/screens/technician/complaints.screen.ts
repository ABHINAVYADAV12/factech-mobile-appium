import { $, $$, browser, expect } from '@wdio/globals';

function textSelector(text: string) {
  return $(`android=new UiSelector().text("${text}")`);
}

function descriptionContains(text: string) {
  return $(`android=new UiSelector().descriptionContains("${text}")`);
}

async function firstClickableCardBelow(anchorText: string) {
  const anchor = await textSelector(anchorText);
  await anchor.waitForDisplayed({ timeout: 30_000 });
  const anchorLocation = await anchor.getLocation();
  const anchorSize = await anchor.getSize();
  const candidates = await $$(
    'android=new UiSelector().className("android.view.ViewGroup").clickable(true)',
  );
  const visibleCards = [];

  for (const candidate of candidates) {
    if (!(await candidate.isDisplayed())) continue;
    const location = await candidate.getLocation();
    const size = await candidate.getSize();
    const description = await candidate.getAttribute('content-desc');
    if (
      description &&
      location.y > anchorLocation.y + anchorSize.height + 10 &&
      size.height >= 100
    ) {
      visibleCards.push({ candidate, x: location.x, y: location.y });
    }
  }

  visibleCards.sort((left, right) => left.y - right.y || left.x - right.x);
  const firstCard = visibleCards[0]?.candidate;
  if (!firstCard) throw new Error(`No selectable option appeared below ${anchorText}`);
  return firstCard;
}

export const technicianComplaintsScreen = {
  async openFromHome(): Promise<void> {
    const complaints = await descriptionContains('Open Complaints');
    await complaints.waitForDisplayed({ timeout: 45_000 });
    await complaints.click();
    await textSelector('WIP').waitForDisplayed({ timeout: 30_000 });
  },

  async openRaiseComplaint(): Promise<void> {
    const raise = await descriptionContains('Raise');
    await raise.waitForDisplayed({ timeout: 30_000 });
    await raise.click();
    await textSelector('Search Category...').waitForDisplayed({ timeout: 30_000 });
  },

  async selectFirstCategoryAndSubcategory(): Promise<void> {
    await (await firstClickableCardBelow('Search Category...')).click();

    const subcategorySearch = await textSelector('Search Sub Category...');
    const createIssue = await textSelector('Create Issue');
    await browser.waitUntil(
      async () => (await subcategorySearch.isDisplayed()) || (await createIssue.isDisplayed()),
      { timeout: 30_000, timeoutMsg: 'Category did not open a subcategory or complaint form' },
    );

    if (await subcategorySearch.isDisplayed()) {
      await (await firstClickableCardBelow('Search Sub Category...')).click();
    }
    await createIssue.waitForDisplayed({ timeout: 30_000 });
  },

  async selectFirstLocation(): Promise<void> {
    const location = await descriptionContains('Search Location');
    await location.waitForDisplayed({ timeout: 30_000 });
    await location.click();
    await textSelector('Select Location').waitForDisplayed({ timeout: 30_000 });
    await (await firstClickableCardBelow('Search locations...')).click();
    await textSelector('Describe the issue...').waitForDisplayed({ timeout: 30_000 });
  },

  async attachFixtureFromGallery(fileName: string): Promise<void> {
    const fileAction = await descriptionContains('File (0/5)');
    await fileAction.waitForDisplayed({ timeout: 30_000 });
    await fileAction.click();

    const fixture = await $(`android=new UiSelector().textContains("${fileName}")`);
    await fixture.waitForDisplayed({ timeout: 30_000 });
    await fixture.click();

    await descriptionContains('File (1/5)').waitForDisplayed({ timeout: 90_000 });
  },

  async createComplaint(description: string): Promise<void> {
    const descriptionInput = await textSelector('Describe the issue...');
    await descriptionInput.setValue(description);
    await (await descriptionContains('Create Issue')).click();

    const success = await textSelector('Issue created successfully!');
    const failure = await textSelector('Failed to create issue. Try Uploading Image');
    await browser.waitUntil(
      async () => (await success.isDisplayed()) || (await failure.isDisplayed()),
      {
        timeout: 20_000,
        interval: 100,
        timeoutMsg: 'Complaint submission did not return a success or failure confirmation',
      },
    );
    if (await failure.isDisplayed()) throw new Error('The app rejected complaint creation');
    await expect(success).toBeDisplayed();

    const openTab = await descriptionContains('OPEN,');
    await openTab.waitForDisplayed({ timeout: 30_000 });
    await openTab.click();
    const createdCard = await descriptionContains(description);
    await createdCard.waitForDisplayed({ timeout: 45_000 });
    await expect(createdCard).toBeDisplayed();
  },

  async closeCreatedComplaint(description: string): Promise<void> {
    const openTab = await descriptionContains('OPEN,');
    if (await openTab.isDisplayed()) await openTab.click();

    let createdCard = await descriptionContains(description);
    await createdCard.waitForDisplayed({ timeout: 45_000 });
    await createdCard.click();

    const selfAssign = await descriptionContains('Self Assign');
    if (await selfAssign.isDisplayed()) {
      await selfAssign.click();
      await textSelector('OK').waitForDisplayed({ timeout: 15_000 });
      await (await textSelector('OK')).click();
      await textSelector('Complaint Assigned').waitForDisplayed({ timeout: 30_000 });
      await textSelector('WIP').waitForDisplayed({ timeout: 30_000 });
      await (await descriptionContains('WIP,')).click();
      createdCard = await descriptionContains(description);
      await createdCard.waitForDisplayed({ timeout: 45_000 });
      await createdCard.click();
    }

    const close = await descriptionContains('Close Complaint');
    const compactClose = await descriptionContains('Close');
    const closeButton = (await close.isDisplayed()) ? close : compactClose;
    await closeButton.waitForDisplayed({ timeout: 30_000 });
    await closeButton.click();

    const otp = await textSelector('Enter OTP');
    if (await otp.isDisplayed()) {
      throw new Error('Selected complaint category requires a resident-provided OTP for closure');
    }

    const confirmation = await textSelector('Are you sure you want to close this complaint?');
    await confirmation.waitForDisplayed({ timeout: 15_000 });
    await (await textSelector('OK')).click();

    const success = await textSelector('Complaint closed successfully!');
    await success.waitForDisplayed({ timeout: 30_000 });
    await expect(success).toBeDisplayed();

    await textSelector('CLOSED').waitForDisplayed({ timeout: 30_000 });
    await (await descriptionContains('CLOSED,')).click();
    const closedCard = await descriptionContains(description);
    await closedCard.waitForDisplayed({ timeout: 45_000 });
    await expect(closedCard).toBeDisplayed();
  },
};
