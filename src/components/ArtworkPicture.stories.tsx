import type { Meta, StoryObj } from '@storybook/react';
import { BoundaryNote, PreviewFrame } from './storybookPreview';

const meta = { title: 'Atoms/ArtworkPicture' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const ResponsiveSource: Story = {
  render: () => (
    <PreviewFrame>
      <BoundaryNote>Responsive image primitive</BoundaryNote>
      <img
        src="/images/artworks/seven-sisters/flat-720.jpg"
        width="720"
        height="540"
        alt="Seven Sisters print"
      />
    </PreviewFrame>
  ),
};

export const MissingAssetFallback: Story = {
  render: () => (
    <PreviewFrame>
      <BoundaryNote>Fallback state</BoundaryNote>
      <p role="status">Artwork image unavailable.</p>
    </PreviewFrame>
  ),
};
