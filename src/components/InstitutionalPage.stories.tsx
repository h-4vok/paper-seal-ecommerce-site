import type { Meta, StoryObj } from '@storybook/react';
import { parse } from 'yaml';
import institutionalYaml from '../../content/copy/en-GB/institutional.yaml?raw';
import sharedYaml from '../../content/copy/en-GB/shared.yaml?raw';

type Page = {
  slug: string;
  eyebrow: string;
  heading: string;
  description: string;
  status?: string;
  sections: Array<{ id?: string; heading: string; paragraphs: string[] }>;
};
const institutional = parse(institutionalYaml) as {
  statusLabel: string;
  next: { eyebrow: string; copy: string; browse: string };
  pages: Page[];
};
const shared = parse(sharedYaml) as { brand: { name: string } };

// Astro boundary: static markup mirrors InstitutionalPage.astro; review classes and YAML copy for parity.
const InstitutionalPreview = ({ page }: { page: Page }) => (
  <main id="main-content" className="institutional-page">
    <header className="institutional-hero">
      <p className="eyebrow">
        {page.eyebrow} · {shared.brand.name}
      </p>
      <h1>{page.heading}</h1>
      <p className="institutional-hero__description">{page.description}</p>
    </header>
    {page.status && (
      <aside className="institutional-status" aria-label={institutional.statusLabel}>
        <p className="eyebrow">{institutional.statusLabel}</p>
        <p className="institutional-status__copy">{page.status}</p>
      </aside>
    )}
    <div className="institutional-content">
      {page.sections.map((section) => (
        <section id={section.id} key={section.id ?? section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p className="institutional-content__copy" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
    <aside className="institutional-next">
      <p className="eyebrow">{institutional.next.eyebrow}</p>
      <p>{institutional.next.copy}</p>
      <a className="button-link button-link--navy" href="/artworks">
        {institutional.next.browse} <span aria-hidden="true">→</span>
      </a>
    </aside>
  </main>
);

const storyPage = institutional.pages.find((page) => page.slug === 'our-story');
const returnsPage = institutional.pages.find((page) => page.slug === 'returns');
if (!storyPage || !returnsPage) throw new Error('Institutional story pages are missing.');

const meta = {
  title: 'Templates/InstitutionalPage',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const OurStory: Story = { render: () => <InstitutionalPreview page={storyPage} /> };
export const OurStoryTablet: Story = {
  parameters: { viewport: { defaultViewport: 'papersealTablet' } },
  render: () => <InstitutionalPreview page={storyPage} />,
};
export const OurStoryMobile: Story = {
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
  render: () => <InstitutionalPreview page={storyPage} />,
};
export const Policy: Story = { render: () => <InstitutionalPreview page={returnsPage} /> };
