import { describe, expect, it } from 'vitest';
import { getInstitutionalPage, institutionalPages } from './institutional';

describe('institutional route configuration', () => {
  it('keeps required URLs unique and stable', () => {
    expect(institutionalPages.map(({ slug }) => slug)).toEqual([
      'our-story',
      'delivery',
      'returns',
      'contact',
      'privacy',
      'terms',
      'east-sussex',
      'collabs',
    ]);
    expect(new Set(institutionalPages.map(({ slug }) => slug)).size).toBe(
      institutionalPages.length,
    );
  });

  it('makes indexability explicit and finds known routes', () => {
    expect(institutionalPages.every(({ indexable }) => typeof indexable === 'boolean')).toBe(true);
    expect(getInstitutionalPage('returns')?.indexable).toBe(true);
    expect(getInstitutionalPage('privacy')?.indexable).toBe(false);
    expect(getInstitutionalPage('missing')).toBeUndefined();
  });

  it('publishes complete pre-launch policy terms without reopening checkout', () => {
    const delivery = getInstitutionalPage('delivery');
    const returns = getInstitutionalPage('returns');
    const contact = getInstitutionalPage('contact');
    const deliveryText = delivery?.sections.flatMap(({ paragraphs }) => paragraphs).join(' ') ?? '';
    const returnsText = returns?.sections.flatMap(({ paragraphs }) => paragraphs).join(' ') ?? '';

    expect(delivery?.status).toContain('online checkout is not open');
    expect(deliveryText).toContain('£3.49');
    expect(deliveryText).toContain('£4.49');
    expect(deliveryText).toContain('£7.49');
    expect(deliveryText).toContain('£5.49');
    expect(deliveryText).toContain('£8.49');
    expect(deliveryText).toContain('£45');
    expect(deliveryText).toContain('2–3 working days');
    expect(deliveryText).toContain('Northern Ireland');
    expect(returnsText).toContain('14 days');
    expect(returnsText).toContain('original payment method');
    expect(returnsText).toContain('retrospective delivery charge');
    expect(returns?.sections.some(({ heading }) => heading === 'Model cancellation form')).toBe(
      true,
    );
    expect(contact?.sections.map(({ link }) => link?.href)).toEqual([
      'mailto:hello@paperseal.uk',
      'mailto:support@paperseal.uk',
    ]);
  });
});
