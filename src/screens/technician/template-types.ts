export type TemplateType = 'PM' | 'HK' | 'LB';
export type TemplateRecordStatus = 'OPEN' | 'COMPLETED';

export function recordStatusDescription(sequence: string, status: TemplateRecordStatus): string {
  return `${sequence}, ${status},`;
}

export function sequenceMatchesTemplateType(sequence: string, type: TemplateType): boolean {
  if (type === 'PM') return /^WO[- ]?\d+$/i.test(sequence);
  if (type === 'HK') return /^(?:HK|HW)[- ]?\d+$/i.test(sequence);
  return /^(?:LB|LG)[- ]?\d+$/i.test(sequence);
}

export function resolveCreatedTemplateSequence(
  previousSequences: ReadonlySet<string>,
  currentSequences: Iterable<string>,
  type: TemplateType,
): string {
  const candidates = [...currentSequences].filter(
    (sequence) => sequenceMatchesTemplateType(sequence, type) && !previousSequences.has(sequence),
  );

  if (candidates.length !== 1) {
    throw new Error(
      `Expected exactly one new ${type} sequence after template creation; found ${candidates.length}: ${candidates.join(', ') || 'none'}`,
    );
  }

  return candidates[0]!;
}
