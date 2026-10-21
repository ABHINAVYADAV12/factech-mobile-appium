import type { SourceCaseId } from '../traceability/catalog.js';

export function createRunMarker(sourceCaseId: SourceCaseId, timestamp = Date.now()): string {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new Error(`Invalid marker timestamp: ${timestamp}`);
  }
  return `${sourceCaseId}-${timestamp}`;
}

export function createVehicleRegistration(timestamp = Date.now()): string {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new Error(`Invalid vehicle timestamp: ${timestamp}`);
  }
  const slot = Math.floor(timestamp / 1_000) % 6_760_000;
  const letters = Math.floor(slot / 10_000);
  const firstLetter = String.fromCharCode(65 + Math.floor(letters / 26));
  const secondLetter = String.fromCharCode(65 + (letters % 26));
  return `DL01${firstLetter}${secondLetter}${String(slot % 10_000).padStart(4, '0')}`;
}
