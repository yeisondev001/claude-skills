// Empaquetado de Remotion compartido por renderizar.mjs y revisar.mjs.
import {bundle} from "@remotion/bundler";
import {selectComposition} from "@remotion/renderer";
import path from "node:path";

export const empaquetar = async () => {
  process.stdout.write("Preparando el proyecto de Remotion… ");
  const url = await bundle({entryPoint: path.resolve("src/index.ts"), rspack: true});
  console.log("listo");
  return url;
};

export const composicion = (serveUrl, id, slug, extra = {}) =>
  selectComposition({serveUrl, id, inputProps: {slug}, ...extra});

export const leerArgs = (argv) => {
  const slug = argv.find((a) => !a.startsWith("--"));
  if (!slug) {
    console.error("Falta el slug del vídeo.");
    process.exit(1);
  }
  return {slug, flags: new Set(argv.filter((a) => a.startsWith("--")))};
};
