import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { useEffect, useRef, useState } from 'react';
import { parse } from 'yaml';
import seal from '../assets/brand/paperseal-seal.png';
import sharedYaml from '../../content/copy/en-GB/shared.yaml?raw';
import storiesYaml from '../../content/copy/en-GB/stories.yaml?raw';

const stories = parse(storiesYaml) as Record<string, string>;
const { navigation } = parse(sharedYaml) as { navigation: { items: Array<{ label: string }> } };

const sealUrl = typeof seal === 'string' ? seal : seal.src;

const Mark = () => (
  <span className="brand-mark" aria-hidden="true">
    <img className="brand-mark__seal" src={sealUrl} alt="" />
    <span className="brand-mark__type">
      <span className="brand-mark__name">{stories.brandName}</span>
      <span className="brand-mark__descriptor">{stories.brandDescriptor}</span>
    </span>
  </span>
);

const HeaderPreview = ({ initiallyOpen = false }: { initiallyOpen?: boolean }) => {
  const [open, setOpen] = useState(initiallyOpen);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) close.current?.focus();
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#home" aria-label={stories.homeAria}>
          <Mark />
        </a>
        <nav className="site-header__desktop-nav" aria-label={stories.primaryNavigation}>
          <ul>
            <li>
              <a href="#prints">{navigation.items[0].label}</a>
            </li>
            <li>
              <a href="#story">{navigation.items[1].label}</a>
            </li>
            <li>
              <a href="#sussex">{navigation.items[2].label}</a>
            </li>
          </ul>
        </nav>
        <div className="site-header__actions">
          <a className="icon-link" href="#cart" aria-label={stories.cartAria}>
            {stories.bag}
          </a>
          <button
            ref={trigger}
            className="icon-button site-header__menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="storybook-menu"
            onClick={() => setOpen(true)}
          >
            {stories.menu}
          </button>
        </div>
      </div>
      {open && (
        <div
          className="mobile-menu"
          id="storybook-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="storybook-menu-title"
          style={{ display: 'block', position: 'relative', marginLeft: 'auto' }}
        >
          <div className="mobile-menu__header">
            <p id="storybook-menu-title">{stories.explore}</p>
            <button
              ref={close}
              className="icon-button"
              type="button"
              aria-label={stories.closeMenu}
              onClick={() => {
                setOpen(false);
                requestAnimationFrame(() => trigger.current?.focus());
              }}
            >
              {stories.closeMenu}
            </button>
          </div>
          <nav aria-label={stories.mobileNavigation}>
            <ul className="mobile-menu__links">
              <li>
                <a href="#prints">
                  <span>01</span>
                  {navigation.items[0].label}
                </a>
              </li>
              <li>
                <a href="#story">
                  <span>02</span>
                  {navigation.items[1].label}
                </a>
              </li>
              <li>
                <a href="#sussex">
                  <span>03</span>
                  {navigation.items[2].label}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

const meta = {
  title: 'Foundations/The Paper Seal Studio system',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SharedHeader: Story = { render: () => <HeaderPreview /> };

export const Foundations: Story = {
  name: 'Foundations / tokens and type',
  render: () => (
    <main
      style={{
        display: 'grid',
        alignContent: 'start',
        gap: '2rem',
        minHeight: '100vh',
        padding: '3rem',
      }}
    >
      <div>
        <p className="eyebrow">Foundations</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Paper, ink, garden.</h1>
        <p style={{ maxWidth: '42rem', lineHeight: 1.6 }}>
          Shared colour, typography, focus, spacing and motion tokens used by storefront UI.
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <a className="button-link" href="#primary">
          Primary action <span aria-hidden="true">→</span>
        </a>
        <a className="button-link button-link--navy" href="#secondary">
          Navy action <span aria-hidden="true">→</span>
        </a>
        <a className="text-link" href="#text">
          Text link <span aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  ),
};

export const MobileNavigationOpen: Story = {
  parameters: {
    viewport: { defaultViewport: 'papersealMobile' },
    layout: 'fullscreen',
  },
  render: () => (
    <div style={{ width: 'min(100%, 390px)', minHeight: '844px', marginInline: 'auto' }}>
      <HeaderPreview initiallyOpen />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const close = canvas.getByRole('button', { name: stories.closeMenu });
    await userEvent.click(close);
    const trigger = canvas.getByRole('button', { name: stories.menu });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

export const LinkAndControlStates: Story = {
  render: () => (
    <main
      style={{
        padding: '3rem',
        display: 'grid',
        alignContent: 'start',
        gap: '2rem',
      }}
    >
      <Mark />
      <p className="eyebrow">{stories.interactionStates}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <a className="button-link" href="#default">
          {stories.default} <span aria-hidden="true">→</span>
        </a>
        <a
          className="button-link button-link--navy"
          href="#focus"
          style={{ outline: '0.18rem solid var(--color-focus)', outlineOffset: '0.24rem' }}
        >
          {stories.focusVisible} <span aria-hidden="true">→</span>
        </a>
        <span
          className="button-link"
          aria-disabled="true"
          style={{ opacity: 0.5, cursor: 'not-allowed' }}
        >
          {stories.unavailable}
        </span>
        <a className="text-link" href="#text">
          {stories.textLink} <span aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  ),
};

export const ReducedMotion: Story = {
  parameters: { reducedMotion: 'reduce' },
  render: () => (
    <main style={{ minHeight: '100vh', padding: '3rem' }}>
      <p className="eyebrow">{stories.reducedMotion}</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '4rem' }}>
        {stories.warmthWithoutMovement}
      </h1>
      <a className="button-link" href="#artworks">
        {stories.browseArtworks} <span aria-hidden="true">→</span>
      </a>
    </main>
  ),
};
