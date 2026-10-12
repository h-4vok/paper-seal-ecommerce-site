import { describe, expect, it } from 'vitest';
import { getUmamiScriptConfig } from './umami';

describe('Umami script configuration', () => {
  it('loads only when both values are present and the script URL is safe', () => {
    expect(getUmamiScriptConfig(' website-id ', ' https://cloud.umami.is/script.js ')).toEqual({
      websiteId: 'website-id',
      scriptUrl: 'https://cloud.umami.is/script.js',
    });
    expect(getUmamiScriptConfig('website-id', '')).toBeNull();
    expect(getUmamiScriptConfig('', 'https://cloud.umami.is/script.js')).toBeNull();
    expect(getUmamiScriptConfig('website-id', 'javascript:alert(1)')).toBeNull();
    expect(getUmamiScriptConfig('website-id', 'http://example.com/script.js')).toBeNull();
    expect(getUmamiScriptConfig('website-id', 'not a URL')).toBeNull();
    expect(getUmamiScriptConfig()).toBeNull();
  });
});
