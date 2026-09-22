import type { Preview } from '@storybook/react';
import '../src/styles/global.scss';
import '../src/styles/home.scss';
import '../src/styles/catalogue.scss';
import '../src/styles/product.scss';
import '../src/styles/institutional.scss';

const preview: Preview = {
  parameters: {
    backgrounds: { default: 'paper', values: [{ name: 'paper', value: '#f3ede2' }] },
    controls: { expanded: true },
    a11y: { test: 'error' },
    viewport: {
      viewports: {
        papersealMobile: {
          name: 'The Paper Seal Studio mobile',
          styles: { width: '390px', height: '844px' },
        },
        papersealDesktop: {
          name: 'The Paper Seal Studio desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
