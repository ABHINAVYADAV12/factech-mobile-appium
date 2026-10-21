import assert from 'node:assert/strict';
import test from 'node:test';

import { isWirelessAdbUdid } from '../../src/config/android-device.js';

test('distinguishes USB serials from wireless ADB endpoints', () => {
  assert.equal(isWirelessAdbUdid('USB123456'), false);
  assert.equal(isWirelessAdbUdid('emulator-5554'), false);
  assert.equal(isWirelessAdbUdid('192.0.2.10:37123'), true);
  assert.equal(isWirelessAdbUdid('adb-USB123456-token._adb-tls-connect._tcp'), true);
});
