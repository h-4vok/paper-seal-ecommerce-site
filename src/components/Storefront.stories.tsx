import type { Meta, StoryObj } from '@storybook/react';

type GalleryKind = 'room' | 'mounted' | 'detail';

const Picture = ({
  asset,
  alt,
  kind = 'room',
}: {
  asset: string;
  alt: string;
  kind?: GalleryKind;
}) => (
  <picture>
    <source type="image/avif" srcSet={`/images/artworks/${asset}/${kind}-720.avif`} />
    <img src={`/images/artworks/${asset}/${kind}-720.jpg`} width="720" height="540" alt={alt} />
  </picture>
);

const galleryKinds: GalleryKind[] = ['room', 'mounted', 'detail', 'mounted', 'detail'];

const ProductGalleryPreview = ({
  count,
  focused = false,
}: {
  count: 1 | 3 | 5;
  focused?: boolean;
}) => {
  const images = galleryKinds.slice(0, count);
  return (
    <div className="product-gallery" aria-label={`${count}-image gallery example`}>
      <div
        className="product-gallery__stage"
        style={
          focused ? { outline: '0.18rem solid var(--color-focus)', outlineOffset: '-0.3rem' } : {}
        }
      >
        <div className="product-gallery__slide">
          <Picture asset="seven-sisters" kind={images[0]} alt="Seven Sisters gallery preview" />
        </div>
        {count > 1 && (
          <>
            <button
              className="gallery-arrow gallery-arrow--previous"
              type="button"
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              className="gallery-arrow gallery-arrow--next"
              type="button"
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="product-gallery__dots" aria-label="Choose gallery image">
          {images.map((kind, index) => (
            <button
              key={`${kind}-${index}`}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === 0}
            />
          ))}
        </div>
      )}
      {count > 1 && (
        <div className="product-gallery__thumbs">
          {images.map((kind, index) => (
            <button
              key={`${kind}-${index}`}
              type="button"
              className="product-gallery__thumbnail"
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === 0}
            >
              <Picture asset="seven-sisters" kind={kind} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Card = ({ asset, title, place }: { asset: string; title: string; place: string }) => (
  <article className="artwork-card">
    <a href="#product" aria-label={`View ${title}, ${place}`}>
      <div className="artwork-card__media">
        <Picture asset={asset} alt={`${title} mounted print`} />
      </div>
      <div className="artwork-card__caption">
        <div>
          <h2>{title}</h2>
          <p>{place} · PS-000</p>
        </div>
        <p className="artwork-card__description">
          A local scene presented with a warm paper mount and a simple caption slip.
        </p>
        <span aria-hidden="true">View print →</span>
      </div>
    </a>
  </article>
);

const meta = {
  title: 'Storefront/Alpha routes',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CatalogueLandscapePortraitAndLongTitle: Story = {
  render: () => (
    <main className="catalogue-main">
      <div className="catalogue-results-heading">
        <p className="eyebrow">Mixed pair</p>
        <p>2 artworks</p>
      </div>
      <div className="artwork-grid">
        <Card asset="flower-bed" title="Flower Bed" place="Eastbourne" />
        <Card
          asset="beachy-head"
          title="Beachy Head, a very long local artwork title"
          place="Beachy Head"
        />
      </div>
    </main>
  ),
};

export const CatalogueEmptyAndFocus: Story = {
  render: () => (
    <main className="catalogue-main">
      <div className="catalogue-empty" style={{ display: 'block' }}>
        <p className="eyebrow">No artworks found</p>
        <h2>Try another place or a broader search.</h2>
        <button
          className="button-link button-link--navy"
          type="button"
          style={{ outline: '0.18rem solid var(--color-focus)', outlineOffset: '0.24rem' }}
        >
          Reset catalogue
        </button>
      </div>
    </main>
  ),
};

export const ProductComingSoonAndOptions: Story = {
  render: () => (
    <main className="product-layout">
      <div className="product-gallery">
        <div className="product-gallery__stage">
          <Picture asset="seven-sisters" alt="Seven Sisters mounted print" />
        </div>
      </div>
      <article className="product-information">
        <p className="eyebrow">Soft Launch · PS-002</p>
        <h1>Seven Sisters from the Gardens</h1>
        <p className="product-place">Seven Sisters, East Sussex</p>
        <form className="product-options">
          <fieldset>
            <legend>Select size</legend>
            <div className="option-grid option-grid--three">
              {['Small', 'Medium', 'Large'].map((label, index) => (
                <label key={label}>
                  <input type="radio" name="story-size" defaultChecked={index === 0} />
                  <span className="visually-hidden">Choose {label}</span>
                  <span>
                    <strong>{label}</strong>
                    <small>{['7 × 5', 'A4', 'A3'][index]}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Framing</legend>
            <div className="option-grid option-grid--two">
              {['Unframed', 'Framed'].map((label, index) => (
                <label key={label}>
                  <input type="radio" name="story-frame" defaultChecked={index === 1} />
                  <span className="visually-hidden">Choose {label}</span>
                  <span>
                    <strong>{label}</strong>
                    <small>{index === 0 ? 'Print only' : 'One frame style'}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </form>
        <section className="commerce-coming-soon">
          <p className="eyebrow">Alpha preview</p>
          <p className="commerce-coming-soon__title">Online shop coming soon</p>
          <p>No fake price, stock or checkout is shown.</p>
        </section>
      </article>
    </main>
  ),
};

export const ProductGalleryOneImage: Story = {
  render: () => <ProductGalleryPreview count={1} />,
};

export const ProductGalleryThreeImages: Story = {
  render: () => <ProductGalleryPreview count={3} />,
};

export const ProductGalleryFiveImages: Story = {
  render: () => <ProductGalleryPreview count={5} />,
};

export const ProductShareFallbackAndFocus: Story = {
  render: () => (
    <main className="product-layout">
      <ProductGalleryPreview count={3} focused />
      <article className="product-information">
        <p className="eyebrow">Share fallback · focused gallery</p>
        <h1>Seven Sisters from the Gardens</h1>
        <div className="product-actions" aria-label="Share this artwork">
          <button className="text-link" type="button">
            Share artwork
          </button>
          <button className="text-link" type="button">
            Copy link
          </button>
          <p role="status">Link copied to clipboard.</p>
        </div>
      </article>
    </main>
  ),
};

export const ProductNarrowMobile: Story = {
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
  render: () => (
    <main className="product-page">
      <div className="product-layout">
        <ProductGalleryPreview count={5} />
        <article className="product-information">
          <p className="eyebrow">Soft Launch · PS-002</p>
          <h1>Seven Sisters from the Gardens</h1>
          <p className="product-place">Seven Sisters, East Sussex</p>
          <section className="commerce-coming-soon">
            <p className="eyebrow">Alpha preview</p>
            <p className="commerce-coming-soon__title">Online shop coming soon</p>
          </section>
        </article>
      </div>
    </main>
  ),
};

export const CartEmptyState: Story = {
  render: () => (
    <main className="cart-page">
      <section className="cart-paper">
        <div className="cart-paper__header">
          <p className="eyebrow">Paperseal · Alpha</p>
          <span>0 items</span>
        </div>
        <h1>Your cart is waiting for the shop.</h1>
        <div className="cart-empty-state">
          <p className="cart-empty-state__title">Online shop and checkout coming soon.</p>
          <p>There is no pretend basket here.</p>
          <a className="button-link button-link--navy" href="#artworks">
            Continue browsing artworks
          </a>
        </div>
      </section>
    </main>
  ),
};

export const PolicyTypographyMobile: Story = {
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
  render: () => (
    <main className="institutional-page">
      <header className="institutional-hero">
        <p className="eyebrow">Returns · Paperseal</p>
        <h1>Human help, without a portal.</h1>
        <p>Warm, direct policy presentation at a realistic mobile width.</p>
      </header>
      <aside className="institutional-status">
        <p className="eyebrow">Current status</p>
        <p>Alpha review: final policy copy is still being prepared.</p>
      </aside>
      <div className="institutional-content">
        <section>
          <h2>How help will work</h2>
          <p>
            Returns and damaged-item cases will be handled manually by email once commerce launches.
          </p>
        </section>
      </div>
    </main>
  ),
};
