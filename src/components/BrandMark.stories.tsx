import type { Meta, StoryObj } from '@storybook/react';
import { BoundaryNote, PreviewFrame } from './storybookPreview';
import seal from '../assets/brand/paperseal-seal.png';

const sealUrl = typeof seal === 'string' ? seal : seal.src;

const meta = { title: 'Atoms/BrandMark' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PreviewFrame>
      <BoundaryNote>Brand mark</BoundaryNote>
      <span className="brand-mark">
        <img className="brand-mark__seal" src={sealUrl} alt="" width="96" height="96" />
        <span className="brand-mark__type">
          <span className="brand-mark__name">The Paper Seal</span>
          <span className="brand-mark__descriptor">Studio</span>
        </span>
      </span>
    </PreviewFrame>
  ),
};
