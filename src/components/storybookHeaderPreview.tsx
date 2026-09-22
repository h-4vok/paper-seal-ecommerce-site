import { useState } from 'react';

export const HeaderPreview = ({ initiallyOpen = false }: { initiallyOpen?: boolean }) => {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#home" aria-label="The Paper Seal Studio home">
          <span className="brand-mark">
            <span className="brand-mark__type">
              <span className="brand-mark__name">The Paper Seal</span>
            </span>
          </span>
        </a>
        <nav className="site-header__desktop-nav" aria-label="Primary navigation">
          <ul>
            <li>
              <a href="#prints">Prints</a>
            </li>
            <li>
              <a href="#story">Our story</a>
            </li>
          </ul>
        </nav>
        <div className="site-header__actions">
          <button
            className="icon-button site-header__menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="preview-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M5 9h22M5 16h22M5 23h22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="preview-menu" className="mobile-menu" aria-label="Mobile navigation">
          <ul className="mobile-menu__links">
            <li>
              <a href="#prints">
                <span aria-hidden="true">01</span>Prints
              </a>
            </li>
            <li>
              <a href="#story">
                <span aria-hidden="true">02</span>Our story
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};
