import type { Meta, StoryObj } from '@storybook/react';
import { parse } from 'yaml';
import textureImage from '../assets/home/german-etching-editorial.jpg';
import homeYaml from '../../content/copy/en-GB/home.yaml?raw';

const { paperQuality } = parse(homeYaml) as {
  paperQuality: {
    eyebrow: string;
    heading: string;
    body: string;
    attributes: string[];
    imageAlt: string;
    imageCaption: string;
    cta: string;
  };
};
const imageUrl = typeof textureImage === 'string' ? textureImage : textureImage.src;

// Astro boundary: static markup mirrors PaperQuality.astro; review classes, asset and YAML copy for parity.
const PaperQualityPreview = () => (
  <section className="paper-quality section-shell" aria-labelledby="paper-quality-title">
    <figure className="paper-quality__image">
      <picture>
        <img src={imageUrl} alt={paperQuality.imageAlt} width="1536" height="1024" loading="lazy" />
      </picture>
      <figcaption>{paperQuality.imageCaption}</figcaption>
    </figure>
    <div className="paper-quality__content">
      <div className="paper-quality__heading">
        <p className="eyebrow">{paperQuality.eyebrow}</p>
        <h2 id="paper-quality-title">{paperQuality.heading}</h2>
      </div>
      <div className="paper-quality__detail">
        <p>{paperQuality.body}</p>
        <ul className="paper-quality__attributes">
          {paperQuality.attributes.map((attribute) => (
            <li key={attribute}>{attribute}</li>
          ))}
        </ul>
        <a className="text-link" href="/our-story#paper-and-quality">
          {paperQuality.cta} <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </section>
);

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
