// Paso 8: saca un fotograma de cada animación (y algunos solo con subtítulos) y monta una hoja de revisión.
//
// Uso: node herramientas/revisar.mjs <slug> [--antes-despues] [--ms 1200,5300]   (--ms: momentos extra)
import {openBrowser, renderStill} from "@remotion/renderer";
import {execFileSync} from "node:child_process";
import {mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {composicion, empaquetar, leerArgs} from "./motor.mjs";

const args = process.argv.slice(2);
const {slug, flags} = leerArgs(args);
const id = flags.has("--antes-despues") ? "ReelAntesDespues" : "Reel";
const extra = (args[args.indexOf("--ms") + 1] ?? "").split(",").filter((x) => args.includes("--ms") && x).map(Number);

const K = JSON.parse(readFileSync("src/constantes.json", "utf8"));
const carpeta = path.join("public", "videos", slug);
const plan = JSON.parse(readFileSync(path.join(carpeta, "plan.json"), "utf8"));
const {duracionNueva} = JSON.parse(readFileSync(path.join(carpeta, "cortes.json"), "utf8"));

// Momentos a revisar: el primer fotograma, cada capítulo y animación ya montados, y huecos solo con subtítulos.
const momentos = [{ms: 0, etiqueta: "primer fotograma (portada)"}];
for (const c of plan.capitulos ?? []) {
  momentos.push({ms: c.desdeMs + K.animaciones.capitulo.barridoMs * 0.5, etiqueta: "capítulo: barrido de entrada"});
  momentos.push({ms: c.hastaMs - K.animaciones.capitulo.salidaMs - 120, etiqueta: `capítulo: ${[].concat(c.titulo).join(" ")}`.slice(0, 60)});
}
const ultimo = (lista) => Math.max(0, ...(lista ?? []).map((i) => (i.ms ?? 0) + 350));
for (const a of plan.animaciones ?? []) {
  const dur = a.hastaMs - a.desdeMs;
  let ms = a.desdeMs + Math.max(K.animaciones.entradaMs + 150, dur * 0.45);
  if (a.tipo === "lista") ms = Math.max(ms, ultimo(a.props?.items));
  if (a.tipo === "flujo") ms = Math.max(ms, ultimo(a.props?.pasos));
  if (a.tipo === "chat") ms = Math.max(ms, ultimo(a.props?.mensajes));
  if (a.tipo === "cta" && a.props?.estilo === "lleno") ms = a.hastaMs - K.animaciones.salidaMs - 100;
  momentos.push({ms: Math.min(ms, a.hastaMs - 50), etiqueta: `${a.tipo}: ${a.frase ?? ""}`.slice(0, 60)});
}
const ocupados = [...(plan.animaciones ?? []), ...(plan.capitulos ?? [])];
const libre = (ms) => !ocupados.some((a) => ms > a.desdeMs - 400 && ms < a.hastaMs + 400);
for (let k = 1; k <= 3; k++) {
  const ms = (duracionNueva * 1000 * k) / 4;
  if (libre(ms)) momentos.push({ms, etiqueta: "solo subtítulos"});
}
for (const ms of extra) momentos.push({ms, etiqueta: "extra"});
momentos.sort((a, b) => a.ms - b.ms);

const salida = path.join(carpeta, "revision");
rmSync(salida, {recursive: true, force: true});
mkdirSync(salida, {recursive: true});

const serveUrl = await empaquetar();
const navegador = await openBrowser("chrome");
const comp = await composicion(serveUrl, id, slug, {puppeteerInstance: navegador});
const indice = [];
for (const m of momentos) {
  const frame = Math.min(comp.durationInFrames - 1, Math.max(0, Math.round((m.ms / 1000) * K.fps)));
  const archivo = path.join(salida, `f${String(frame).padStart(5, "0")}.jpg`);
  await renderStill({serveUrl, composition: comp, frame, output: archivo, imageFormat: "jpeg", jpegQuality: 80, scale: 0.5, puppeteerInstance: navegador, inputProps: {slug}});
  indice.push({...m, frame, archivo: path.basename(archivo)});
  process.stdout.write(".");
}
await navegador.close({silent: true});
writeFileSync(path.join(salida, "indice.json"), JSON.stringify(indice, null, 2));
console.log(`\n${indice.length} fotogramas`);
execFileSync("python", ["herramientas/hoja.py", slug], {stdio: "inherit"});
