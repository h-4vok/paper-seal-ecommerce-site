import type { Meta, StoryObj } from '@storybook/react';
import { BoundaryNote, PreviewFrame } from './storybookPreview';

const meta = { title: 'Molecules/ArtworkCard' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PreviewFrame>
      <BoundaryNote>Artwork card</BoundaryNote>
      <article className="artwork-card">
        <a href="#artwork">
          <div className="artwork-card__media">
            <img
              src="/images/artworks/flower-bed/flat-720.jpg"
              width="720"
              height="540"
              alt="Flower Bed artwork"
            />
          </div>
          <div className="artwork-card__caption">
            <h2>Flower Bed</h2>
            <p>Eastbourne · PS-001</p>
            <span>View print →</span>
          </div>
        </a>
      </article>
    </PreviewFrame>
  ),
};
