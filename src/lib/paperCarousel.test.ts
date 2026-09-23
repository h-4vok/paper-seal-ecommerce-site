import { describe, expect, it } from 'vitest';
import { setupPaperCarousel } from './paperCarousel';

class TestButton extends EventTarget {
  private attributes = new Map<string, string>();

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | undefined {
    return this.attributes.get(name);
  }

  click(): void {
    this.dispatchEvent(new Event('click'));
  }
}

describe('paper carousel', () => {
  it('selects images, wraps at both ends, announces captions and removes listeners', () => {
    const slides = ['PS-012', 'PS-006 side', 'PS-006 overhead'].map((caption, index) => ({
      hidden: index !== 0,
      dataset: { caption },
    }));
    const dots = slides.map(() => new TestButton());
    const previous = new TestButton();
    const next = new TestButton();
    const caption = { textContent: slides[0].dataset.caption };
    const root = {
      querySelectorAll(selector: string) {
        return selector === '[data-paper-slide]' ? slides : dots;
      },
      querySelector(selector: string) {
        if (selector === '[data-paper-caption]') return caption;
        return selector === '[data-paper-step="-1"]' ? previous : next;
      },
    } as unknown as HTMLElement;

    const dispose = setupPaperCarousel(root);
    next.click();
    expect(slides.map((slide) => slide.hidden)).toEqual([true, false, true]);
    expect(dots.map((dot) => dot.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    expect(caption.textContent).toBe('PS-006 side');

    next.click();
    next.click();
    expect(slides.map((slide) => slide.hidden)).toEqual([false, true, true]);
    previous.click();
    expect(slides.map((slide) => slide.hidden)).toEqual([true, true, false]);
    dots[1].click();
    expect(caption.textContent).toBe('PS-006 side');

    dispose();
    next.click();
    dots[0].click();
    expect(slides.map((slide) => slide.hidden)).toEqual([true, false, true]);
  });
});
