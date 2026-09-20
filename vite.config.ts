import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteExternalsPlugin } from 'vite-plugin-externals'
import { resolve } from 'node:path'
import cdnConfig from './cdn.config.json'
import { childScssAdditionalData, childSharedAlias } from '../anlan-base/shared/vite-child-scss'
import {
  childBuildOptions,
  childEsbuildOptions,
  childExternals,
} from '../anlan-base/shared/vite-child-build'

const prodBase = `${cdnConfig.cdnOrigin}/micro-apps/${cdnConfig.appName}/latest/`

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    viteExternalsPlugin(childExternals()),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': childSharedAlias(__dirname),
    },
  },
  css: {
    preprocessorOptions: {
      scss: { additionalData: childScssAdditionalData(__dirname) },
    },
  },
  server: {
    port: cdnConfig.devPort,
    cors: true,
  },
  base: mode === 'production' ? prodBase : '/',
  build: childBuildOptions(),
  esbuild: childEsbuildOptions(mode),
}))
