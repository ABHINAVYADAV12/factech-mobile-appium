import allureReporter from '@wdio/allure-reporter';

import type { SourceCase } from './catalog.js';
import type { ResidentAccountCohort } from '../config/runtime.js';

type AsyncTest = () => Promise<void>;
type Mutation = 'read-only' | 'data-changing';

interface InternalTestOptions {
  deviceRequirement?: 'emulator' | 'physical' | 'either';
  mutation?: Mutation;
}

interface SourceTestOptions {
  accountCohort?: ResidentAccountCohort;
}

function assertMutationAuthorized(mutation: Mutation): void {
  if (
    mutation === 'data-changing' &&
    (process.env.ALLOW_MUTATIONS !== 'true' ||
      process.env.APP_ENV !== 'production' ||
      process.env.TEST_LANE !== 'production-regression' ||
      process.env.PRODUCTION_TEST_ACCOUNT_CONFIRMED !== 'true')
  ) {
    throw new Error(
      'Data-changing test requires the approved production-regression lane and ALLOW_MUTATIONS=true',
    );
  }
}

function addCommonLabels(application: string, device: string, mutation: Mutation): void {
  allureReporter.addLabel('application', application);
  allureReporter.addLabel(
    'environment',
    process.env.APP_ENV === 'production' ? 'production' : 'test',
  );
  allureReporter.addLabel('deviceRequirement', device);
  allureReporter.addLabel('lane', 'observe');
  allureReporter.addLabel('executionLane', process.env.TEST_LANE ?? 'unspecified');
  allureReporter.addLabel('mutation', mutation);
}

export function sourceIt(
  testCase: SourceCase,
  test: AsyncTest,
  options: SourceTestOptions = {},
): void {
  const cohortSuffix = options.accountCohort ? ` [${options.accountCohort}-account]` : '';
  it(`[${testCase.sourceCaseId}] ${testCase.title}${cohortSuffix} @observe`, async () => {
    assertMutationAuthorized(testCase.mutation);
    allureReporter.addLabel('sourceCaseId', testCase.sourceCaseId);
    allureReporter.addLabel('traceabilityStatus', testCase.mappingStatus);
    allureReporter.addLabel('sourceFeatureLabel', testCase.sourceFeatureLabel);
    allureReporter.addLabel('automationCoverage', testCase.automationCoverage);
    allureReporter.addLabel('catalogStatus', testCase.status);
    allureReporter.addLabel('automationBlockers', testCase.blockers.join(',') || 'none');
    allureReporter.addLabel('plannedExecutionLane', testCase.executionLane ?? 'blocked');
    allureReporter.addLabel('accountCohort', options.accountCohort ?? 'default');
    allureReporter.addLink(testCase.sourceUrl, testCase.sourceCaseId, 'test_case');
    addCommonLabels(testCase.application, testCase.deviceRequirement, testCase.mutation);
    await test();
  });
}

export function internalIt(
  automationId: string,
  title: string,
  application: 'resident' | 'technician',
  test: AsyncTest,
  options: InternalTestOptions = {},
): void {
  it(`[${automationId}] ${title} @observe`, async () => {
    const mutation = options.mutation ?? 'read-only';
    assertMutationAuthorized(mutation);
    allureReporter.addLabel('automationId', automationId);
    allureReporter.addLabel('traceabilityStatus', 'Proposed — Registry Validation Required');
    addCommonLabels(application, options.deviceRequirement ?? 'either', mutation);
    await test();
  });
}
