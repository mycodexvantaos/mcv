import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  outDir: 'dist',
  // Do NOT externalize @mycodexvantaos/* packages — bundle them into dist
  // so the Docker runtime does not need workspace resolution at start time.
  dts: false,
});
