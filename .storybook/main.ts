import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal: async (config) => ({
    ...config,
    // Storybook copies public via staticDirs. Vite's default publicDir copy races that copy in Linux CI.
    publicDir: false,
  }),
};
export default config;
