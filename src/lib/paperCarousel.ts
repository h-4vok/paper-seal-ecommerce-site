export function setupPaperCarousel(root: HTMLElement): () => void {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-paper-slide]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-paper-index]')];
  const caption = root.querySelector<HTMLElement>('[data-paper-caption]')!;
  const previous = root.querySelector<HTMLButtonElement>('[data-paper-step="-1"]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-paper-step="1"]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-paper-toggle]')!;
  const controls = root.querySelector<HTMLElement>('.paper-quality__controls')!;
  const images = slides
    .map((slide) => slide.querySelector('img'))
    .filter((image): image is HTMLImageElement => image !== null);
  const document = root.ownerDocument;
  const reducedMotion = document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let hovered = false;
  let focused = false;
  let userPaused = reducedMotion?.matches ?? false;
  let ready = images.length === 0;
  let disposed = false;

  function clearTimer(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function updateLiveAnnouncements(): void {
    caption.setAttribute('aria-live', canAutoplay() ? 'off' : 'polite');
  }

  function canAutoplay(): boolean {
    return ready && !hovered && !focused && !document.hidden && !userPaused && slides.length >= 2;
  }

  function schedule(): void {
    clearTimer();
    updateLiveAnnouncements();
    if (!canAutoplay()) return;
    timer = setTimeout(() => {
      show(current + 1);
      schedule();
    }, 3000);
  }

  function show(index: number): void {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.dataset.active = String(active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-pressed', String(dotIndex === current));
    });
    caption.textContent = slides[current].dataset.caption!;
  }

  const onPrevious = () => {
    show(current - 1);
    schedule();
  };
  const onNext = () => {
    show(current + 1);
    schedule();
  };
  const onSelect = dots.map((dot, index) => {
    const handler = () => {
      show(index);
      schedule();
    };
    dot.addEventListener('click', handler);
    return handler;
  });
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);
  const onMouseEnter = () => {
    hovered = true;
    clearTimer();
    updateLiveAnnouncements();
  };
  const onMouseLeave = () => {
    hovered = false;
    schedule();
  };
  const onFocusIn = () => {
    focused = true;
    clearTimer();
    updateLiveAnnouncements();
  };
  const onFocusOut = (event: FocusEvent) => {
    if (!root.contains(event.relatedTarget as Node | null)) {
      focused = false;
      schedule();
    }
  };
  const onVisibilityChange = () => schedule();
  const onToggle = () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? resumeLabel : pauseLabel);
    schedule();
  };
  const onMotionPreferenceChange = () => {
    if (reducedMotion?.matches) {
      userPaused = true;
      toggle.setAttribute('aria-pressed', 'true');
      toggle.setAttribute('aria-label', resumeLabel);
    }
    schedule();
  };
  const pauseLabel = toggle.dataset.pauseLabel!;
  const resumeLabel = toggle.dataset.resumeLabel!;
  toggle.setAttribute('aria-pressed', String(userPaused));
  toggle.setAttribute('aria-label', userPaused ? resumeLabel : pauseLabel);
  updateLiveAnnouncements();
  controls.addEventListener('mouseenter', onMouseEnter);
  controls.addEventListener('mouseleave', onMouseLeave);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  toggle.addEventListener('click', onToggle);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion?.addEventListener('change', onMotionPreferenceChange);
  schedule();
  if (images.length > 0) {
    void Promise.allSettled(images.map((image) => image.decode())).then(() => {
      if (disposed) return;
      ready = true;
      schedule();
    });
  }

  return () => {
    disposed = true;
    clearTimer();
    previous.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    dots.forEach((dot, index) => dot.removeEventListener('click', onSelect[index]));
    controls.removeEventListener('mouseenter', onMouseEnter);
    controls.removeEventListener('mouseleave', onMouseLeave);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion?.removeEventListener('change', onMotionPreferenceChange);
  };
}
