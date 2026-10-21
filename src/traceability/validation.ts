import { existsSync, readFileSync } from 'node:fs';

import type { SourceCase } from './catalog.js';

interface ValidationIo {
  exists(path: string): boolean;
  read(path: string): string;
}

const defaultIo: ValidationIo = {
  exists: existsSync,
  read: (path) => readFileSync(path, 'utf8'),
};

export function validateSourceCases(records: SourceCase[], io: ValidationIo = defaultIo): void {
  const identifiers = new Set<string>();

  for (const record of records) {
    if (identifiers.has(record.sourceCaseId)) {
      throw new Error(`Duplicate ${record.sourceCaseId}`);
    }
    identifiers.add(record.sourceCaseId);

    if (record.canonicalFeatureCode !== null) {
      throw new Error(`Unapproved canonical mapping on ${record.sourceCaseId}`);
    }
    if (!record.sourceUrl.startsWith('https://isocietymanager.atlassian.net/')) {
      throw new Error(`Invalid source URL on ${record.sourceCaseId}`);
    }

    if (record.automationCoverage === 'complete') {
      if (!record.status.startsWith('automated')) {
        throw new Error(`Complete coverage requires automated status on ${record.sourceCaseId}`);
      }
      if (record.blockers.length > 0) {
        throw new Error(`Complete coverage cannot retain blockers on ${record.sourceCaseId}`);
      }
    }

    if (record.automationCoverage === 'partial' && record.blockers.length === 0) {
      throw new Error(`Partial automation must retain a blocker on ${record.sourceCaseId}`);
    }

    if (record.automationCoverage === 'none' && record.automationReferences.length > 0) {
      throw new Error(`Unclassified automation evidence on ${record.sourceCaseId}`);
    }

    if (record.automationCoverage !== 'none' && record.automationReferences.length === 0) {
      throw new Error(`Automation coverage lacks evidence on ${record.sourceCaseId}`);
    }

    if (
      record.mutation === 'data-changing' &&
      record.executionLane !== null &&
      record.executionLane !== 'production-regression'
    ) {
      throw new Error(`Data-changing case must use production-regression: ${record.sourceCaseId}`);
    }

    if (
      record.deviceRequirement === 'physical' &&
      record.automationCoverage !== 'none' &&
      record.executionLane !== 'hardware' &&
      record.executionLane !== 'production-regression'
    ) {
      throw new Error(`Physical case lacks a physical execution route: ${record.sourceCaseId}`);
    }

    for (const reference of record.automationReferences) {
      if (!reference.startsWith('tests/') || !reference.endsWith('.spec.ts')) {
        throw new Error(`Invalid automation reference on ${record.sourceCaseId}: ${reference}`);
      }
      if (!io.exists(reference)) {
        throw new Error(`Missing automation reference on ${record.sourceCaseId}: ${reference}`);
      }
      if (!io.read(reference).includes(`sourceCase('${record.sourceCaseId}')`)) {
        throw new Error(
          `Automation reference does not execute ${record.sourceCaseId}: ${reference}`,
        );
      }
    }
  }
}
