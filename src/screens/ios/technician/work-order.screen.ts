import { $, $$, expect, browser } from '@wdio/globals';

// The three main tabs visible on the Work Order screen
export type WorkOrderTab = 'OPEN' | 'HOLD' | 'CLOSED';

// Confirmed status mapping for each tab
const expectedStatuses: Record<WorkOrderTab, string[]> = {
  OPEN: ['OPEN', 'STARTED', 'REOPENED', 'REOPEN', 'OVERDUE', 'MISSED'],
  HOLD: ['HOLD'],
  CLOSED: ['COMPLETED', 'CANCELLED'],
};

// Regex to identify work order cards by standard prefixes (e.g. WO-37410, HK-09128, LG-01495, LB-01484)
const CARD_ID_REGEX = /\b(WO|HK|LG|LB)-\d+\b/;

export const technicianIosWorkOrderScreen = {
  /**
   * Waits for the Work Order screen to be fully loaded with its three main tabs.
   */
  async waitForDisplayed(): Promise<void> {
    // Wait for the OPEN tab to confirm the Work Orders screen has loaded
    const openTab = $('//XCUIElementTypeOther[@name="OPEN"]');
    await openTab.waitForDisplayed({ timeout: 20_000 });
    await expect(openTab).toBeDisplayed();

    // Verify all three status tabs are displayed
    await expect($('//XCUIElementTypeOther[@name="HOLD"]')).toBeDisplayed();
    await expect($('//XCUIElementTypeOther[@name="CLOSED"]')).toBeDisplayed();
  },

  /**
   * Switches to one of the three tabs: 'OPEN', 'HOLD', or 'CLOSED'.
   */
  async openTab(tab: WorkOrderTab): Promise<void> {
    const tabElement = $(`//XCUIElementTypeOther[@name="${tab}"]`);
    await tabElement.waitForDisplayed({ timeout: 10_000 });
    await tabElement.click();
    // Brief pause to allow the card list to refresh
    await browser.pause(800);
  },

  // Selector matching the first work order card container
  get firstWorkOrderCard() {
    return $(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or starts-with(@name, "HK-") or starts-with(@name, "LG-") or starts-with(@name, "LB-")]',
    );
  },

  /**
   * Reads all currently visible work order cards from the screen.
   * Targets XCUIElementTypeOther whose name attribute starts with the card ID.
   */
  async getVisibleWorkOrderCards(): Promise<string[]> {
    const elements = await $$(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or starts-with(@name, "HK-") or starts-with(@name, "LG-") or starts-with(@name, "LB-")]',
    );
    const names = await elements.map((el) => el.getAttribute('name'));
    return [
      ...new Set(
        names.filter((n): n is string => Boolean(n)).map((n) => n.trim()),
      ),
    ];
  },

  /**
   * Verifies that work order cards are visible and have valid ID prefixes and statuses.
   */
  async verifyCardInformation(): Promise<void> {
    // Wait for cards to finish hydrating from the network
    await this.firstWorkOrderCard.waitForDisplayed({ timeout: 20_000 });

    const cards = await this.getVisibleWorkOrderCards();

    // Verify at least one card is loaded on screen
    await expect(cards.length).toBeGreaterThan(0);

    for (const label of cards) {
      const fields = label.split(',').map((field) => field.trim());

      // Field 0: Must match WO-XXXXX, HK-XXXXX, LG-XXXXX, LB-XXXXX
      await expect(fields[0]).toMatch(CARD_ID_REGEX);

      // Field 1: Must contain non-empty status (e.g. OPEN, STARTED)
      await expect(fields[1]).not.toBe('');
    }
  },

  /**
   * Switches to the given tab, scrolls through records, and asserts that
   * every card status displayed matches the allowed statuses for that tab.
   */
  async verifyStatusesWhileScrolling(tab: WorkOrderTab): Promise<void> {
    const allowedStatuses = expectedStatuses[tab];
    const collectedCards = new Set<string>();
    const maxSwipes = 20;

    // 1. Switch to the target tab
    await this.openTab(tab);

    // Wait for tab cards to finish loading (or empty state)
    try {
      await this.firstWorkOrderCard.waitForDisplayed({ timeout: 10_000 });
    } catch {
      // Tab may have no cards (e.g. empty list)
    }

    // 2. Scroll and collect unique card labels
    for (let swipe = 0; swipe < maxSwipes; swipe++) {
      const visibleCards = await this.getVisibleWorkOrderCards();

      for (const card of visibleCards) {
        collectedCards.add(card);
      }

      // Stop if no cards exist in this tab
      if (visibleCards.length === 0) {
        break;
      }

      // Stop early if "No more work orders" indicator is reached
      const noMoreElement = $('~No more work orders');
      if (await noMoreElement.isDisplayed()) {
        break;
      }

      // Swipe up to load more items
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(500);

      const afterSwipe = await this.getVisibleWorkOrderCards();
      const newCardsFound = afterSwipe.some((card) => !collectedCards.has(card));

      // Stop if scrolling revealed no new cards
      if (!newCardsFound) {
        for (const card of afterSwipe) {
          collectedCards.add(card);
        }
        break;
      }
    }

    // 3. Ensure cards were found for this tab
    await expect(collectedCards.size).toBeGreaterThan(0);

    // 4. Assert every card's status (fields[1]) matches the allowed statuses for this tab
    for (const label of collectedCards) {
      const fields = label.split(',').map((field) => field.trim());
      const status = fields[1];

      if (!status || !allowedStatuses.includes(status)) {
        throw new Error(
          `Unexpected status "${status}" in ${tab} tab. Allowed: [${allowedStatuses.join(', ')}]. Card: ${label}`,
        );
      }
    }
  },

  // --- Filter Modal Elements ---

  get filterButton() {
    return $('//XCUIElementTypeOther[contains(@name, "Filter")]');
  },

  get filterModalTitle() {
    return $(
      '//XCUIElementTypeStaticText[contains(@name, "Filter Work Orders") or contains(@label, "Filter Work Orders")] | //XCUIElementTypeOther[contains(@name, "Filter Work Orders") or contains(@label, "Filter Work Orders")]',
    );
  },

  get resetFiltersButton() {
    return $('//XCUIElementTypeOther[@name="Reset"] | //XCUIElementTypeStaticText[@name="Reset"]');
  },

  get applyFiltersButton() {
    return $('//XCUIElementTypeOther[@name="Apply Filters"] | //XCUIElementTypeStaticText[@name="Apply Filters"]');
  },

  // --- Filter Modal Actions ---

  /**
   * Opens the "Filter Work Orders" modal sheet.
   * Waits for the Apply Filters button at the bottom since the top title may be occluded by the iOS status bar.
   */
  async openFilterModal(): Promise<void> {
    await this.filterButton.waitForDisplayed({ timeout: 10_000 });
    await this.filterButton.click();
    // Wait for the modal sheet to be visible via the Apply Filters action button
    await this.applyFiltersButton.waitForDisplayed({ timeout: 10_000 });
    await expect(this.applyFiltersButton).toBeDisplayed();
  },

  /**
   * Switches category in the left pane of the filter sheet: 'Status', 'Flag', 'Date', or 'Scheduled'.
   * Uses $$ to click the displayed category control.
   */
  async selectFilterCategory(category: 'Status' | 'Flag' | 'Date' | 'Scheduled'): Promise<void> {
    const elements = await $$(
      `//XCUIElementTypeOther[contains(@name, "${category}")] | //XCUIElementTypeStaticText[contains(@name, "${category}")]`,
    );
    for (const el of elements) {
      if (await el.isDisplayed()) {
        await el.click();
        await browser.pause(500);
        return;
      }
    }
    throw new Error(`Filter category "${category}" not displayed`);
  },

  /**
   * Asserts that a specific filter option is displayed on screen.
   * Targets XCUIElementTypeOther whose name starts with or equals the option.
   * Handles selected checkmarks (e.g. "OPEN, ") and avoids covered background elements.
   */
  async verifyFilterOption(option: string): Promise<void> {
    await browser.waitUntil(
      async () => {
        const elements = await $$(
          `//XCUIElementTypeOther[starts-with(@name, "${option}") or @name="${option}"]`,
        );
        for (const el of elements) {
          if (await el.isDisplayed()) {
            return true;
          }
        }
        return false;
      },
      {
        timeout: 10_000,
        timeoutMsg: `Filter option "${option}" was not displayed within 10s`,
      },
    );
  },

  /**
   * TC-02: Validates all filter categories, status/flag/date options, and footer buttons.
   */
  async verifyFilterScreenAndOptions(): Promise<void> {
    // 1. Verify modal title exists in DOM (top position may be partially occluded by iOS status bar)
    await expect(this.filterModalTitle).toBeExisting();

    // 2. Verify all four category controls on the left navigation pane
    const categories: Array<'Status' | 'Flag' | 'Date' | 'Scheduled'> = [
      'Status',
      'Flag',
      'Date',
      'Scheduled',
    ];
    for (const cat of categories) {
      const elements = await $$(
        `//XCUIElementTypeOther[contains(@name, "${cat}")] | //XCUIElementTypeStaticText[contains(@name, "${cat}")]`,
      );
      let displayed = false;
      for (const el of elements) {
        if (await el.isDisplayed()) {
          displayed = true;
          break;
        }
      }
      expect(displayed).toBe(true);
    }

    // 3. Verify Status options
    await this.selectFilterCategory('Status');
    const statusOptions = [
      'OPEN',
      'STARTED',
      'COMPLETED',
      'HOLD',
      'CANCELLED',
      'REOPEN',
      'OVERDUE',
      'MISSED',
    ];
    for (const opt of statusOptions) {
      await this.verifyFilterOption(opt);
    }

    // 4. Verify Flag options
    await this.selectFilterCategory('Flag');
    const flagOptions = ['No Delay', 'Delayed', 'All'];
    for (const opt of flagOptions) {
      await this.verifyFilterOption(opt);
    }

    // 5. Verify Date options
    await this.selectFilterCategory('Date');
    const dateOptions = ['Today', 'Yesterday', 'All', 'Custom Date'];
    for (const opt of dateOptions) {
      await this.verifyFilterOption(opt);
    }

    // 6. Verify Reset and Apply Filters action buttons
    await expect(this.resetFiltersButton).toBeDisplayed();
    await expect(this.applyFiltersButton).toBeDisplayed();

    // 7. Dismiss modal cleanly
    await this.applyFiltersButton.click();
    await browser.pause(500);
  },

  /**
   * Taps an option in the current filter category (e.g. 'COMPLETED', 'OPEN', 'Yesterday').
   * Unchecks any previously selected option in the same category to guarantee single-option testing.
   */
  async selectFilterOption(option: string): Promise<void> {
    // 1. Uncheck any currently checked option in this category that is not our target
    const checkedElements = await $$(
      '//XCUIElementTypeScrollView//XCUIElementTypeOther[contains(@name, ", ")]',
    );
    for (const checkedEl of checkedElements) {
      try {
        if (await checkedEl.isDisplayed()) {
          const name = await checkedEl.getAttribute('name');
          if (name && !name.startsWith(option)) {
            await checkedEl.click();
            await browser.pause(300);
          }
        }
      } catch {
        // Element may have decoupled or refreshed
      }
    }

    // 2. Select the target option if it is not already checked
    const elements = await $$(
      `//XCUIElementTypeScrollView//XCUIElementTypeOther[starts-with(@name, "${option}")]`,
    );
    for (const el of elements) {
      if (await el.isDisplayed()) {
        const name = await el.getAttribute('name');
        if (name && !name.includes('')) {
          await el.click();
          await browser.pause(400);
        }
        return;
      }
    }

    // Fallback if ScrollView structure varies
    const fallbackElements = await $$(
      `//XCUIElementTypeOther[starts-with(@name, "${option}")]`,
    );
    for (const el of fallbackElements) {
      if (await el.isDisplayed()) {
        await el.click();
        await browser.pause(400);
        return;
      }
    }

    throw new Error(`Filter option "${option}" could not be clicked`);
  },

  /**
   * Applies the current filter selections and closes the modal sheet.
   */
  async applyFilters(): Promise<void> {
    await this.applyFiltersButton.waitForDisplayed({ timeout: 10_000 });
    await this.applyFiltersButton.click();
    await browser.pause(2000);
  },

  /**
   * Resets all filter selections to default in the modal sheet.
   */
  async resetFilters(): Promise<void> {
    await this.resetFiltersButton.waitForDisplayed({ timeout: 10_000 });
    await this.resetFiltersButton.click();
    await browser.pause(500);
  },

  /**
   * Scrolls through work order cards and collects unique card records.
   * Default maxSwipes is 3 to keep execution fast while validating pagination.
   */
  async scrollAndCollectAllCards(maxSwipes = 3): Promise<string[]> {
    const collectedCards = new Set<string>();

    for (let swipe = 0; swipe < maxSwipes; swipe++) {
      const visibleCards = await this.getVisibleWorkOrderCards();
      for (const card of visibleCards) {
        collectedCards.add(card);
      }

      if (visibleCards.length === 0) {
        break;
      }

      const noMoreElement = $('~No more work orders');
      if (await noMoreElement.isDisplayed()) {
        break;
      }

      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(300);
    }

    return [...collectedCards];
  },

  /**
   * Scrolls through all cards till the end.
   * If cards are found, verifies each card matches expectedStatus (if provided).
   * If no cards are found, verifies that the list is empty (valid empty state).
   */
  async verifyFilteredCardsOrEmptyState(
    expectedStatus?: string,
  ): Promise<{ count: number; emptyState: boolean }> {
    await browser.pause(800);
    const cards = await this.scrollAndCollectAllCards(3);

    if (cards.length === 0) {
      return { count: 0, emptyState: true };
    }

    if (expectedStatus) {
      for (const card of cards) {
        const fields = card.split(',').map((f) => f.trim());
        const status = fields[1];
        if (status && status !== expectedStatus) {
          throw new Error(
            `Expected card status "${expectedStatus}", but found "${status}" on card: ${card}`,
          );
        }
      }
    }

    return { count: cards.length, emptyState: false };
  },

  /**
   * Verifies that cards returned under the Flag filter match the criteria:
   * - 'Delayed': Cards contain 'Delayed' / 'Delay' / 'Overdue' (or empty state if 0 records).
   * - 'No Delay': Cards do not contain delay tags.
   * - 'All': Any valid records.
   */
  async verifyFlagFilteredCardsOrEmptyState(
    flag: 'No Delay' | 'Delayed' | 'All',
  ): Promise<{ count: number; emptyState: boolean }> {
    await browser.pause(800);
    const cards = await this.scrollAndCollectAllCards(3);

    if (cards.length === 0) {
      return { count: 0, emptyState: true };
    }

    if (flag === 'Delayed') {
      for (const card of cards) {
        const isDelayed =
          card.includes('') || /delayed|delay|overdue/i.test(card);
        if (!isDelayed) {
          throw new Error(`Expected card to have Delayed flag, but found: ${card}`);
        }
      }
    } else if (flag === 'No Delay') {
      for (const card of cards) {
        const isDelayed =
          card.includes('') || /\bdelayed\b/i.test(card);
        if (isDelayed) {
          throw new Error(`Expected card to have No Delay flag, but found delayed: ${card}`);
        }
      }
    }

    return { count: cards.length, emptyState: false };
  },

  /**
   * Verifies that cards returned under the Date filter match the criteria:
   * - 'Today': Cards have today's date in their scheduled date field.
   * - 'Yesterday': Cards have yesterday's date in their scheduled date field (or empty state).
   * - 'All' / 'Custom Date': Cards have valid date fields or empty state.
   */
  async verifyDateFilteredCardsOrEmptyState(
    dateOption: 'Today' | 'Yesterday' | 'All' | 'Custom Date',
  ): Promise<{ count: number; emptyState: boolean }> {
    await browser.pause(800);
    const cards = await this.scrollAndCollectAllCards(3);

    if (cards.length === 0) {
      return { count: 0, emptyState: true };
    }

    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ];

    if (dateOption === 'Today') {
      const today = new Date();
      const day = today.getDate();
      const month = monthNames[today.getMonth()];
      const year = today.getFullYear();
      const dateRegex = new RegExp(`\\b${day}\\s+${month}\\s+${year}\\b`, 'i');

      for (const card of cards) {
        if (!dateRegex.test(card)) {
          throw new Error(`Card date does not match Today (${day} ${month} ${year}): ${card}`);
        }
      }
    } else if (dateOption === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const day = yesterday.getDate();
      const month = monthNames[yesterday.getMonth()];
      const year = yesterday.getFullYear();
      const dateRegex = new RegExp(`\\b${day}\\s+${month}\\s+${year}\\b`, 'i');

      for (const card of cards) {
        if (!dateRegex.test(card)) {
          throw new Error(`Card date does not match Yesterday (${day} ${month} ${year}): ${card}`);
        }
      }
    }

    return { count: cards.length, emptyState: false };
  },

  get reloadButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Reload")] | //XCUIElementTypeStaticText[contains(@name, "Reload")] | //XCUIElementTypeButton[contains(@name, "Reload")] | //XCUIElementTypeOther[contains(@name, "Refresh")]',
    );
  },

  /**
   * Refreshes the Work Order list:
   * If an empty-state Reload/Refresh button is displayed, taps it.
   * Otherwise, performs a pull-to-refresh swipe down gesture.
   */
  async refreshList(): Promise<void> {
    if (await this.reloadButton.isDisplayed()) {
      await this.reloadButton.click();
      await browser.pause(1500);
      return;
    }

    // Pull-to-refresh swipe down
    await browser.execute('mobile: swipe', { direction: 'down' });
    await browser.pause(1500);
  },

  /**
   * Opens the filter modal, taps Reset, applies filters, and waits for default list restoration.
   */
  async resetAndApplyFilters(): Promise<void> {
    await this.openFilterModal();
    await this.resetFilters();
    await this.applyFilters();
  },

  /**
   * Opens the filter modal, switches category, selects option, and applies filters.
   */
  async applyCategoryFilter(
    category: 'Status' | 'Flag' | 'Date' | 'Scheduled',
    option: string,
  ): Promise<void> {
    await this.openFilterModal();
    await this.resetFilters();
    await this.selectFilterCategory(category);
    await this.selectFilterOption(option);
    await this.applyFilters();
  },
};
