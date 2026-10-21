import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AndroidConnectivityController,
  type AdbExecutor,
} from '../../src/config/android-connectivity.js';

function fakeAdb(calls: string[][], options: { failOn?: string } = {}): AdbExecutor {
  return (_udid, args) => {
    calls.push(args);
    const command = args.join(' ');
    if (command === options.failOn) throw new Error(`failed: ${command}`);
    if (command.endsWith('settings get global wifi_on')) return '1';
    if (command.endsWith('settings get global mobile_data')) return '0';
    return '';
  };
}

test('restores the original connectivity state after a successful disconnect', () => {
  const calls: string[][] = [];
  const controller = new AndroidConnectivityController('USB123', fakeAdb(calls));

  controller.disconnect();
  controller.restore();

  assert.deepEqual(calls.slice(-2), [
    ['shell', 'svc', 'wifi', 'enable'],
    ['shell', 'svc', 'data', 'disable'],
  ]);
  assert.equal(controller.disconnected, false);
});

test('rolls back Wi-Fi when mobile-data disable fails', () => {
  const calls: string[][] = [];
  const controller = new AndroidConnectivityController(
    'USB123',
    fakeAdb(calls, { failOn: 'shell svc data disable' }),
  );

  assert.throws(() => controller.disconnect(), /could not be disabled or restored safely/);
  assert.ok(calls.some((args) => args.join(' ') === 'shell svc wifi enable'));
});

test('restoration is safe after a test assertion failure', () => {
  const calls: string[][] = [];
  const controller = new AndroidConnectivityController('USB123', fakeAdb(calls));

  assert.throws(() => {
    try {
      controller.disconnect();
      assert.fail('simulated assertion failure');
    } finally {
      controller.restore();
    }
  }, /simulated assertion failure/);
  assert.equal(controller.disconnected, false);
});

test('restoration is safe after a timeout-like failure', () => {
  const calls: string[][] = [];
  const controller = new AndroidConnectivityController('USB123', fakeAdb(calls));

  assert.throws(() => {
    try {
      controller.disconnect();
      throw new Error('offline state timeout');
    } finally {
      controller.restore();
    }
  }, /offline state timeout/);
  assert.equal(controller.disconnected, false);
});
