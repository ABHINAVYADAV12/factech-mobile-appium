import assert from 'node:assert/strict';
import test from 'node:test';

import { SOURCE_CASES, sourceCase } from '../../src/traceability/catalog.js';
import { validateSourceCases } from '../../src/traceability/validation.js';

test('source case identifiers are unique', () => {
  assert.equal(
    new Set(SOURCE_CASES.map((record) => record.sourceCaseId)).size,
    SOURCE_CASES.length,
  );
});

test('automated cases use the expected mutation lane and no invented canonical mapping', () => {
  for (const record of SOURCE_CASES.filter((candidate) =>
    candidate.status.startsWith('automated'),
  )) {
    assert.equal(
      record.mutation,
      record.status === 'automated-production-regression' ? 'data-changing' : 'read-only',
    );
    assert.equal(record.canonicalFeatureCode, null);
  }
});

test('resolves a known source case deterministically', () => {
  assert.equal(sourceCase('TEC_SK002').title, 'Scan Asset QR');
});

test('keeps Resident password login partial until the OTP fixture exists', () => {
  const login = sourceCase('ISM_SK001');
  assert.equal(login.automationCoverage, 'partial');
  assert.deepEqual(login.blockers, ['otp-fixture']);
});

test('keeps Technician password login partial until the OTP fixture exists', () => {
  const login = sourceCase('TEC_SK001');
  assert.equal(login.automationCoverage, 'partial');
  assert.deepEqual(login.blockers, ['otp-fixture']);
});

test('records emulator evidence for offline fetch and sync without promoting offline creation', () => {
  for (const id of ['TEC_SK005', 'TEC_SK008'] as const) {
    const record = sourceCase(id);
    assert.equal(record.deviceRequirement, 'either');
    assert.equal(record.automationCoverage, 'complete');
  }
  const offlineCreation = sourceCase('TEC_SK006');
  assert.equal(offlineCreation.automationCoverage, 'none');
  assert.deepEqual(offlineCreation.blockers, ['offline-creation-unsupported']);
});

test('validates the checked-in source-case automation evidence', () => {
  assert.doesNotThrow(() => validateSourceCases(SOURCE_CASES));
});

test('rejects complete automation without executable evidence', () => {
  const record = sourceCase('TEC_SK001');
  assert.throws(
    () => validateSourceCases([{ ...record, automationReferences: [] }]),
    /lacks evidence/,
  );
});

test('rejects partial automation without a blocker', () => {
  const record = sourceCase('ISM_SK001');
  assert.throws(() => validateSourceCases([{ ...record, blockers: [] }]), /must retain a blocker/);
});

test('rejects a data-changing case outside production regression', () => {
  const record = sourceCase('ISM_SK002');
  assert.throws(
    () => validateSourceCases([{ ...record, executionLane: 'smoke' }]),
    /must use production-regression/,
  );
});

test('rejects physical automation without a physical execution route', () => {
  const record = sourceCase('TEC_SK002');
  assert.throws(
    () => validateSourceCases([{ ...record, executionLane: 'smoke' }]),
    /lacks a physical execution route/,
  );
});
