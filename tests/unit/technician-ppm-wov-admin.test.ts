import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hasModuleRead, setModuleRead } from '../../scripts/technician-ppm-wov-admin.js';

describe('Technician PPM_WOV admin gate', () => {
  it('turns read on without changing unrelated permissions or module rights', () => {
    const result = setModuleRead({ 'MOD.COM.R': 1, 'PPM_WOV.CU': 1 }, true);
    assert.deepEqual(result, { 'MOD.COM.R': 1, 'PPM_WOV.RCU': 1 });
    assert.equal(hasModuleRead(result), true);
  });

  it('turns read off while preserving the remaining PPM_WOV rights', () => {
    const result = setModuleRead({ 'MOD.COM.R': 1, 'PPM_WOV.RCUD': 1 }, false);
    assert.deepEqual(result, { 'MOD.COM.R': 1, 'PPM_WOV.CUD': 1 });
    assert.equal(hasModuleRead(result), false);
  });

  it('removes an empty PPM_WOV entry when read was its only right', () => {
    assert.deepEqual(setModuleRead({ 'PPM_WOV.R': 1 }, false), {});
  });
});
