import assert from 'node:assert/strict';
import test from 'node:test';

import { findPlayStoreAction, playStoreNeedsUserSignIn } from '../../src/config/play-store-ui.js';

test('finds a Play Store action by its human-readable label', () => {
  const xml = `<?xml version="1.0"?><hierarchy><node text="" bounds="[0,0][100,100]"/><node text="Install" clickable="true" bounds="[100,200][300,280]"/></hierarchy>`;
  assert.deepEqual(findPlayStoreAction(xml), { name: 'Install', x: 200, y: 240 });
});

test('supports content descriptions and detects sign-in requirements', () => {
  const xml = `<hierarchy><node content-desc="Update" bounds="[20,40][220,120]"/><node text="Sign in to continue" bounds="[0,0][1,1]"/></hierarchy>`;
  assert.deepEqual(findPlayStoreAction(xml), { name: 'Update', x: 120, y: 80 });
  assert.equal(playStoreNeedsUserSignIn(xml), true);
});
