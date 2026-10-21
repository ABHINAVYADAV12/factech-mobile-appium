export type SourceCaseId = `ISM_SK${string}` | `TEC_SK${string}`;
export type CatalogStatus =
  | 'automated-partial'
  | 'automated-observe'
  | 'automated-hardware-observe'
  | 'automated-production-regression'
  | 'planned-read-only'
  | 'blocked-mutation'
  | 'blocked-external'
  | 'blocked-hardware';

export type AutomationCoverage = 'none' | 'partial' | 'complete';
export type AutomationBlocker =
  | 'otp-fixture'
  | 'product-testids'
  | 'playstore-release'
  | 'cab-marker-fixture'
  | 'vehicle-cleanup-route'
  | 'mutation-approval'
  | 'cross-system-fixture'
  | 'physical-device'
  | 'asset-qr-fixture'
  | 'upcoming-work-fixture'
  | 'offline-creation-unsupported'
  | 'nfc-fixture'
  | 'push-notification-fixture'
  | 'ivr-fixture'
  | 'staff-event-fixture'
  | 'panic-fixture'
  | 'payment-fixture';
export type ExecutionLane =
  'smoke' | 'regression' | 'hardware' | 'production-smoke' | 'production-regression';

export interface SourceCase {
  sourceCaseId: SourceCaseId;
  title: string;
  sourceUrl: string;
  sourcePageVersion: number;
  application: 'resident' | 'technician';
  sourceFeatureLabel: string;
  canonicalFeatureCode: null;
  mappingStatus: 'Pending registry validation';
  deviceRequirement: 'emulator' | 'physical' | 'either';
  mutation: 'read-only' | 'data-changing';
  status: CatalogStatus;
  automationCoverage: AutomationCoverage;
  blockers: AutomationBlocker[];
  automationReferences: string[];
  executionLane: ExecutionLane | null;
}

type SourceCaseDefinition = Omit<
  SourceCase,
  'automationCoverage' | 'blockers' | 'automationReferences' | 'executionLane'
>;

const residentSource =
  'https://isocietymanager.atlassian.net/wiki/spaces/T/pages/734265345/ISM+App+Smoke';
const technicianSource =
  'https://isocietymanager.atlassian.net/wiki/spaces/T/pages/732528655/Technician+App+Smoke';

