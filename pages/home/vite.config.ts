import { defineConfig } from "vite";
import { million } from "million/vite-plugin-million";
import unocss from "unocss/vite";
import { presetWind, presetIcons } from "unocss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    million({ react: true }),
    unocss({
      presets: [presetIcons(), presetWind()],
    }),
  ],
});
