import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { CartTriggerPreview } from './CartTriggerPreview';

const meta = {
  title: 'Molecules/CartTrigger',
  component: CartTriggerPreview,
  parameters: {
    docs: {
      description: {
        component:
          'The production Astro button delegates opening to Snipcart with snipcart-checkout. Snipcart updates the badge through snipcart-items-count.',
      },
    },
  },
} satisfies Meta<typeof CartTriggerPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { quantity: 0 } };
export const WithItems: Story = { args: { quantity: 3 } };
export const SingleItem: Story = { args: { quantity: 1 } };
export const SnipcartHooks: Story = {
  args: { quantity: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Open cart' });
    await expect(button).toHaveClass('snipcart-checkout');
    await expect(canvas.getByText('2')).toHaveClass('snipcart-items-count');
  },
};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'papersealMobile' } } };
