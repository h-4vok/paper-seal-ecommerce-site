import { describe, expect, it } from 'vitest';
import {
  initialProductSelection,
  navigateProductGallery,
  selectProductSize,
} from './productSelection';

describe('product size and gallery selection', () => {
  it('starts with no size selected and the flat artwork active', () => {
    expect(initialProductSelection).toEqual({ selectedSize: null, activeSlide: 0 });
  });

  it.each([
    ['small', 1],
    ['medium', 4],
    ['large', 7],
  ] as const)('selecting %s activates its first mockup', (size, firstSlideIndex) => {
    expect(selectProductSize(initialProductSelection, size, firstSlideIndex)).toEqual({
      selectedSize: size,
      activeSlide: firstSlideIndex,
    });
  });

  it('changes size and returns to that size first mockup', () => {
    const small = selectProductSize(initialProductSelection, 'small', 1);
    const medium = selectProductSize(small, 'medium', 4);

    expect(medium).toEqual({ selectedSize: 'medium', activeSlide: 4 });
  });

  it('resets to the first mockup when the selected size is chosen again', () => {
    const selected = selectProductSize(initialProductSelection, 'large', 7);
    const manuallyNavigated = navigateProductGallery(selected, 9);

    expect(selectProductSize(manuallyNavigated, 'large', 7)).toEqual({
      selectedSize: 'large',
      activeSlide: 7,
    });
  });

  it('keeps the selected size when navigating the gallery manually', () => {
    const selected = selectProductSize(initialProductSelection, 'medium', 4);

    expect(navigateProductGallery(selected, 6)).toEqual({
      selectedSize: 'medium',
      activeSlide: 6,
    });
  });
});
