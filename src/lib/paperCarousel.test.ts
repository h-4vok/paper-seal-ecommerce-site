import { afterEach, describe, expect, it, vi } from 'vitest';
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

class TestSlide {
  dataset: { active: string; caption: string };
  private attributes = new Map<string, string>();

  constructor(index: number) {
    this.dataset = { active: String(index === 0), caption: `Paper view ${index + 1}` };
    this.attributes.set('aria-hidden', String(index !== 0));
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | undefined {
    return this.attributes.get(name);
  }
}

function createCarousel(count = 3) {
  const slides = Array.from({ length: count }, (_, index) => new TestSlide(index));
  const dots = slides.map(() => new TestButton());
  const previous = new TestButton();
  const next = new TestButton();
  const caption = { textContent: slides[0].dataset.caption };
  const root = Object.assign(new EventTarget(), {
    querySelectorAll(selector: string) {
      return selector === '[data-paper-slide]' ? slides : dots;
    },
    querySelector(selector: string) {
      if (selector === '[data-paper-caption]') return caption;
      return selector === '[data-paper-step="-1"]' ? previous : next;
    },
  }) as unknown as HTMLElement;
  return { slides, dots, previous, next, caption, root };
}

afterEach(() => vi.useRealTimers());

describe('paper carousel', () => {
  it('rotates every three seconds even during hover and focus', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    carousel.root.dispatchEvent(new Event('mouseenter'));
    carousel.root.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(2999);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    vi.advanceTimersByTime(1);
    expect(carousel.caption.textContent).toBe('Paper view 2');
    expect(carousel.slides.map((slide) => slide.dataset.active)).toEqual([
      'false',
      'true',
      'false',
    ]);
    expect(carousel.slides.map((slide) => slide.getAttribute('aria-hidden'))).toEqual([
      'true',
      'false',
      'true',
    ]);
    expect(carousel.dots.map((dot) => dot.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    vi.advanceTimersByTime(6000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    dispose();
    vi.advanceTimersByTime(3000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
  });

  it('keeps manual arrows and dots working without stopping rotation', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    carousel.previous.click();
    expect(carousel.caption.textContent).toBe('Paper view 3');
    carousel.next.click();
    expect(carousel.caption.textContent).toBe('Paper view 1');
    carousel.dots[1].click();
    expect(carousel.caption.textContent).toBe('Paper view 2');
    vi.advanceTimersByTime(3000);
    expect(carousel.caption.textContent).toBe('Paper view 3');
    dispose();
    carousel.next.click();
    carousel.dots[0].click();
    expect(carousel.caption.textContent).toBe('Paper view 3');
  });

  it('keeps a single slide static', () => {
    vi.useFakeTimers();
    const carousel = createCarousel(1);
    const dispose = setupPaperCarousel(carousel.root);
    vi.advanceTimersByTime(10000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    dispose();
  });
});
