
import { $, $$, expect } from '@wdio/globals';

export const technicianIosUpcomingWorkOrderScreen = {
  // Work-order selectors
  get upcomingWorkOrderCard() {
    return $('//XCUIElementTypeOther[contains(@name, "UPCOMING")]');
  },

  get workOrderCards() {
    return $$(
      '//XCUIElementTypeOther[contains(@name, "UPCOMING") and contains(@name, "Tap to view schedule details")]',
    );
  },

  get totalWorkOrdersLabel() {
    return $(
      '(//XCUIElementTypeStaticText[contains(@name, "Total ") and contains(@name, " work orders for ")])[2]',
    );
  },

  get searchField() {
    return $('//XCUIElementTypeTextField');
  },

  // Date-picker selectors
  get fromDateField() {
    return $('//XCUIElementTypeOther[contains(@name, "From:")]');
  },

  get toDateField() {
    return $('//XCUIElementTypeOther[contains(@name, "To:")]');
  },

  // Scheduled-time popup selectors
  get scheduledTimeMessage() {
    return $('~This work will be available at scheduled time:');
  },

  get okButton() {
    return $('~OK');
  },

  // Empty-state selectors
  get noWorkOrdersFoundText() {
    return $('~No Work Orders Found');
  },

  get noTasksScheduledText() {
    return $(
      '//XCUIElementTypeStaticText[contains(@name, "No tasks scheduled between")]',
    );
  },

  get reloadButton() {
    return $('//XCUIElementTypeOther[@name=", Reload"]');
  },

  // Wait for the Upcoming Work Orders section.
  async waitForDisplayed(): Promise<void> {
    await expect(this.upcomingWorkOrderCard).toBeDisplayed();
  },

  // Date selection
  async openFromDatePicker(): Promise<void> {
    await this.fromDateField.click();
  },

  async openToDatePicker(): Promise<void> {
    await this.toDateField.click();
  },

  async selectAvailableDate(dayOffset: number): Promise<void> {
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);

    const day = target.getDate();
    const month = target.toLocaleDateString('en-US', {
      month: 'short',
    });
    const weekday = target
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toUpperCase();

    const dateLabel = `${weekday}, ${day}, ${month}`;
    const dateElement = $(
      `//XCUIElementTypeOther[@name="${dateLabel}"]`,
    );

    await dateElement.waitForDisplayed({ timeout: 10000 });
    await dateElement.click();
  },

  async expectDatePickerClosed(): Promise<void> {
    await expect(
      $('//XCUIElementTypeOther[@name=""]'),
    ).not.toBeDisplayed();
  },

  async selectDateRange(
    fromDayOffset: number,
    toDayOffset: number,
  ): Promise<void> {
    await this.openFromDatePicker();
    await this.selectAvailableDate(fromDayOffset);
    await this.expectDatePickerClosed();

    await this.openToDatePicker();
    await this.selectAvailableDate(toDayOffset);
    await this.expectDatePickerClosed();
  },

  // Work-order card information
  async getWorkOrderCardNames(): Promise<string[]> {
    const cards = await this.workOrderCards;
    const names: string[] = [];

    for (const card of cards) {
      const name = await card.getAttribute('name');

      if (name) {
        names.push(name);
      }
    }

    return names;
  },

  async getAllSearchResults(): Promise<string[]> {
    const collectedNames = new Set<string>();
    let previousCount = -1;

    for (let attempt = 0; attempt < 10; attempt++) {
      const cards = await this.workOrderCards;

      for (const card of cards) {
        const name = await card.getAttribute('name');

        if (name) {
          collectedNames.add(name);
        }
      }

      const currentCount = collectedNames.size;

      if (currentCount === previousCount) {
        break;
      }

      previousCount = currentCount;

      await browser.execute('mobile: scroll', {
        direction: 'down',
      });
    }

    return [...collectedNames];
  },

  async getTotalWorkOrderCount(): Promise<number> {
    const label = await this.totalWorkOrdersLabel.getAttribute('name');
    const match = label?.match(/Total\s+(\d+)\s+work orders/);

    if (!match) {
      throw new Error(
        `Unable to read work-order count from: ${label}`,
      );
    }

    return Number(match[1]);
  },

  // Search
  async searchWorkOrders(searchText: string): Promise<void> {
    await this.searchField.waitForDisplayed({ timeout: 10000 });
    await this.searchField.click();
    await this.searchField.clearValue();
    await this.searchField.addValue(searchText);
  },

  async clearSearch(): Promise<void> {
    await this.searchField.clearValue();
  },

  // Scheduled-time popup and early-start behavior
  async openWorkOrder(): Promise<void> {
    await this.upcomingWorkOrderCard.waitForDisplayed({
      timeout: 15000,
    });

    await this.upcomingWorkOrderCard.click();
  },

  async expectScheduledTimePopup(): Promise<void> {
    await expect(this.scheduledTimeMessage).toBeDisplayed();
    await expect(this.okButton).toBeDisplayed();
  },

  async closePopup(): Promise<void> {
    await this.okButton.click();
  },

  async verifyWorkOrderDetails(): Promise<void> {
    await this.openWorkOrder();
    await this.expectScheduledTimePopup();
    await this.closePopup();
  },

  async expectUpcomingStatus(): Promise<void> {
    await expect(
      $('//XCUIElementTypeOther[contains(@name, "UPCOMING")]'),
    ).toBeDisplayed();
  },

  async verifyWorkCannotStartEarly(): Promise<void> {
    await this.openWorkOrder();
    await this.expectScheduledTimePopup();
    await this.closePopup();
    await this.waitForDisplayed();
  },

  // Scheduled-date validation
  getScheduledDateFromCard(cardName: string): Date {
    const match = cardName.match(
      /\b(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}),\s+(\d{1,2}:\d{2}\s+[AP]M)\b/,
    );

    if (!match) {
      throw new Error(
        `Scheduled date not found in card: ${cardName}`,
      );
    }

    const scheduledDate = new Date(`${match[1]} ${match[2]}`);

    if (Number.isNaN(scheduledDate.getTime())) {
      throw new Error(
        `Invalid scheduled date in card: ${cardName}`,
      );
    }

    return scheduledDate;
  },

  isDateWithinRange(
    scheduledDate: Date,
    fromDate: Date,
    toDate: Date,
  ): boolean {
    const scheduledTime = scheduledDate.getTime();

    return (
      scheduledTime >= fromDate.getTime() &&
      scheduledTime <= toDate.getTime()
    );
  },

  // Empty-state verification
  async verifyNoWorkOrdersEmptyState(): Promise<void> {
    await expect(this.noWorkOrdersFoundText).toBeDisplayed();
    await expect(this.noTasksScheduledText).toBeDisplayed();
    await expect(this.reloadButton).toBeDisplayed();
  },
};
