import { $ } from '@wdio/globals';

function escapeUiSelector(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export async function byTestId(testId: string, accessibilityFallback?: string) {
  const idSelector = $(`id=${testId}`);
  if (await idSelector.isExisting()) return idSelector;

  const resourceSelector = $(`android=new UiSelector().resourceId("${escapeUiSelector(testId)}")`);
  if (await resourceSelector.isExisting()) return resourceSelector;

  if (accessibilityFallback) return $(`~${accessibilityFallback}`);
  return idSelector;
}

export async function byExactTestId(testId: string) {
  const idSelector = $(`id=${testId}`);
  if (await idSelector.isExisting()) return idSelector;
  return $(`android=new UiSelector().resourceId("${escapeUiSelector(testId)}")`);
}