const SOURCE_CASE_DEFINITIONS: SourceCaseDefinition[] = [
  {
    sourceCaseId: 'ISM_SK001',
    title: 'Login with Valid Credentials',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'LOGIN',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'read-only',
    status: 'automated-partial',
  },
  {
    sourceCaseId: 'ISM_SK002',
    title: 'Create Single Passes',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'PASS_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'blocked-mutation',
  },
  {
    sourceCaseId: 'ISM_SK003',
    title: 'Create Multi/Recurring Passes',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'PASS_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'blocked-mutation',
  },
  {
    sourceCaseId: 'ISM_SK004',
    title: 'Accept Visit (Full Screen)',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'VISITOR_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'data-changing',
    status: 'blocked-external',
  },
  {
    sourceCaseId: 'ISM_SK005',
    title: 'Accept Visit (In-App)',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'VISITOR_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'blocked-mutation',
  },
  {
    sourceCaseId: 'ISM_SK006',
    title: 'Accept Visit (IVR)',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'VISITOR_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'data-changing',
    status: 'blocked-external',
  },
  {
    sourceCaseId: 'ISM_SK007',
    title: 'Add Family Member',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'PROFILE',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'blocked-mutation',
  },
  {
    sourceCaseId: 'ISM_SK008',
    title: 'Domestic Staff Management',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'STAFF_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'data-changing',
    status: 'blocked-external',
  },
  {
    sourceCaseId: 'ISM_SK009',
    title: 'Add Vehicle',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'VEHICLE_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'blocked-mutation',
  },
  {
    sourceCaseId: 'ISM_SK010',
    title: 'Trigger Panic Alert',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'SAFETY',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'data-changing',
    status: 'blocked-external',
  },
  {
    sourceCaseId: 'ISM_SK011',
    title: 'App Settings Verification',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'SETTINGS',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'blocked-mutation',
  },
  {
    sourceCaseId: 'ISM_SK012',
    title: 'Complaints',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'COMPLAINTS',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'blocked-mutation',
  },
  {
    sourceCaseId: 'ISM_SK013',
    title: 'Payments',
    sourceUrl: residentSource,
    sourcePageVersion: 5,
    application: 'resident',
    sourceFeatureLabel: 'PAYMENTS',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'data-changing',
    status: 'blocked-external',
  },
  {
    sourceCaseId: 'TEC_SK001',
    title: 'Login with Valid Credentials',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'LOGIN',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'read-only',
    status: 'automated-partial',
  },
  {
    sourceCaseId: 'TEC_SK002',
    title: 'Scan Asset QR',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'ASSET_SCAN',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'read-only',
    status: 'automated-hardware-observe',
  },
  {
    sourceCaseId: 'TEC_SK003',
    title: 'WO/HK/LB Creation',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'TASK_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'automated-production-regression',
  },
  {
    sourceCaseId: 'TEC_SK004',
    title: 'WO/HK/LB Completion',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'TASK_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'data-changing',
    status: 'automated-production-regression',
  },
  {
    sourceCaseId: 'TEC_SK005',
    title: 'Fetch Offline Sync Data',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'OFFLINE_SYNC',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'read-only',
    status: 'automated-observe',
  },
  {
    sourceCaseId: 'TEC_SK006',
    title: 'Offline Mode Execution',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'OFFLINE_SYNC',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'data-changing',
    status: 'blocked-external',
  },
  {
    sourceCaseId: 'TEC_SK007',
    title: 'Upcoming Work Orders',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'TASK_MGMT',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'read-only',
    status: 'automated-partial',
  },
  {
    sourceCaseId: 'TEC_SK008',
    title: 'Offline Sync Status Verification',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'OFFLINE_SYNC',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'either',
    mutation: 'read-only',
    status: 'automated-observe',
  },
  {
    sourceCaseId: 'TEC_SK009',
    title: 'NFC Asset Scan',
    sourceUrl: technicianSource,
    sourcePageVersion: 6,
    application: 'technician',
    sourceFeatureLabel: 'ASSET_SCAN',
    canonicalFeatureCode: null,
    mappingStatus: 'Pending registry validation',
    deviceRequirement: 'physical',
    mutation: 'data-changing',
    status: 'blocked-hardware',
  },
];

type AutomationMetadata = Pick<
  SourceCase,
  'automationCoverage' | 'blockers' | 'automationReferences' | 'executionLane'
>;

const residentProductionRegressionReference =
  'tests/resident/production-regression/resident-mutations.spec.ts';

