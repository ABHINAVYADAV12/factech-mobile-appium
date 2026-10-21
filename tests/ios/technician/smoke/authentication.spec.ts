import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';

describe('Technician iOS smoke', () => {
  beforeEach(async () => {
    await browser.reloadSession();
  });

  it('rejects invalid credentials', async () => {
    await technicianIosLoginScreen.waitForDisplayed();

    await technicianIosLoginScreen.login(
      process.env.INVALID_LOGIN_IDENTITY || 'invalid@example.com',
      'DefinitelyNotAValidPassword!',
    );

    await technicianIosLoginScreen.expectRejected();
  });

  it('logs in with valid credentials', async () => {
    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    if (!username || !password) {
      throw new Error(
        'Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD',
      );
    }

    await technicianIosLoginScreen.waitForDisplayed();

    await technicianIosLoginScreen.login(username, password);

await browser.pause(5000);

    console.log(await browser.getPageSource());
  });
});