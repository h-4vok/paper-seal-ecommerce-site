import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import seal from '../assets/brand/paperseal-seal.png';

const sealUrl = typeof seal === 'string' ? seal : seal.src;

const Mark = () => (
  <span className="brand-mark" aria-hidden="true">
    <img className="brand-mark__seal" src={sealUrl} alt="" />
    <span className="brand-mark__type">
      <span className="brand-mark__name">Paperseal</span>
      <span className="brand-mark__descriptor">Art prints · East Sussex</span>
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
        <a className="site-header__brand" href="#home" aria-label="Paperseal home">
          <Mark />
        </a>
        <nav className="site-header__desktop-nav" aria-label="Primary navigation">
          <ul>
            <li>
              <a href="#prints">Prints</a>
            </li>
            <li>
              <a href="#story">Our Story</a>
            </li>
            <li>
              <a href="#sussex">East Sussex</a>
            </li>
          </ul>
        </nav>
        <div className="site-header__actions">
          <a className="icon-link" href="#cart" aria-label="Cart, online shop coming soon">
            Bag
          </a>
          <button
            ref={trigger}
            className="icon-button site-header__menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="storybook-menu"
            onClick={() => setOpen(true)}
          >
            Menu
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
            <p id="storybook-menu-title">Explore Paperseal</p>
            <button
              ref={close}
              className="icon-button"
              type="button"
              aria-label="Close menu"
              onClick={() => {
                setOpen(false);
                requestAnimationFrame(() => trigger.current?.focus());
              }}
            >
              Close
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            <ul className="mobile-menu__links">
              <li>
                <a href="#prints">
                  <span>01</span>Prints
                </a>
              </li>
              <li>
                <a href="#story">
                  <span>02</span>Our Story
                </a>
              </li>
              <li>
                <a href="#sussex">
                  <span>03</span>East Sussex
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
  title: 'Foundations/Paperseal system',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SharedHeader: Story = { render: () => <HeaderPreview /> };

export const MobileNavigationOpen: Story = {
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
  render: () => <HeaderPreview initiallyOpen />,
};

export const LinkAndControlStates: Story = {
  render: () => (
    <main
      style={{
        minHeight: '100vh',
        padding: '3rem',
        display: 'grid',
        alignContent: 'start',
        gap: '2rem',
      }}
    >
      <Mark />
      <p className="eyebrow">Shared interaction states</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <a className="button-link" href="#default">
          Default <span aria-hidden="true">→</span>
        </a>
        <a
          className="button-link button-link--navy"
          href="#focus"
          style={{ outline: '0.18rem solid var(--color-focus)', outlineOffset: '0.24rem' }}
        >
          Focus-visible <span aria-hidden="true">→</span>
        </a>
        <span
          className="button-link"
          aria-disabled="true"
          style={{ opacity: 0.5, cursor: 'not-allowed' }}
        >
          Unavailable
        </span>
        <a className="text-link" href="#text">
          Text link <span aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  ),
};

export const ReducedMotion: Story = {
  parameters: { reducedMotion: 'reduce' },
  render: () => (
    <main style={{ minHeight: '100vh', padding: '3rem' }}>
      <p className="eyebrow">Reduced motion</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '4rem' }}>
        Warmth without movement.
      </h1>
      <a className="button-link" href="#artworks">
        Browse artworks <span aria-hidden="true">→</span>
      </a>
    </main>
  ),
};
