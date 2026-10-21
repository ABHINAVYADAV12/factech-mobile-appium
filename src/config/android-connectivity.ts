import { adb } from './android-tools.js';

export interface AndroidConnectivityState {
  wifiEnabled: boolean;
  mobileDataEnabled: boolean;
}

export type AdbExecutor = (udid: string, args: string[]) => string;

function enabledSetting(value: string, setting: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'enabled' || normalized === 'true') return true;
  if (normalized === '0' || normalized === 'disabled' || normalized === 'false') return false;
  throw new Error(`Unable to determine Android ${setting} state: ${value || '<empty>'}`);
}

export class AndroidConnectivityController {
  private initialState: AndroidConnectivityState | undefined;

  constructor(
    private readonly udid: string,
    private readonly execute: AdbExecutor = adb,
  ) {}

  captureState(): AndroidConnectivityState {
    return {
      wifiEnabled: enabledSetting(
        this.execute(this.udid, ['shell', 'settings', 'get', 'global', 'wifi_on']),
        'Wi-Fi',
      ),
      mobileDataEnabled: enabledSetting(
        this.execute(this.udid, ['shell', 'settings', 'get', 'global', 'mobile_data']),
        'mobile-data',
      ),
    };
  }

  disconnect(): AndroidConnectivityState {
    if (this.initialState) return this.initialState;
    this.initialState = this.captureState();

    try {
      this.execute(this.udid, ['shell', 'svc', 'wifi', 'disable']);
      this.execute(this.udid, ['shell', 'svc', 'data', 'disable']);
      return this.initialState;
    } catch (error) {
      try {
        this.restore();
      } catch (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          'Android connectivity could not be disabled or restored safely',
        );
      }
      throw error;
    }
  }

  restore(): void {
    const state = this.initialState;
    if (!state) return;

    const errors: unknown[] = [];
    try {
      this.execute(this.udid, ['shell', 'svc', 'wifi', state.wifiEnabled ? 'enable' : 'disable']);
    } catch (error) {
      errors.push(error);
    }
    try {
      this.execute(this.udid, [
        'shell',
        'svc',
        'data',
        state.mobileDataEnabled ? 'enable' : 'disable',
      ]);
    } catch (error) {
      errors.push(error);
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Android connectivity was not fully restored');
    }
    this.initialState = undefined;
  }

  get disconnected(): boolean {
    return Boolean(this.initialState);
  }
}
