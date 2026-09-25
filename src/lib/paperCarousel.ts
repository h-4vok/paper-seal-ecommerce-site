export function setupPaperCarousel(root: HTMLElement): () => void {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-paper-slide]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-paper-index]')];
  const caption = root.querySelector<HTMLElement>('[data-paper-caption]')!;
  const previous = root.querySelector<HTMLButtonElement>('[data-paper-step="-1"]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-paper-step="1"]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-paper-toggle]')!;
  const document = root.ownerDocument;
  const reducedMotion = document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let hovered = false;
  let focused = false;
  let userPaused = reducedMotion?.matches ?? false;

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
    return !hovered && !focused && !document.hidden && !userPaused && slides.length >= 2;
  }

  function schedule(): void {
    clearTimer();
    updateLiveAnnouncements();
    if (!canAutoplay()) return;
    timer = setTimeout(() => {
      show(current + 1);
      schedule();
    }, 7000);
  }

  function show(index: number): void {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== current;
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
  root.addEventListener('mouseenter', onMouseEnter);
  root.addEventListener('mouseleave', onMouseLeave);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  toggle.addEventListener('click', onToggle);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion?.addEventListener('change', onMotionPreferenceChange);
  schedule();

  return () => {
    clearTimer();
    previous.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    dots.forEach((dot, index) => dot.removeEventListener('click', onSelect[index]));
    root.removeEventListener('mouseenter', onMouseEnter);
    root.removeEventListener('mouseleave', onMouseLeave);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion?.removeEventListener('change', onMotionPreferenceChange);
  };
}
