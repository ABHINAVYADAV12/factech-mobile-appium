import { $, $$, browser } from '@wdio/globals';

import { resolveCreatedTemplateSequence, type TemplateType } from './template-types.js';

function textSelector(text: string) {
  return $(`android=new UiSelector().text("${text}")`);
}

function descriptionContains(text: string) {
  return $(`android=new UiSelector().descriptionContains("${text}")`);
}

async function visibleWorkOrderSequences(): Promise<Set<string>> {
  const candidates = await $$(
    'android=new UiSelector().className("android.view.ViewGroup").clickable(true)',
  );
  const sequences = new Set<string>();
  for (const candidate of candidates) {
    if (!(await candidate.isDisplayed())) continue;
    const description = await candidate.getAttribute('content-desc');
    const sequence = description ? sequenceFromDescription(description) : undefined;
    if (sequence) sequences.add(sequence);
  }
  return sequences;
}

function templateLabel(type: TemplateType): 'PM' | 'Housekeeping' | 'Logbook' {
  if (type === 'HK') return 'Housekeeping';
  if (type === 'LB') return 'Logbook';
  return 'PM';
}

function sequenceFromDescription(description: string): string | undefined {
  return description.match(/\b(?:WO|HK|LB|BR|HW|LG)[- ]?\d+\b/i)?.[0];
}

async function firstTemplateCard(typeLabel: 'PM' | 'Housekeeping' | 'Logbook') {
  let displayedCard: WebdriverIO.Element | undefined;
  await browser.waitUntil(
    async () => {
      const candidates = await $$(
        `//android.widget.TextView[@text="${typeLabel}"]/ancestor::android.view.ViewGroup[@clickable="true"][1]`,
      );
      for (const candidate of candidates) {
        if (await candidate.isDisplayed()) {
          displayedCard = candidate;
          return true;
        }
      }
      return false;
    },
    {
      timeout: 30_000,
      interval: 1_000,
      timeoutMsg: `No ${typeLabel} template is configured for the approved test account`,
    },
  );
  if (!displayedCard) {
    throw new Error(`No ${typeLabel} template is configured for the approved test account`);
  }
  return displayedCard;
}

export const technicianWorkOrderTemplateCreationScreen = {
  async createFirstConfiguredTemplate(type: TemplateType): Promise<string> {
    const typeLabel = templateLabel(type);
    const previousSequences = await visibleWorkOrderSequences();

    const addDescription = await descriptionContains('Add');
    const addText = await textSelector('Add');
    await browser.waitUntil(
      async () => (await addDescription.isDisplayed()) || (await addText.isDisplayed()),
      { timeout: 30_000, timeoutMsg: 'Template Add action was not displayed' },
    );
    await ((await addDescription.isDisplayed()) ? addDescription : addText).click();
    await (await textSelector('Templates')).click();

    const search = await textSelector('Search templates by keyword...');
    await search.waitForDisplayed({ timeout: 45_000 });
    await search.setValue(type);
    await browser.hideKeyboard();

    await (await firstTemplateCard(typeLabel)).click();
    const confirmation = await textSelector(
      `Are you sure you want to create WO from this ${typeLabel}?`,
    );
    await confirmation.waitForDisplayed({ timeout: 15_000 });
    await (await textSelector('OK')).click();

    await textSelector('OPEN').waitForDisplayed({ timeout: 60_000 });
    let currentSequences = new Set<string>();
    await browser.waitUntil(
      async () => {
        currentSequences = await visibleWorkOrderSequences();
        return [...currentSequences].some((sequence) => !previousSequences.has(sequence));
      },
      {
        timeout: 60_000,
        interval: 1_000,
        timeoutMsg: `${typeLabel} creation produced no new OPEN record`,
      },
    );
    return resolveCreatedTemplateSequence(previousSequences, currentSequences, type);
  },
};
