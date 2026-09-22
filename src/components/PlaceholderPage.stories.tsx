import type { Meta, StoryObj } from '@storybook/react';
import { BoundaryNote, PreviewFrame } from './storybookPreview';

const meta = {
  title: 'Templates/PlaceholderPage',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Status: Story = {
  render: () => (
    <PreviewFrame>
      <main className="placeholder-page">
        <section className="placeholder-page__paper">
          <BoundaryNote>Coming soon</BoundaryNote>
          <h1>Contact</h1>
          <p role="status">This route is being prepared.</p>
        </section>
      </main>
    </PreviewFrame>
  ),
};
