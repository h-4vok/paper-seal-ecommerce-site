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

class TestDocument extends EventTarget {
  hidden = false;
  defaultView: { matchMedia: () => TestMediaQuery } | null;

  constructor(reducedMotion = false, withWindow = true) {
    super();
    const media = new TestMediaQuery(reducedMotion);
    this.defaultView = withWindow ? { matchMedia: () => media } : null;
  }
}

class TestMediaQuery extends EventTarget {
  constructor(public matches: boolean) {
    super();
  }
}

class TestCaption {
  textContent: string;
  private attributes = new Map<string, string>();

  constructor(textContent: string) {
    this.textContent = textContent;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | undefined {
    return this.attributes.get(name);
  }
}

function createCarousel(count = 3, reducedMotion = false, withWindow = true) {
  const slides = Array.from({ length: count }, (_, index) => ({
    hidden: index !== 0,
    dataset: { caption: `Paper view ${index + 1}` },
  }));
  const dots = slides.map(() => new TestButton());
  const previous = new TestButton();
  const next = new TestButton();
  const toggle = Object.assign(new TestButton(), {
    dataset: { pauseLabel: 'Pause carousel', resumeLabel: 'Play carousel' },
  });
  const caption = new TestCaption(slides[0]?.dataset.caption ?? '');
  const document = new TestDocument(reducedMotion, withWindow);
  const focusTarget = new EventTarget();
  const root = Object.assign(new EventTarget(), {
    ownerDocument: document,
    querySelectorAll(selector: string) {
      return selector === '[data-paper-slide]' ? slides : dots;
    },
    querySelector(selector: string) {
      if (selector === '[data-paper-caption]') return caption;
      if (selector === '[data-paper-toggle]') return toggle;
      return selector === '[data-paper-step="-1"]' ? previous : next;
    },
    contains(target: EventTarget | null) {
      return target === focusTarget;
    },
  }) as unknown as HTMLElement;
  const media = document.defaultView?.matchMedia() ?? null;

  return { slides, dots, previous, next, toggle, caption, document, focusTarget, root, media };
}

function dispatchFocusOut(root: HTMLElement, relatedTarget: EventTarget | null): void {
  const event = new Event('focusout');
  Object.defineProperty(event, 'relatedTarget', { value: relatedTarget });
  root.dispatchEvent(event);
}

afterEach(() => vi.useRealTimers());

describe('paper carousel', () => {
  it('selects images, wraps at both ends, announces captions and removes listeners', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);
    expect(carousel.caption.getAttribute('aria-live')).toBe('off');

    carousel.next.click();
    expect(carousel.slides.map((slide) => slide.hidden)).toEqual([true, false, true]);
    expect(carousel.dots.map((dot) => dot.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    expect(carousel.caption.textContent).toBe('Paper view 2');

    carousel.next.click();
    carousel.next.click();
    expect(carousel.slides.map((slide) => slide.hidden)).toEqual([false, true, true]);
    carousel.previous.click();
    expect(carousel.slides.map((slide) => slide.hidden)).toEqual([true, true, false]);
    carousel.dots[1].click();
    expect(carousel.caption.textContent).toBe('Paper view 2');
    carousel.toggle.click();
    expect(carousel.toggle.getAttribute('aria-pressed')).toBe('true');
    expect(carousel.toggle.getAttribute('aria-label')).toBe('Play carousel');
    expect(carousel.caption.getAttribute('aria-live')).toBe('polite');
    carousel.toggle.click();
    expect(carousel.toggle.getAttribute('aria-pressed')).toBe('false');
    expect(carousel.toggle.getAttribute('aria-label')).toBe('Pause carousel');
    expect(carousel.caption.getAttribute('aria-live')).toBe('off');

    dispose();
    vi.advanceTimersByTime(7000);
    carousel.next.click();
    carousel.dots[0].click();
    expect(carousel.slides.map((slide) => slide.hidden)).toEqual([true, false, true]);
  });

  it('advances every seven seconds and restarts the interval after manual navigation', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    vi.advanceTimersByTime(6999);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    vi.advanceTimersByTime(1);
    expect(carousel.caption.textContent).toBe('Paper view 2');
    carousel.dots[2].click();
    vi.advanceTimersByTime(6999);
    expect(carousel.caption.textContent).toBe('Paper view 3');
    vi.advanceTimersByTime(1);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    dispose();
  });

  it('pauses while hovered and resumes with a full interval after pointer leaves', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    vi.advanceTimersByTime(6000);
    carousel.root.dispatchEvent(new Event('mouseenter'));
    expect(carousel.caption.getAttribute('aria-live')).toBe('polite');
    vi.advanceTimersByTime(10000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    carousel.root.dispatchEvent(new Event('mouseleave'));
    expect(carousel.caption.getAttribute('aria-live')).toBe('off');
    vi.advanceTimersByTime(6999);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    vi.advanceTimersByTime(1);
    expect(carousel.caption.textContent).toBe('Paper view 2');
    dispose();
  });

  it('pauses while focused, including focus moving within the carousel', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    vi.advanceTimersByTime(6000);
    carousel.root.dispatchEvent(new Event('focusin'));
    expect(carousel.caption.getAttribute('aria-live')).toBe('polite');
    vi.advanceTimersByTime(10000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    dispatchFocusOut(carousel.root, carousel.focusTarget);
    vi.advanceTimersByTime(1000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    dispatchFocusOut(carousel.root, null);
    expect(carousel.caption.getAttribute('aria-live')).toBe('off');
    vi.advanceTimersByTime(6999);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    vi.advanceTimersByTime(1);
    expect(carousel.caption.textContent).toBe('Paper view 2');
    dispose();
  });

  it('pauses while the document is hidden and resumes when it becomes visible', () => {
    vi.useFakeTimers();
    const carousel = createCarousel();
    const dispose = setupPaperCarousel(carousel.root);

    vi.advanceTimersByTime(6000);
    carousel.document.hidden = true;
    carousel.document.dispatchEvent(new Event('visibilitychange'));
    expect(carousel.caption.getAttribute('aria-live')).toBe('polite');
    vi.advanceTimersByTime(10000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    carousel.document.hidden = false;
    carousel.document.dispatchEvent(new Event('visibilitychange'));
    expect(carousel.caption.getAttribute('aria-live')).toBe('off');
    vi.advanceTimersByTime(7000);
    expect(carousel.caption.textContent).toBe('Paper view 2');
    dispose();
  });

  it('starts paused for reduced motion and lets the user explicitly resume autoplay', () => {
    vi.useFakeTimers();
    const carousel = createCarousel(3, true);
    const dispose = setupPaperCarousel(carousel.root);

    vi.advanceTimersByTime(10000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    expect(carousel.toggle.getAttribute('aria-pressed')).toBe('true');
    expect(carousel.caption.getAttribute('aria-live')).toBe('polite');
    expect(carousel.toggle.getAttribute('aria-label')).toBe('Play carousel');
    carousel.toggle.click();
    expect(carousel.toggle.getAttribute('aria-pressed')).toBe('false');
    expect(carousel.toggle.getAttribute('aria-label')).toBe('Pause carousel');
    carousel.media!.matches = false;
    carousel.media!.dispatchEvent(new Event('change'));
    vi.advanceTimersByTime(7000);
    expect(carousel.caption.textContent).toBe('Paper view 2');
    carousel.media!.matches = true;
    carousel.media!.dispatchEvent(new Event('change'));
    expect(carousel.toggle.getAttribute('aria-pressed')).toBe('true');
    expect(carousel.toggle.getAttribute('aria-label')).toBe('Play carousel');
    vi.advanceTimersByTime(10000);
    expect(carousel.caption.textContent).toBe('Paper view 2');
    carousel.previous.click();
    expect(carousel.caption.textContent).toBe('Paper view 1');
    expect(carousel.caption.getAttribute('aria-live')).toBe('polite');
    dispose();
  });

  it('keeps a single slide static and supports environments without matchMedia', () => {
    vi.useFakeTimers();
    const carousel = createCarousel(1, false, false);
    const dispose = setupPaperCarousel(carousel.root);

    vi.advanceTimersByTime(10000);
    expect(carousel.caption.textContent).toBe('Paper view 1');
    dispose();
  });
});
