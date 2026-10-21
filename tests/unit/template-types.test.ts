import assert from 'node:assert/strict';
import test from 'node:test';

import {
  recordStatusDescription,
  resolveCreatedTemplateSequence,
  sequenceMatchesTemplateType,
} from '../../src/screens/technician/template-types.js';

test('standard PM fixture discovery excludes breakdown sequences', () => {
  assert.equal(sequenceMatchesTemplateType('WO-123', 'PM'), true);
  assert.equal(sequenceMatchesTemplateType('BR-123', 'PM'), false);
});

test('created fixture discovery accepts exactly one new sequence of the requested type', () => {
  assert.equal(
    resolveCreatedTemplateSequence(new Set(['WO-100', 'BR-999']), ['WO-100', 'WO-101'], 'PM'),
    'WO-101',
  );
});

test('created fixture discovery rejects missing or ambiguous sequence identity', () => {
  assert.throws(
    () => resolveCreatedTemplateSequence(new Set(['WO-100']), ['WO-100', 'BR-101'], 'PM'),
    /found 0: none/,
  );
  assert.throws(
    () => resolveCreatedTemplateSequence(new Set(['WO-100']), ['WO-100', 'WO-101', 'WO-102'], 'PM'),
    /found 2: WO-101, WO-102/,
  );
});

test('fixture discovery keeps Housekeeping and Logbook sequences distinct', () => {
  assert.equal(sequenceMatchesTemplateType('HK-123', 'HK'), true);
  assert.equal(sequenceMatchesTemplateType('LB-123', 'LB'), true);
  assert.equal(sequenceMatchesTemplateType('LB-123', 'HK'), false);
});

test('record verification scopes an exact sequence to its requested lifecycle status', () => {
  assert.equal(recordStatusDescription('WO-30040', 'OPEN'), 'WO-30040, OPEN,');
  assert.equal(recordStatusDescription('WO-30040', 'COMPLETED'), 'WO-30040, COMPLETED,');
  assert.notEqual(
    recordStatusDescription('WO-30040', 'OPEN'),
    recordStatusDescription('WO-30040', 'COMPLETED'),
  );
});
