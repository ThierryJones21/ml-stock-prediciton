import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "@sveltejs/adapter-auto";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),

    // Override http methods in the Todo forms
    // methodOverride: {
    // 	allowed: ['PATCH', 'DELETE']
    // }
  },

  preprocess: [vitePreprocess({})],
};

export default config;
