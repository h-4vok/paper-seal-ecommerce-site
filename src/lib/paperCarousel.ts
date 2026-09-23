export function setupPaperCarousel(root: HTMLElement): () => void {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-paper-slide]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-paper-index]')];
  const caption = root.querySelector<HTMLElement>('[data-paper-caption]')!;
  const previous = root.querySelector<HTMLButtonElement>('[data-paper-step="-1"]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-paper-step="1"]')!;
  let current = 0;

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

  const onPrevious = () => show(current - 1);
  const onNext = () => show(current + 1);
  const onSelect = dots.map((dot, index) => {
    const handler = () => show(index);
    dot.addEventListener('click', handler);
    return handler;
  });
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);

  return () => {
    previous.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    dots.forEach((dot, index) => dot.removeEventListener('click', onSelect[index]));
  };
}
