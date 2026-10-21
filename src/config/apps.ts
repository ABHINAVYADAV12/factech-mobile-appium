export type AppTarget = 'resident' | 'technician';

export interface AppProfile {
  target: AppTarget;
  displayName: string;
  installedPackageName: string;
  e2ePackageName: string;
  activityName: string;
  usernameVariable: 'RESIDENT_USERNAME' | 'TECHNICIAN_USERNAME';
  passwordVariable: 'RESIDENT_PASSWORD' | 'TECHNICIAN_PASSWORD';
}

export const APP_PROFILES: Record<AppTarget, AppProfile> = {
  resident: {
    target: 'resident',
    displayName: 'iSocietyManager Resident',
    installedPackageName: 'com.sumasamu.iSocietyManager',
    e2ePackageName: 'com.sumasamu.iSocietyManager.e2e',
    activityName: 'com.sumasamu.iSocietyManager.MainActivity',
    usernameVariable: 'RESIDENT_USERNAME',
    passwordVariable: 'RESIDENT_PASSWORD',
  },
  technician: {
    target: 'technician',
    displayName: 'Facility Manager Technician E2E',
    installedPackageName: 'com.sumasamu.isocietyManagerAdmin',
    e2ePackageName: 'com.sumasamu.isocietyManagerAdmin.e2e',
    activityName: 'com.sumasamu.isocietyManagerAdmin.MainActivity',
    usernameVariable: 'TECHNICIAN_USERNAME',
    passwordVariable: 'TECHNICIAN_PASSWORD',
  },
};
