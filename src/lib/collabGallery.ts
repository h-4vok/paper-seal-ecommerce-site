export function bindCollabGallery(gallery: HTMLElement): void {
  const view = gallery.ownerDocument.defaultView;
  if (!view) return;

  const works = gallery.querySelectorAll<HTMLElement>('[data-collab-work]');
  const dialog = gallery.querySelector<HTMLDialogElement>('[data-collab-lightbox]');
  const image = dialog?.querySelector<HTMLImageElement>('[data-collab-lightbox-image]');
  const watermark = dialog?.querySelector<HTMLElement>('[data-collab-lightbox-watermark]');
  const fallback = dialog?.querySelector<HTMLElement>('[data-collab-lightbox-fallback]');
  const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-collab-close-image]');
  let returnFocusTo: HTMLButtonElement | null = null;

  if (
    'IntersectionObserver' in view &&
    !(view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  ) {
    const observer = new view.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (entry.target instanceof view.HTMLElement) entry.target.dataset.revealed = 'true';
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    works.forEach((work) => observer.observe(work));
  }

  gallery.querySelectorAll<HTMLButtonElement>('[data-collab-open-image]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      if (!dialog || !image) return;
      returnFocusTo = trigger;
      image.src = trigger.dataset.imageSrc ?? '';
      image.alt = trigger.dataset.imageAlt ?? '';
      if (watermark) {
        watermark.dataset.watermarkProfile = trigger.dataset.watermarkProfile ?? 'standard';
        watermark.hidden = false;
      }
      if (fallback) fallback.hidden = true;
      image.hidden = false;
      dialog.showModal();
      closeButton?.focus();
    });
  });

  image?.addEventListener('error', () => {
    image.hidden = true;
    if (fallback) {
      fallback.hidden = false;
      fallback.setAttribute('aria-label', image.alt || 'Image unavailable');
    }
    if (watermark) watermark.hidden = true;
  });
  closeButton?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });
  dialog?.addEventListener('click', (event) => {
    if (event.target !== image) dialog.close();
  });
  dialog?.addEventListener('close', () => {
    returnFocusTo?.focus();
    returnFocusTo = null;
  });
}
