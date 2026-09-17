import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://paperseal.co.uk',
  integrations: [react()],
  output: 'static',
});
