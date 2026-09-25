import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { HeaderPreview } from './storybookHeaderPreview';

const meta = { title: 'Organisms/SiteHeader', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => <HeaderPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open menu' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  },
};
export const MobileMenuOpen: Story = {
  render: () => <HeaderPreview initiallyOpen />,
  parameters: { viewport: { defaultViewport: 'papersealMobile' } },
};
