import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';

describe('Technician iOS home smoke', () => {
  beforeEach(async () => {
    await browser.reloadSession();

    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    if (!username || !password) {
      throw new Error(
        'Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD',
      );
    }
    await technicianIosLoginScreen.waitForDisplayed();
    await technicianIosLoginScreen.login(username, password);
  });

  it('displays the technician home screen', async () => {
    await technicianIosHomeScreen.waitForDisplayed();
    await technicianIosHomeScreen.expectTechnicianName();
    await technicianIosHomeScreen.expectQuickAccess();
  });
});