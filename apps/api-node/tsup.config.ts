import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  outDir: "dist",
  // Bundle all @mycodexvantaos/* workspace packages into dist
  // so the Docker runtime does not need workspace resolution at start time.
  noExternal: [/^@mycodexvantaos\//],
  dts: false,
});
