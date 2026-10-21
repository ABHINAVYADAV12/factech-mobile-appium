import { SOURCE_CASES } from '../src/traceability/catalog.js';
import { validateSourceCases } from '../src/traceability/validation.js';

validateSourceCases(SOURCE_CASES);

const complete = SOURCE_CASES.filter((record) => record.automationCoverage === 'complete');
const partial = SOURCE_CASES.filter((record) => record.automationCoverage === 'partial');
console.log(
  `Validated ${SOURCE_CASES.length} source cases; ${complete.length} complete and ${partial.length} partial automation mappings.`,
);
