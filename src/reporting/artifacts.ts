import allureReporter from '@wdio/allure-reporter';
import { browser } from '@wdio/globals';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { adb } from '../config/android-tools.js';
import type { RuntimeConfig } from '../config/runtime.js';

function safeName(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function failureArtifactPolicy(
  appEnvironment: RuntimeConfig['appEnvironment'],
): 'screenshot-only' | 'full' {
  return appEnvironment === 'production' ? 'screenshot-only' : 'full';
}

export function redact(text: string): string {
  return text
    .replace(
      /(api[-_ ]?token|authorization|password|ism-auth)(["':=\s]+)[^\s,"'}]+/gi,
      '$1$2[REDACTED]',
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]');
}

export async function captureFailureArtifacts(
  config: RuntimeConfig,
  testTitle: string,
): Promise<void> {
  const directory = resolve('artifacts', 'failures', safeName(testTitle));
  mkdirSync(directory, { recursive: true });

  try {
    const screenshotPath = resolve(directory, 'screenshot.png');
    await browser.saveScreenshot(screenshotPath);
    allureReporter.addAttachment(
      'Failure screenshot',
      Buffer.from(await browser.takeScreenshot(), 'base64'),
      'image/png',
    );
  } catch (error) {
    writeFileSync(resolve(directory, 'screenshot-error.txt'), String(error));
  }

  try {
    const source = redact(await browser.getPageSource());
    writeFileSync(resolve(directory, 'page-source.xml'), source);
    allureReporter.addAttachment('Page source', source, 'application/xml');
  } catch (error) {
    writeFileSync(resolve(directory, 'page-source-error.txt'), String(error));
  }

  try {
    const logcat = redact(adb(config.androidUdid, ['logcat', '-d', '-t', '500']));
    writeFileSync(resolve(directory, 'logcat.txt'), logcat);
    allureReporter.addAttachment('Bounded logcat', logcat, 'text/plain');
  } catch (error) {
    writeFileSync(resolve(directory, 'logcat-error.txt'), String(error));
  }

  try {
    const deviceInfo = [
      `model=${adb(config.androidUdid, ['shell', 'getprop', 'ro.product.model'])}`,
      `android=${adb(config.androidUdid, ['shell', 'getprop', 'ro.build.version.release'])}`,
      `sdk=${adb(config.androidUdid, ['shell', 'getprop', 'ro.build.version.sdk'])}`,
      `target=${config.deviceTarget}`,
      `app=${config.packageName}`,
      `appSource=${config.appSource}`,
    ].join('\n');
    writeFileSync(resolve(directory, 'device-info.txt'), deviceInfo);
    allureReporter.addAttachment('Device information', deviceInfo, 'text/plain');
  } catch (error) {
    writeFileSync(resolve(directory, 'device-info-error.txt'), String(error));
  }
}

export async function captureProductionFailureScreenshot(testTitle: string): Promise<void> {
  const directory = resolve('artifacts', 'failures', safeName(testTitle));
  mkdirSync(directory, { recursive: true });
  try {
    const screenshotPath = resolve(directory, 'screenshot.png');
    await browser.saveScreenshot(screenshotPath);
    allureReporter.addAttachment(
      'Failure screenshot',
      Buffer.from(await browser.takeScreenshot(), 'base64'),
      'image/png',
    );
  } catch (error) {
    writeFileSync(resolve(directory, 'screenshot-error.txt'), String(error));
  }
}
