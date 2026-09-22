import type { Meta, StoryObj } from '@storybook/react';
import { BoundaryNote, PreviewFrame } from './storybookPreview';

const meta = { title: 'Organisms/SiteFooter', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <PreviewFrame>
      <footer className="site-footer">
        <BoundaryNote>Site footer</BoundaryNote>
        <nav aria-label="Explore">
          <a href="#prints">All artworks</a>
          <a href="#story">Our story</a>
        </nav>
      </footer>
    </PreviewFrame>
  ),
};
