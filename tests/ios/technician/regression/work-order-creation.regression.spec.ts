import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosWorkOrderScreen } from '../../../../src/screens/ios/technician/work-order.screen.js';
import { technicianIosWorkOrderCreationScreen } from '../../../../src/screens/ios/technician/work-order-creation.screen.js';
import { expect, browser } from '@wdio/globals';

describe('Technician iOS Work Order Creation - Regression', () => {
  beforeEach(async () => {
    // Reset session for a clean test state before each test case
    await browser.reloadSession();

    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    if (!username || !password) {
      throw new Error('Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD');
    }

    // Step 1: Login with technician credentials
    await technicianIosLoginScreen.waitForDisplayed();
    await technicianIosLoginScreen.login(username, password);

    // Land on Home dashboard
    await technicianIosHomeScreen.waitForDisplayed();
  });

  // TC-14: Create Work Order (Manual Flow)
  it('TC-14 - Verify Manual Work Order Creation Screen', async () => {
    const assetName = 'Formula Asset with nfc';
    const woName = `Auto WO ${Date.now().toString().slice(-4)}`;

    // 1. Navigate to Open Work Orders
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    // 2. Click '+ Add' button to open Work Order creation screen
    await technicianIosWorkOrderScreen.tapAdd();
    await technicianIosWorkOrderCreationScreen.waitForDisplayed();

    // 3. Ensure Manual tab and Work Order sub-tab are active
    await technicianIosWorkOrderCreationScreen.switchToManual();
    await technicianIosWorkOrderCreationScreen.selectWorkOrderMode();

    // 4. In starting, first click on Create Work Order to verify required fields alert
    await technicianIosWorkOrderCreationScreen.tapCreateWorkOrder();
    await technicianIosWorkOrderCreationScreen.verifyRequiredFieldsAlert();

    // 5. Fill mandatory fields (search 'Formula Asset with nfc', 1st Type: Planned, 1st Priority: Normal, name, due date: next day)
    await technicianIosWorkOrderCreationScreen.fillWorkOrderMandatoryFields({
      asset: assetName,
      type: 'Planned',
      priority: 'Normal',
      name: woName,
    });

    // 6. Tap 'Create Work Order' - last assertion verifies 'Work order created!'
    await technicianIosWorkOrderCreationScreen.tapCreateWorkOrder();
    await technicianIosWorkOrderCreationScreen.verifyWorkOrderCreatedAlert();
  });

  // TC-15: Create Breakdown (Manual Flow)
  it('TC-15 - Verify Manual Breakdown Creation Screen', async () => {
    const assetName = 'Formula Asset with nfc';
    const bdName = `Auto BD ${Date.now().toString().slice(-4)}`;

    // 1. Navigate to Open Work Orders
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    // 2. Click '+ Add' button to open Work Order creation screen
    await technicianIosWorkOrderScreen.tapAdd();
    await technicianIosWorkOrderCreationScreen.waitForDisplayed();

    // 3. Switch to Breakdown sub-tab under Manual
    await technicianIosWorkOrderCreationScreen.switchToManual();
    await technicianIosWorkOrderCreationScreen.selectBreakdownMode();

    // 4. In starting, first click on Create Breakdown to verify required fields alert
    await technicianIosWorkOrderCreationScreen.tapCreateBreakdown();
    await technicianIosWorkOrderCreationScreen.verifyRequiredFieldsAlert();

    // 5. Fill mandatory fields (Asset: 'Formula Asset with nfc', 1st Type: Planned, 1st Priority: Normal, Name, Due date: next day, Breakdown hours: '2')
    await technicianIosWorkOrderCreationScreen.fillBreakdownMandatoryFields({
      asset: assetName,
      type: 'Planned',
      priority: 'Normal',
      name: bdName,
      hours: '2',
    });

    // 6. Tap 'Create Breakdown' - last assertion verifies 'Breakdown created!'
    await technicianIosWorkOrderCreationScreen.tapCreateBreakdown();
    await technicianIosWorkOrderCreationScreen.verifyBreakdownCreatedAlert();
  });

  // TC-16: Work Order from Template
  it('TC-16 - Verify Work Order Template Selection', async () => {
    // 1. Navigate to Open Work Orders
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    // 2. Click '+ Add' button to open Work Order creation screen
    await technicianIosWorkOrderScreen.tapAdd();
    await technicianIosWorkOrderCreationScreen.waitForDisplayed();

    // 3. Switch to Templates tab
    await technicianIosWorkOrderCreationScreen.switchToTemplates();

    // 4. Click on template card and confirm popup
    await technicianIosWorkOrderCreationScreen.clickTemplate();
    await technicianIosWorkOrderCreationScreen.verifyTemplateConfirmationAlert();
  });
});