const AUTOMATION_METADATA: Partial<Record<SourceCaseId, AutomationMetadata>> = {
  ISM_SK001: {
    automationCoverage: 'partial',
    blockers: ['otp-fixture'],
    automationReferences: ['tests/resident/smoke/authentication.spec.ts'],
    executionLane: 'smoke',
  },
  ISM_SK002: {
    automationCoverage: 'partial',
    blockers: ['product-testids', 'playstore-release', 'cab-marker-fixture', 'mutation-approval'],
    automationReferences: [residentProductionRegressionReference],
    executionLane: 'production-regression',
  },
  ISM_SK003: {
    automationCoverage: 'none',
    blockers: ['product-testids', 'cross-system-fixture', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  ISM_SK004: {
    automationCoverage: 'none',
    blockers: ['physical-device', 'push-notification-fixture', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  ISM_SK005: {
    automationCoverage: 'none',
    blockers: ['product-testids', 'cross-system-fixture', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  ISM_SK006: {
    automationCoverage: 'none',
    blockers: ['physical-device', 'ivr-fixture', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  ISM_SK007: {
    automationCoverage: 'partial',
    blockers: ['product-testids', 'playstore-release', 'mutation-approval'],
    automationReferences: [residentProductionRegressionReference],
    executionLane: 'production-regression',
  },
  ISM_SK008: {
    automationCoverage: 'none',
    blockers: ['physical-device', 'staff-event-fixture', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  ISM_SK009: {
    automationCoverage: 'none',
    blockers: ['product-testids', 'vehicle-cleanup-route', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  ISM_SK010: {
    automationCoverage: 'none',
    blockers: ['physical-device', 'panic-fixture', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  ISM_SK011: {
    automationCoverage: 'partial',
    blockers: ['product-testids', 'playstore-release', 'mutation-approval'],
    automationReferences: [residentProductionRegressionReference],
    executionLane: 'production-regression',
  },
  ISM_SK012: {
    automationCoverage: 'partial',
    blockers: ['product-testids', 'playstore-release', 'mutation-approval'],
    automationReferences: [residentProductionRegressionReference],
    executionLane: 'production-regression',
  },
  ISM_SK013: {
    automationCoverage: 'none',
    blockers: ['physical-device', 'payment-fixture', 'mutation-approval'],
    automationReferences: [],
    executionLane: null,
  },
  TEC_SK001: {
    automationCoverage: 'partial',
    blockers: ['otp-fixture'],
    automationReferences: ['tests/technician/smoke/authentication.spec.ts'],
    executionLane: 'smoke',
  },
  TEC_SK002: {
    automationCoverage: 'partial',
    blockers: ['asset-qr-fixture'],
    automationReferences: ['tests/technician/hardware/asset-qr.spec.ts'],
    executionLane: 'hardware',
  },
  TEC_SK003: {
    automationCoverage: 'complete',
    blockers: [],
    automationReferences: ['tests/technician/production-regression/work-order-creation.spec.ts'],
    executionLane: 'production-regression',
  },
  TEC_SK004: {
    automationCoverage: 'complete',
    blockers: [],
    automationReferences: ['tests/technician/production-regression/work-order-creation.spec.ts'],
    executionLane: 'production-regression',
  },
  TEC_SK005: {
    automationCoverage: 'complete',
    blockers: [],
    automationReferences: ['tests/technician/production-regression/offline-completion.spec.ts'],
    executionLane: 'production-regression',
  },
  TEC_SK007: {
    automationCoverage: 'partial',
    blockers: ['upcoming-work-fixture'],
    automationReferences: ['tests/technician/production-smoke/launch.spec.ts'],
    executionLane: 'production-smoke',
  },
  TEC_SK008: {
    automationCoverage: 'complete',
    blockers: [],
    automationReferences: ['tests/technician/production-regression/offline-completion.spec.ts'],
    executionLane: 'production-regression',
  },
  TEC_SK006: {
    automationCoverage: 'none',
    blockers: ['offline-creation-unsupported'],
    automationReferences: [],
    executionLane: null,
  },
  TEC_SK009: {
    automationCoverage: 'none',
    blockers: ['physical-device', 'nfc-fixture'],
    automationReferences: [],
    executionLane: null,
  },
};

function defaultAutomationMetadata(record: SourceCaseDefinition): AutomationMetadata {
  return {
    automationCoverage: 'none',
    blockers:
      record.status === 'blocked-hardware'
        ? ['physical-device']
        : record.mutation === 'data-changing'
          ? ['mutation-approval']
          : [],
    automationReferences: [],
    executionLane: null,
  };
}

export const SOURCE_CASES: SourceCase[] = SOURCE_CASE_DEFINITIONS.map((record) => ({
  ...record,
  ...(AUTOMATION_METADATA[record.sourceCaseId] ?? defaultAutomationMetadata(record)),
}));

export function sourceCase(sourceCaseId: SourceCaseId): SourceCase {
  const record = SOURCE_CASES.find((candidate) => candidate.sourceCaseId === sourceCaseId);
  if (!record) throw new Error(`Unknown source case: ${sourceCaseId}`);
  return record;
}
