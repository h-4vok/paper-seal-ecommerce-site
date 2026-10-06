import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { useState } from 'react';
import './snipcart-theme-preview.scss';

type PreviewProps = { populated: boolean };

function SnipcartThemePreview({ populated }: PreviewProps) {
  const [open, setOpen] = useState(true);
  const [quantity, setQuantity] = useState(populated ? 1 : 0);

  return (
    <div className="snipcart-theme-preview">
      <div className="snipcart-theme-preview__backdrop" aria-hidden="true">
        <span>The Paper Seal Studio</span>
        <p>Art prints inspired by East Sussex.</p>
      </div>
      {!open && (
        <button type="button" onClick={() => setOpen(true)}>
          Open cart
        </button>
      )}
      {open && (
        <div
          id="snipcart"
          className="snipcart-theme-preview__drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Cart preview"
        >
          <div className="snipcart-cart__secondary-header">
            <div>
              <span className="snipcart-theme-preview__eyebrow">Your selection</span>
              <h2 className="snipcart-cart__secondary-header-title">Your cart</h2>
            </div>
            <button
              type="button"
              className="snipcart-cart-header__close-button snipcart-modal__close snipcart-theme-preview__close"
              aria-label="Close cart"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          {quantity ? (
            <>
              <div className="snipcart-theme-preview__main">
                <div className="snipcart-item-line">
                  <div className="snipcart-item-line__container">
                    <img
                      className="snipcart-item-line__image"
                      src="/images/artworks/flower-bed/flat-720.jpg"
                      alt="Flower Bed print"
                      width="92"
                      height="120"
                    />
                    <div>
                      <h3 className="snipcart-item-line__title">Flower Bed</h3>
                      <p>Small print</p>
                      <div className="snipcart-theme-preview__quantity">
                        <span>Quantity</span>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity((value) => Math.max(0, value - 1))}
                        >
                          −
                        </button>
                        <output aria-live="polite">{quantity}</output>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQuantity((value) => value + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <strong>£{(quantity * 8).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              <div className="snipcart-theme-preview__footer">
                <p>Shipping and taxes calculated at checkout.</p>
                <div className="snipcart-theme-preview__total">
                  <span>Total</span>
                  <strong>£{(quantity * 8).toFixed(2)}</strong>
                </div>
                <button type="button" className="snipcart-base-button snipcart-button-primary">
                  Continue to checkout
                </button>
                <button
                  type="button"
                  className="snipcart-theme-preview__link"
                  onClick={() => setOpen(false)}
                >
                  Continue exploring
                </button>
              </div>
            </>
          ) : (
            <div className="snipcart-empty-cart">
              <p className="snipcart-empty-cart__title">Your cart is empty.</p>
              <button
                type="button"
                className="snipcart-base-button snipcart-button-secondary"
                onClick={() => setOpen(false)}
              >
                Back to store
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const meta = {
  title: 'Foundations/Snipcart theme',
  component: SnipcartThemePreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Visual specimen for the vendor-owned Snipcart side cart. Production colours, type and selected class overrides come from snipcart.scss; checkout behaviour remains Snipcart-owned.',
      },
    },
  },
} satisfies Meta<typeof SnipcartThemePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { populated: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const closeButton = canvas.getByRole('button', { name: 'Close cart' });
    await expect(getComputedStyle(closeButton).cursor).toBe('pointer');
  },
};
export const WithArtwork: Story = {
  args: { populated: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Increase quantity' }));
    await expect(canvas.getAllByText('£16.00')).toHaveLength(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease quantity' }));
    await expect(canvas.getAllByText('£8.00')).toHaveLength(2);
  },
};
export const MobileEmpty: Story = {
  args: { populated: false },
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
};
export const MobileWithArtwork: Story = {
  args: { populated: true },
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
};
