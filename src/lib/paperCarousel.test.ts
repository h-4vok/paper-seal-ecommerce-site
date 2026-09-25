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
  dataset: { active: string };
  private attributes = new Map<string, string>();

  constructor(index: number) {
    this.dataset = { active: String(index === 0) };
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
  const root = Object.assign(new EventTarget(), {
    querySelectorAll(selector: string) {
      return selector === '[data-paper-slide]' ? slides : dots;
    },
    querySelector(selector: string) {
      return selector === '[data-paper-step="-1"]' ? previous : next;
    },
  }) as unknown as HTMLElement;
  return { slides, dots, previous, next, root };
}

afterEach(() => vi.useRealTimers());

describe('paper carousel', () => {
  it('rotates every seven seconds even during hover and focus', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    carousel.root.dispatchEvent(new Event('mouseenter'));
    carousel.root.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(6999);
    expect(carousel.slides[0].dataset.active).toBe('true');
    vi.advanceTimersByTime(1);
    expect(carousel.slides[1].dataset.active).toBe('true');
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
    vi.advanceTimersByTime(14000);
    expect(carousel.slides[0].dataset.active).toBe('true');
    dispose();
    vi.advanceTimersByTime(7000);
    expect(carousel.slides[0].dataset.active).toBe('true');
  });

  it('keeps manual arrows and dots working without stopping rotation', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    carousel.previous.click();
    expect(carousel.slides[2].dataset.active).toBe('true');
    carousel.next.click();
    expect(carousel.slides[0].dataset.active).toBe('true');
    carousel.dots[1].click();
    expect(carousel.slides[1].dataset.active).toBe('true');
    vi.advanceTimersByTime(7000);
    expect(carousel.slides[2].dataset.active).toBe('true');
    dispose();
    carousel.next.click();
    carousel.dots[0].click();
    expect(carousel.slides[2].dataset.active).toBe('true');
  });

  it('keeps a single slide static', () => {
    vi.useFakeTimers();
    const carousel = createCarousel(1);
    const dispose = setupPaperCarousel(carousel.root);
    vi.advanceTimersByTime(10000);
    expect(carousel.slides[0].dataset.active).toBe('true');
    dispose();
  });
});
