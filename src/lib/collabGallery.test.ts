import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { bindCollabGallery } from './collabGallery';

function createGallery() {
  const dom = new JSDOM(`
    <section data-collab-gallery>
      <article data-collab-work>
        <button type="button" data-collab-open-image
          data-image-src="/images/collabs/group/work/flat-1440.jpg"
          data-image-alt="A painted Cotswolds scene"
          data-watermark-profile="high-contrast"></button>
      </article>
      <dialog data-collab-lightbox aria-label="Artwork gallery">
        <div class="collabs-lightbox__surface">
          <button type="button" data-collab-close-image>Close</button>
          <div class="collabs-lightbox__image-wrap">
            <img data-collab-lightbox-image alt="">
            <span data-collab-lightbox-watermark></span>
            <span data-collab-lightbox-fallback hidden></span>
          </div>
        </div>
      </dialog>
    </section>
  `);
  const gallery = dom.window.document.querySelector<HTMLElement>('[data-collab-gallery]')!;
  const dialog = gallery.querySelector<HTMLDialogElement>('[data-collab-lightbox]')!;
  Object.defineProperty(dialog, 'showModal', {
    value: () => dialog.setAttribute('open', ''),
  });
  Object.defineProperty(dialog, 'close', {
    value: () => {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new dom.window.Event('close'));
    },
  });
  return { dom, gallery, dialog };
}

describe('collab gallery interactions', () => {
  it('opens the selected watermarked artwork and restores focus when closed', () => {
    const { dom, gallery, dialog } = createGallery();
    bindCollabGallery(gallery);
    const trigger = gallery.querySelector<HTMLButtonElement>('[data-collab-open-image]')!;
    const image = dialog.querySelector<HTMLImageElement>('[data-collab-lightbox-image]')!;
    const watermark = dialog.querySelector<HTMLElement>('[data-collab-lightbox-watermark]')!;
    const close = dialog.querySelector<HTMLButtonElement>('[data-collab-close-image]')!;

    trigger.focus();
    trigger.click();
    expect(dialog.open).toBe(true);
    expect(image.alt).toBe('A painted Cotswolds scene');
    expect(image.src).toContain('/images/collabs/group/work/flat-1440.jpg');
    expect(watermark.hidden).toBe(false);
    expect(watermark.dataset.watermarkProfile).toBe('high-contrast');
    expect(dom.window.document.activeElement).toBe(close);

    close.click();
    expect(dialog.open).toBe(false);
    expect(dom.window.document.activeElement).toBe(trigger);
  });

  it('keeps clicks on the image open and closes clicks outside it', () => {
    const { dom, gallery, dialog } = createGallery();
    bindCollabGallery(gallery);
    const trigger = gallery.querySelector<HTMLButtonElement>('[data-collab-open-image]')!;
    const image = dialog.querySelector<HTMLImageElement>('[data-collab-lightbox-image]')!;

    trigger.click();
    image.click();
    expect(dialog.open).toBe(true);

    const outsideImage = dialog.querySelector<HTMLElement>('.collabs-lightbox__surface')!;
    outsideImage.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(dialog.open).toBe(false);
  });

  it('exposes a clear image error state and closes a click on the lightbox backdrop', () => {
    const { dom, gallery, dialog } = createGallery();
    bindCollabGallery(gallery);
    const trigger = gallery.querySelector<HTMLButtonElement>('[data-collab-open-image]')!;
    const image = dialog.querySelector<HTMLImageElement>('[data-collab-lightbox-image]')!;
    const watermark = dialog.querySelector<HTMLElement>('[data-collab-lightbox-watermark]')!;
    const fallback = dialog.querySelector<HTMLElement>('[data-collab-lightbox-fallback]')!;

    trigger.click();
    image.dispatchEvent(new dom.window.Event('error'));
    expect(image.hidden).toBe(true);
    expect(fallback.hidden).toBe(false);
    expect(fallback.getAttribute('aria-label')).toBe('A painted Cotswolds scene');
    expect(watermark.hidden).toBe(true);

    dialog.dispatchEvent(new dom.window.MouseEvent('click'));
    expect(dialog.open).toBe(false);
  });

  it('closes on the dialog cancel event and restores focus to the image trigger', () => {
    const { dom, gallery, dialog } = createGallery();
    bindCollabGallery(gallery);
    const trigger = gallery.querySelector<HTMLButtonElement>('[data-collab-open-image]')!;
    trigger.click();

    const cancel = new dom.window.Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(dom.window.document.activeElement).toBe(trigger);
  });

  it('reveals works when motion is allowed and an IntersectionObserver is available', () => {
    const { dom, gallery } = createGallery();
    class MockIntersectionObserver {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target, isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
    }
    Object.defineProperty(dom.window, 'IntersectionObserver', {
      value: MockIntersectionObserver,
    });

    bindCollabGallery(gallery);
    expect(gallery.querySelector<HTMLElement>('[data-collab-work]')?.dataset.revealed).toBe('true');
  });

  it('skips the reveal observer when reduced motion is requested', () => {
    const { dom, gallery } = createGallery();
    Object.defineProperty(dom.window, 'matchMedia', {
      value: () => ({ matches: true }),
    });
    Object.defineProperty(dom.window, 'IntersectionObserver', {
      value: class {
        constructor() {
          throw new Error('Reduced motion should skip the observer.');
        }
      },
    });

    bindCollabGallery(gallery);
    expect(
      gallery.querySelector<HTMLElement>('[data-collab-work]')?.dataset.revealed,
    ).toBeUndefined();
  });

  it('safely skips missing dialogs and documents without a browser window', () => {
    const { dom } = createGallery();
    const gallery = dom.window.document.createElement('section');
    gallery.innerHTML = '<button type="button" data-collab-open-image></button>';
    bindCollabGallery(gallery);
    gallery.querySelector('button')?.click();

    const staticDocument = dom.window.document.implementation.createHTMLDocument();
    const staticGallery = staticDocument.createElement('section');
    expect(() => bindCollabGallery(staticGallery)).not.toThrow();
  });

  it('uses safe default image metadata when a trigger has no data attributes', () => {
    const { dom, gallery, dialog } = createGallery();
    bindCollabGallery(gallery);
    const trigger = gallery.querySelector<HTMLButtonElement>('[data-collab-open-image]')!;
    const image = dialog.querySelector<HTMLImageElement>('[data-collab-lightbox-image]')!;
    const watermark = dialog.querySelector<HTMLElement>('[data-collab-lightbox-watermark]')!;
    const fallback = dialog.querySelector<HTMLElement>('[data-collab-lightbox-fallback]')!;
    delete trigger.dataset.imageSrc;
    delete trigger.dataset.imageAlt;
    delete trigger.dataset.watermarkProfile;

    trigger.click();
    expect(watermark.dataset.watermarkProfile).toBe('standard');
    image.dispatchEvent(new dom.window.Event('error'));
    expect(fallback.getAttribute('aria-label')).toBe('Image unavailable');
  });

  it('keeps the static artworks visible when the visitor prefers reduced motion', () => {
    const { dom, gallery } = createGallery();
    Object.defineProperty(dom.window, 'matchMedia', {
      value: () => ({ matches: true }),
    });
    bindCollabGallery(gallery);
    const work = gallery.querySelector<HTMLElement>('[data-collab-work]')!;
    expect(work.hidden).toBe(false);
    expect(work.dataset.revealed).toBeUndefined();
  });
});
