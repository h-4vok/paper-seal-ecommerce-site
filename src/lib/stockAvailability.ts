export function remainingAvailabilityMs(fetchedAt: unknown, now: number): number {
  if (typeof fetchedAt !== 'number' || fetchedAt > now) return 0;
  const remaining = 60_000 - (now - fetchedAt);
  return remaining > 0 ? remaining : 0;
}
