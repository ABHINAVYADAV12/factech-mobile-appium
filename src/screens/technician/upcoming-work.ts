const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function parseUpcomingDueDate(label: string): Date | undefined {
  const match = label.match(/^Due:\s+(\d{2})\s+([A-Z][a-z]{2})\s+(\d{4})$/);
  if (!match) return undefined;
  const month = MONTHS.indexOf(match[2] as (typeof MONTHS)[number]);
  if (month < 0) return undefined;
  return new Date(Number(match[3]), month, Number(match[1]));
}

export function dateOnlyValue(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dueDateIsWithinRange(label: string, from: Date, to: Date): boolean {
  const due = parseUpcomingDueDate(label);
  if (!due) return false;
  const value = dateOnlyValue(due);
  return value >= dateOnlyValue(from) && value <= dateOnlyValue(to);
}
