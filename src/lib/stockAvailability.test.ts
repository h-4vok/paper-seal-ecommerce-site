import { describe, expect, it } from 'vitest';
import { remainingAvailabilityMs } from './stockAvailability';

describe('stock availability lifetime', () => {
  it('keeps the original server fetch within a 60-second budget', () => {
    expect(remainingAvailabilityMs(1_000, 1_000)).toBe(60_000);
    expect(remainingAvailabilityMs(1_000, 31_000)).toBe(30_000);
    expect(remainingAvailabilityMs(1_000, 61_000)).toBe(0);
  });

  it('rejects missing or future timestamps', () => {
    expect(remainingAvailabilityMs(undefined, 1_000)).toBe(0);
    expect(remainingAvailabilityMs(2_000, 1_000)).toBe(0);
  });
});
