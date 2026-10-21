import type { RuntimeConfig } from '../config/runtime.js';
import { requireCredentials } from '../config/runtime.js';
import { residentHomeScreen } from '../screens/resident/home.screen.js';
import { residentLoginScreen } from '../screens/resident/login.screen.js';
import { technicianHomeScreen } from '../screens/technician/home.screen.js';
import { technicianLoginScreen } from '../screens/technician/login.screen.js';

export async function authenticateResident(config: RuntimeConfig): Promise<void> {
  const credentials = requireCredentials(config);
  await residentLoginScreen.waitForDisplayed();
  await residentLoginScreen.login(
    credentials.username,
    credentials.password,
    credentials.accountUnit,
  );
  await residentHomeScreen.waitForDisplayed();
}

export async function authenticateTechnician(config: RuntimeConfig): Promise<void> {
  const credentials = requireCredentials(config);
  await technicianLoginScreen.waitForDisplayed();
  await technicianLoginScreen.login(credentials.username, credentials.password);
  await technicianHomeScreen.waitForDisplayed();
}
