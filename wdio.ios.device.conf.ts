import 'dotenv/config';
import { config as baseConfig } from './wdio.ios.conf.js';

// Enable devicectl device discovery for Device Hub-connected physical devices
process.env.APPIUM_XCUITEST_PREFER_DEVICECTL = 'true';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:udid':
        process.env.IOS_PHYSICAL_UDID ||
        process.env.IOS_UDID,
      'appium:deviceName': 'iPhone',
      'appium:platformVersion': '27.0.1',
      'appium:bundleId':
        process.env.IOS_BUNDLE_ID || 'com.sumasamu.isocietyManagerAdmin',
      'appium:xcodeOrgId': process.env.IOS_XCODE_ORG_ID,
      'appium:xcodeSigningId':
        process.env.IOS_XCODE_SIGNING_ID,
      'appium:updatedWDABundleId':
        process.env.IOS_WDA_BUNDLE_ID,
      'appium:noReset': true,
      'appium:newCommandTimeout': 240,
      'appium:wdaLaunchTimeout': 120_000,
      'appium:wdaStartupRetries': 4,
    },
  ],
};
