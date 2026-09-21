import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { resolve } from 'node:path';

const copyDirectory = resolve('content/copy/en-GB').replaceAll('\\', '/');

const copyHotReload = {
  name: 'copy-hot-reload',
  handleHotUpdate({ file, server }) {
    const normalizedFile = file.replaceAll('\\', '/');

    if (normalizedFile.startsWith(`${copyDirectory}/`)) {
      server.ws.send({ type: 'full-reload' });
      return [];
    }
  },
};

export default defineConfig({
  site: 'https://paperseal.co.uk',
  integrations: [react()],
  vite: {
    plugins: [copyHotReload],
  },
  output: 'static',
  devToolbar: { enabled: false },
});
