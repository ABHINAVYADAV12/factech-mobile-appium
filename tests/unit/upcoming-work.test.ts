import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dueDateIsWithinRange,
  parseUpcomingDueDate,
} from '../../src/screens/technician/upcoming-work.js';

test('parses the live Technician upcoming due-date label', () => {
  assert.equal(parseUpcomingDueDate('Due: 28 Aug 2026')?.getDate(), 28);
  assert.equal(parseUpcomingDueDate('28 Aug 2026'), undefined);
});

test('validates upcoming due dates against the selected inclusive date range', () => {
  const from = new Date(2026, 7, 28);
  const to = new Date(2026, 7, 29);
  assert.equal(dueDateIsWithinRange('Due: 28 Aug 2026', from, to), true);
  assert.equal(dueDateIsWithinRange('Due: 30 Aug 2026', from, to), false);
});
