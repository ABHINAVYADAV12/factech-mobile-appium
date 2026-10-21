export interface ChecklistProgress {
  completed: number;
  total: number;
}

export function parseChecklistProgress(text: string): ChecklistProgress | undefined {
  const match = text.trim().match(/^(\d+)\/(\d+) \(\d+%\)$/);
  if (!match) return undefined;

  const completed = Number(match[1]);
  const total = Number(match[2]);
  if (completed > total) return undefined;
  return { completed, total };
}
