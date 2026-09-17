import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundations/Coming Soon',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => <p style={{ padding: '2rem' }}>Paperseal coming soon</p>,
};
