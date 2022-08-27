import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

import solid from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  // output: "server",
  // adapter: cloudflare({
  //   mode: "directory",
  // }),
  integrations: [
    tailwind(),
    // react(),
    solid(),
  ],
});
