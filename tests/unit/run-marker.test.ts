import assert from 'node:assert/strict';
import test from 'node:test';

import { createRunMarker, createVehicleRegistration } from '../../src/fixtures/run-marker.js';

test('creates a deterministic source-case marker from the supplied timestamp', () => {
  assert.equal(createRunMarker('ISM_SK012', 1_725_000_000_123), 'ISM_SK012-1725000000123');
});

test('creates a valid deterministic vehicle registration', () => {
  assert.equal(createVehicleRegistration(12_345), 'DL01AA0012');
});

test('rejects invalid marker timestamps', () => {
  assert.throws(() => createRunMarker('ISM_SK002', -1), /Invalid marker timestamp/);
});
