import type { Preview } from '@storybook/react';
import '../src/styles/global.scss';
import '../src/styles/home.scss';

const preview: Preview = {
  parameters: {
    backgrounds: { default: 'paper', values: [{ name: 'paper', value: '#f3ede2' }] },
    controls: { expanded: true },
    viewport: {
      viewports: {
        papersealMobile: {
          name: 'Paperseal mobile',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
};

export default preview;
