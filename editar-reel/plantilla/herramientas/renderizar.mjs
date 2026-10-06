// Paso 8 (final): renderiza el reel y deja el audio a -14 LUFS.
//
// Uso: node herramientas/renderizar.mjs <slug> [--antes-despues] [--borrador]
//   --borrador  mitad de resolución y más rápido, para revisar
import {renderMedia} from "@remotion/renderer";
import {execFileSync} from "node:child_process";
import {mkdirSync, rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {composicion, empaquetar, leerArgs} from "./motor.mjs";

const {slug, flags} = leerArgs(process.argv.slice(2));
const antesDespues = flags.has("--antes-despues");
const borrador = flags.has("--borrador");
const id = antesDespues ? "ReelAntesDespues" : "Reel";
const nombre = `${slug}${antesDespues ? "-antes-despues" : ""}${borrador ? "-borrador" : ""}`;

mkdirSync("out", {recursive: true});
const crudo = path.join("out", `${nombre}.sin-masterizar.mp4`);
const final = path.join("out", `${nombre}.mp4`);

const serveUrl = await empaquetar();
const comp = await composicion(serveUrl, id, slug);
const t0 = Date.now();
let ultimo = -1;
await renderMedia({
  serveUrl,
  composition: comp,
  inputProps: {slug},
  codec: "h264",
  crf: borrador ? 26 : 18,
  scale: borrador ? 0.5 : 1,
  imageFormat: "jpeg",
  jpegQuality: borrador ? 70 : 92,
  concurrency: Math.max(1, os.cpus().length - 1),
  outputLocation: crudo,
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 10);
    if (p !== ultimo) {
      ultimo = p;
      process.stdout.write(`${p * 10}% `);
    }
  },
});
console.log(`\nRenderizado en ${Math.round((Date.now() - t0) / 1000)} s`);

execFileSync("python", ["herramientas/masterizar.py", crudo, final], {stdio: "inherit"});
rmSync(crudo, {force: true});
console.log(`Vídeo listo: ${path.resolve(final)}`);
