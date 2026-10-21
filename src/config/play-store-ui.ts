export type PlayStoreActionName = 'Install' | 'Update' | 'Open';

export interface PlayStoreAction {
  name: PlayStoreActionName;
  x: number;
  y: number;
}

function attribute(node: string, name: string): string | undefined {
  return node.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function decodeXml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

export function findPlayStoreAction(xml: string): PlayStoreAction | undefined {
  const nodes = xml.match(/<node\b[^>]*>/g) ?? [];
  for (const node of nodes) {
    const label = decodeXml(
      attribute(node, 'text') || attribute(node, 'content-desc') || '',
    ).trim();
    if (label !== 'Install' && label !== 'Update' && label !== 'Open') continue;

    const bounds = attribute(node, 'bounds')?.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
    if (!bounds) continue;
    const [, left, top, right, bottom] = bounds.map(Number);
    if (left === undefined || top === undefined || right === undefined || bottom === undefined) {
      continue;
    }
    return {
      name: label,
      x: Math.round((left + right) / 2),
      y: Math.round((top + bottom) / 2),
    };
  }
  return undefined;
}

export function playStoreNeedsUserSignIn(xml: string): boolean {
  return /(?:text|content-desc)="[^"]*Sign in[^"]*"/i.test(xml);
}
