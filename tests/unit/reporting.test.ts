import assert from 'node:assert/strict';
import test from 'node:test';

import { failureArtifactPolicy } from '../../src/reporting/artifacts.js';

test('captures screenshots only for production failures', () => {
  assert.equal(failureArtifactPolicy('production'), 'screenshot-only');
  assert.equal(failureArtifactPolicy('test'), 'full');
});
