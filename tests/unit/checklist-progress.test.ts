import assert from 'node:assert/strict';
import test from 'node:test';

import { parseChecklistProgress } from '../../src/screens/technician/checklist-progress.js';

test('parses partial and complete checklist progress', () => {
  assert.deepEqual(parseChecklistProgress('7/11 (64%)'), { completed: 7, total: 11 });
  assert.deepEqual(parseChecklistProgress('11/11 (100%)'), { completed: 11, total: 11 });
});

test('rejects malformed or impossible checklist progress', () => {
  assert.equal(parseChecklistProgress('7 of 11'), undefined);
  assert.equal(parseChecklistProgress('12/11 (109%)'), undefined);
});
