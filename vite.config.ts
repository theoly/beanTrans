import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    compression({
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024, // generate .gz for files > 1kb
    })
  ],
  base: '/bean/',
})
