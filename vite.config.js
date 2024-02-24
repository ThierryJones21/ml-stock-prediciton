import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  server: {
    port: "3000",
    fs: {
      // Allow import from /src/lib/ folder
      allow: [".."]
    },
  },
  plugins: [sveltekit()], 
};

export default config;
