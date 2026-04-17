import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Several files in `src/` are `.js` but contain JSX (e.g. context providers).
  // Tell Vite/esbuild to parse JSX in `.js` under `src/`.
  esbuild: {
    include: /src\/.*\.js$/,
    loader: 'jsx',
  },
})
