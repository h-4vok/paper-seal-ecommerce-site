import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { resolve } from 'node:path';
import { resolveSiteOrigin } from './scripts/site-origin.mjs';

const copyDirectory = resolve('content/copy/en-GB').replaceAll('\\', '/');
const copyLoader = resolve('src/content/copy.ts').replaceAll('\\', '/');
const site = resolveSiteOrigin({
  context: process.env.CONTEXT,
  deployPrimeUrl: process.env.DEPLOY_PRIME_URL,
  siteOrigin: process.env.SITE_ORIGIN,
});

const copyHotReload = {
  name: 'copy-hot-reload',
  handleHotUpdate({ file, server }) {
    const normalizedFile = file.replaceAll('\\', '/');

    if (normalizedFile.startsWith(`${copyDirectory}/`)) {
      for (const module of server.moduleGraph.getModulesByFile(copyLoader) ?? []) {
        server.moduleGraph.invalidateModule(module);
      }
      server.ws.send({ type: 'full-reload' });
      return [];
    }
  },
};

export default defineConfig({
  site,
  integrations: [react()],
  vite: {
    plugins: [copyHotReload],
  },
  output: 'static',
  devToolbar: { enabled: false },
});
