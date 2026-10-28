import { execSync } from 'node:child_process';

export interface IosConnectivityState {
  wifiEnabled: boolean;
  interfaceName: string;
}

export type CommandExecutor = (command: string) => string;

function defaultExecutor(command: string): string {
  return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

export class IosConnectivityController {
  private initialState: IosConnectivityState | undefined;
  private readonly interfaceName: string;

  constructor(
    interfaceName?: string,
    private readonly execute: CommandExecutor = defaultExecutor,
  ) {
    this.interfaceName = interfaceName || this.detectWifiInterface();
  }

  private detectWifiInterface(): string {
    try {
      const output = this.execute('networksetup -listallhardwareports');
      const match = output.match(/Hardware Port:\s*Wi-Fi\s+Device:\s*(en\d+)/i);
      if (match && match[1]) {
        return match[1];
      }
    } catch {
      // Fallback to default macOS Wi-Fi interface
    }
    return 'en0';
  }

  captureState(): IosConnectivityState {
    let wifiEnabled = true;
    try {
      const output = this.execute(`networksetup -getairportpower ${this.interfaceName}`);
      wifiEnabled = /:\s*on/i.test(output);
    } catch {
      wifiEnabled = true;
    }
    return {
      wifiEnabled,
      interfaceName: this.interfaceName,
    };
  }

  disconnect(): IosConnectivityState {
    if (this.initialState) return this.initialState;
    this.initialState = this.captureState();

    try {
      this.execute(`networksetup -setairportpower ${this.interfaceName} off`);
      return this.initialState;
    } catch (error) {
      try {
        this.restore();
      } catch (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          'iOS connectivity could not be disabled or restored safely',
        );
      }
      throw error;
    }
  }

  restore(): void {
    const state = this.initialState;
    if (!state) return;

    try {
      this.execute(
        `networksetup -setairportpower ${this.interfaceName} ${state.wifiEnabled ? 'on' : 'off'}`,
      );
    } catch (error) {
      throw new Error(`Failed to restore Wi-Fi on ${this.interfaceName}: ${String(error)}`);
    } finally {
      this.initialState = undefined;
    }
  }

  get disconnected(): boolean {
    return Boolean(this.initialState);
  }
}

export const iosConnectivity = new IosConnectivityController();
