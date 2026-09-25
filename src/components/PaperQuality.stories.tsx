import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { useEffect, useRef } from 'react';
import { parse } from 'yaml';
import macroImage from '../assets/home/paper-quality-texture-macro.jpg';
import rakingImage from '../assets/home/paper-quality-texture-raking.jpg';
import edgeImage from '../assets/home/paper-quality-texture-edge.jpg';
import { setupPaperCarousel } from '../lib/paperCarousel';
import homeYaml from '../../content/copy/en-GB/home.yaml?raw';

const { paperQuality } = parse(homeYaml) as {
  paperQuality: {
    eyebrow: string;
    heading: string;
    body: string;
    attributes: string[];
    carouselLabel: string;
    previousImage: string;
    nextImage: string;
    selectImage: string;
    imageDisclosure: string;
    images: Array<{ alt: string; caption: string }>;
    cta: string;
  };
};
const imageUrls = [macroImage, rakingImage, edgeImage].map((image) =>
  typeof image === 'string' ? image : image.src,
);

// Astro boundary: markup mirrors PaperQuality.astro; carousel behaviour is shared.
const PaperQualityPreview = () => {
  const root = useRef<HTMLElement>(null);
  useEffect(() => (root.current ? setupPaperCarousel(root.current) : undefined), []);

  return (
    <section
      className="paper-quality section-shell"
      aria-labelledby="paper-quality-title"
      data-paper-carousel
      ref={root}
    >
      <div className="paper-quality__scene">
        {paperQuality.images.map((slide, index) => (
          <figure
            className="paper-quality__image"
            data-paper-slide
            data-active={index === 0}
            data-caption={slide.caption}
            aria-hidden={index !== 0}
            key={slide.alt}
          >
            <picture>
              <img
                src={imageUrls[index]}
                alt={slide.alt}
                width="1536"
                height="1024"
                loading="eager"
              />
            </picture>
          </figure>
        ))}
        <div className="paper-quality__content">
          <p className="eyebrow">{paperQuality.eyebrow}</p>
          <h2 id="paper-quality-title">{paperQuality.heading}</h2>
          <p className="paper-quality__body">{paperQuality.body}</p>
          <ul className="paper-quality__attributes">
            {paperQuality.attributes.map((attribute) => (
              <li key={attribute}>{attribute}</li>
            ))}
          </ul>
          <a className="button-link button-link--navy" href="/our-story#paper-and-quality">
            {paperQuality.cta} <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      <div className="paper-quality__footer">
        <div className="paper-quality__copy">
          <p data-paper-caption aria-live="off">
            {paperQuality.images[0].caption}
          </p>
          <p className="paper-quality__disclosure">{paperQuality.imageDisclosure}</p>
        </div>
        <div
          className="paper-quality__controls"
          role="group"
          aria-label={paperQuality.carouselLabel}
        >
          <button
            className="paper-quality__arrow"
            type="button"
            data-paper-step="-1"
            aria-label={paperQuality.previousImage}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="m14 5-7 7 7 7" />
            </svg>
          </button>
          <div className="paper-quality__dots">
            {paperQuality.images.map((slide, index) => (
              <button
                className="paper-quality__dot"
                type="button"
                data-paper-index={index}
                aria-label={paperQuality.selectImage
                  .replace('{index}', String(index + 1))
                  .replace('{count}', String(imageUrls.length))}
                aria-pressed={index === 0}
                key={slide.alt}
              />
            ))}
          </div>
          <button
            className="paper-quality__arrow"
            type="button"
            data-paper-step="1"
            aria-label={paperQuality.nextImage}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="m10 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

const meta = {
  title: 'Organisms/PaperQuality',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { render: () => <PaperQualityPreview /> };
export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'papersealTablet' } },
  render: () => <PaperQualityPreview />,
};
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
  render: () => <PaperQualityPreview />,
};

const showSlide =
  (index: number) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', {
        name: paperQuality.selectImage
          .replace('{index}', String(index + 1))
          .replace('{count}', String(imageUrls.length)),
      }),
    );
  };

export const RakingLight: Story = {
  render: () => <PaperQualityPreview />,
  play: showSlide(1),
};

export const PaperEdge: Story = {
  render: () => <PaperQualityPreview />,
  play: showSlide(2),
};
