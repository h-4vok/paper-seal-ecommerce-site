import { describe, expect, it } from 'vitest';
import { env } from './env';

describe('environment configuration', () => {
  it('loads with optional local development values', () => {
    expect(env).toBeDefined();
  });
});
