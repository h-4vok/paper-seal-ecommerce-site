import type { Meta, StoryObj } from '@storybook/react';
import { BoundaryNote, PreviewFrame } from './storybookPreview';

const meta = {
  title: 'Templates/InstitutionalPage',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Policy: Story = {
  render: () => (
    <PreviewFrame>
      <main className="institutional-page">
        <BoundaryNote>Returns</BoundaryNote>
        <h1>Returns policy</h1>
        <p>Clear policy content stays readable across widths.</p>
      </main>
    </PreviewFrame>
  ),
};
