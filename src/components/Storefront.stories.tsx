import type { Meta, StoryObj } from '@storybook/react';
import { parse } from 'yaml';
import productYaml from '../../content/copy/en-GB/product.yaml?raw';
import storiesYaml from '../../content/copy/en-GB/stories.yaml?raw';

const stories = parse(storiesYaml) as Record<string, string>;
const product = parse(productYaml) as {
  labels: {
    size: string;
    framing: string;
    commerceEyebrow: string;
    noStock: string;
    shareGroup: string;
    share: string;
    copyLink: string;
    linkCopied: string;
  };
  sizes: Array<{ id: string; label: string; dimensions: string }>;
  framing: Array<{ id: string; label: string; detail: string }>;
};

type GalleryKind = 'room';

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

const galleryKinds: GalleryKind[] = ['room', 'room'];

const ProductGalleryPreview = ({
  count,
  focused = false,
}: {
  count: 1 | 2 | 5;
  focused?: boolean;
}) => {
  const images = Array.from(
    { length: count },
    (_, index) => galleryKinds[index % galleryKinds.length],
  );
  return (
    <div
      className="product-gallery"
      aria-label={stories.galleryExample.replace('{count}', String(count))}
    >
      <div
        className="product-gallery__stage"
        style={
          focused ? { outline: '0.18rem solid var(--color-focus)', outlineOffset: '-0.3rem' } : {}
        }
      >
        <div className="product-gallery__slide">
          <Picture asset="seven-sisters" kind={images[0]} alt={stories.galleryPreviewAlt} />
        </div>
        {count > 1 && (
          <>
            <button
              className="gallery-arrow gallery-arrow--previous"
              type="button"
              aria-label={stories.previousImage}
            >
              ←
            </button>
            <button
              className="gallery-arrow gallery-arrow--next"
              type="button"
              aria-label={stories.nextImage}
            >
              →
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="product-gallery__dots" aria-label={stories.chooseGalleryImage}>
          {images.map((kind, index) => (
            <button
              key={`${kind}-${index}`}
              type="button"
              aria-label={stories.showImage.replace('{number}', String(index + 1))}
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
              aria-label={stories.showImage.replace('{number}', String(index + 1))}
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
    <a
      href="#product"
      aria-label={stories.viewCard.replace('{title}', title).replace('{place}', place)}
    >
      <div className="artwork-card__media">
        <Picture asset={asset} alt={stories.mountedPrint.replace('{title}', title)} />
      </div>
      <div className="artwork-card__caption">
        <div>
          <h2>{title}</h2>
          <p>{place} · PS-000</p>
        </div>
        <p className="artwork-card__description">{stories.cardDescription}</p>
        <span aria-hidden="true">{stories.viewPrint} →</span>
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
        <p className="eyebrow">{stories.mixedPair}</p>
        <p>{stories.twoArtworks}</p>
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
        <p className="eyebrow">{stories.noArtworks}</p>
        <h2>{stories.tryAnother}</h2>
        <button
          className="button-link button-link--navy"
          type="button"
          style={{ outline: '0.18rem solid var(--color-focus)', outlineOffset: '0.24rem' }}
        >
          {stories.resetCatalogue}
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
          <Picture asset="seven-sisters" alt={stories.mountedProductAlt} />
        </div>
      </div>
      <article className="product-information">
        <p className="eyebrow">{stories.softLaunch}</p>
        <h1>{stories.productTitle}</h1>
        <p className="product-place">{stories.productPlace}</p>
        <form className="product-options">
          <fieldset>
            <legend>{product.labels.size}</legend>
            <div className="option-grid option-grid--three">
              {product.sizes.map((size, index) => (
                <label key={size.id}>
                  <input type="radio" name="story-size" defaultChecked={index === 0} />
                  <span className="visually-hidden">
                    {stories.choose.replace('{label}', size.label)}
                  </span>
                  <span>
                    <strong>{size.label}</strong>
                    <small>{size.dimensions}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{product.labels.framing}</legend>
            <div className="option-grid option-grid--two">
              {product.framing.map((frame, index) => (
                <label key={frame.id}>
                  <input type="radio" name="story-frame" defaultChecked={index === 1} />
                  <span className="visually-hidden">
                    {stories.choose.replace('{label}', frame.label)}
                  </span>
                  <span>
                    <strong>{frame.label}</strong>
                    <small>{frame.detail}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </form>
        <section className="commerce-coming-soon">
          <p className="eyebrow">{product.labels.commerceEyebrow}</p>
          <p className="commerce-coming-soon__title">{product.labels.noStock}</p>
          <p>{stories.noFakeCommerce}</p>
        </section>
      </article>
    </main>
  ),
};

export const ProductGalleryOneImage: Story = {
  render: () => <ProductGalleryPreview count={1} />,
};

export const ProductGalleryThreeImages: Story = {
  render: () => <ProductGalleryPreview count={2} />,
};

export const ProductGalleryFiveImages: Story = {
  render: () => <ProductGalleryPreview count={5} />,
};

export const ProductShareFallbackAndFocus: Story = {
  render: () => (
    <main className="product-layout">
      <ProductGalleryPreview count={2} focused />
      <article className="product-information">
        <p className="eyebrow">{stories.shareFallback}</p>
        <h1>{stories.productTitle}</h1>
        <div className="product-actions" aria-label={product.labels.shareGroup}>
          <button className="text-link" type="button">
            {product.labels.share}
          </button>
          <button className="text-link" type="button">
            {product.labels.copyLink}
          </button>
          <p role="status">{product.labels.linkCopied}</p>
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
        <ProductGalleryPreview count={2} />
        <article className="product-information">
          <p className="eyebrow">{stories.softLaunch}</p>
          <h1>{stories.productTitle}</h1>
          <p className="product-place">{stories.productPlace}</p>
          <section className="commerce-coming-soon">
            <p className="eyebrow">{product.labels.commerceEyebrow}</p>
            <p className="commerce-coming-soon__title">{product.labels.noStock}</p>
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
          <p className="eyebrow">{stories.papersealAlpha}</p>
          <span>{stories.zeroItems}</span>
        </div>
        <h1>{stories.cartHeading}</h1>
        <div className="cart-empty-state">
          <p className="cart-empty-state__title">{stories.cartEmptyTitle}</p>
          <p>{stories.cartEmptyCopy}</p>
          <a className="button-link button-link--navy" href="#artworks">
            {stories.continueBrowsing}
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
        <p className="eyebrow">{stories.returnsPaperseal}</p>
        <h1>{stories.policyHeading}</h1>
        <p>{stories.policyIntro}</p>
      </header>
      <aside className="institutional-status">
        <p className="eyebrow">{stories.currentStatus}</p>
        <p>{stories.policyStatus}</p>
      </aside>
      <div className="institutional-content">
        <section>
          <h2>{stories.policySection}</h2>
          <p>{stories.policyCopy}</p>
        </section>
      </div>
    </main>
  ),
};
