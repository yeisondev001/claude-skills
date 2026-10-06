// Paso 2: transcribe en local con whisper.cpp, con el tiempo de cada palabra.
//
// Uso:
//   node herramientas/transcribir.mjs <slug> [--modelo medium] [--idioma es]
//   node herramientas/transcribir.mjs <slug> --desde 41.5 --hasta 48   (solo ese tramo)
import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {parseArgs} from "node:util";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";

const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");
const WHISPER_VERSION = "1.6.0";

const {values, positionals} = parseArgs({
  allowPositionals: true,
  options: {
    modelo: {type: "string", default: "medium"},
    idioma: {type: "string", default: "es"},
    desde: {type: "string"},
    hasta: {type: "string"},
  },
});

const slug = positionals[0];
if (!slug) {
  console.error("Uso: node herramientas/transcribir.mjs <slug> [--desde s --hasta s]");
  process.exit(1);
}
const carpeta = path.join("public", "videos", slug);
const video = path.join(carpeta, "original.mp4");
if (!existsSync(video)) {
  console.error(`No existe ${video}. Ejecuta antes preparar.py`);
  process.exit(1);
}

await installWhisperCpp({to: WHISPER_PATH, version: WHISPER_VERSION, printOutput: false});
await downloadWhisperModel({folder: WHISPER_PATH, model: values.modelo, printOutput: false});

const desde = values.desde ? Number(values.desde) : null;
const hasta = values.hasta ? Number(values.hasta) : null;
const tramo = desde !== null || hasta !== null;

mkdirSync("temp", {recursive: true});
const wav = path.resolve("temp", `${slug}.wav`); // whisper se ejecuta desde su carpeta: ruta absoluta
const recorte = [];
if (desde !== null) recorte.push("-ss", String(desde));
if (hasta !== null) recorte.push("-to", String(hasta));
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", video, ...recorte, "-ar", "16000", "-ac", "1", wav]);

console.log(`Transcribiendo con whisper.cpp (${values.modelo}, ${values.idioma})… en este equipo tarda varios minutos`);
const t0 = Date.now();
const salida = await transcribe({
  inputPath: wav,
  model: values.modelo,
  whisperPath: WHISPER_PATH,
  whisperCppVersion: WHISPER_VERSION,
  tokenLevelTimestamps: true,
  // Un elemento por palabra. En whisper.cpp 1.6 --split-on-word es un interruptor sin valor,
  // por eso va en additionalArgs y no en splitOnWord (que añade "true" y rompe la llamada).
  tokensPerItem: 1,
  additionalArgs: ["--split-on-word"],
  language: values.idioma,
  translateToEnglish: false,
  printOutput: false,
});
rmSync(wav, {force: true});

const desplazamiento = (desde ?? 0) * 1000;
const nuevas = toCaptions({whisperCppOutput: salida})
  .captions.filter((c) => c.text.trim() !== "")
  .map((c) => ({
    ...c,
    startMs: c.startMs + desplazamiento,
    endMs: c.endMs + desplazamiento,
    timestampMs: c.timestampMs === null ? null : c.timestampMs + desplazamiento,
  }));

const destino = path.join(carpeta, "transcripcion-cruda.json");
let palabras = nuevas;
if (tramo && existsSync(destino)) {
  const ini = desde === null ? -Infinity : desde * 1000;
  const fin = hasta === null ? Infinity : hasta * 1000;
  const previas = JSON.parse(readFileSync(destino, "utf8"));
  palabras = [...previas.filter((c) => c.startMs < ini || c.startMs >= fin), ...nuevas].sort(
    (a, b) => a.startMs - b.startMs,
  );
}
writeFileSync(destino, JSON.stringify(palabras, null, 2));

console.log(`Hecho en ${Math.round((Date.now() - t0) / 1000)} s · ${palabras.length} palabras`);
execFileSync("python", ["herramientas/afinar.py", slug], {stdio: "inherit"});
console.log(`Guardado en ${path.join(carpeta, "transcripcion.json")}`);

// whisper a veces estira las últimas palabras sobre el silencio final.
const ultima = palabras[palabras.length - 1];
if (ultima && ultima.endMs - ultima.startMs > 1200) {
  const s = Math.max(0, ultima.startMs / 1000 - 4).toFixed(1);
  console.log(
    `\nAVISO: la última palabra ("${ultima.text.trim()}") dura ${((ultima.endMs - ultima.startMs) / 1000).toFixed(1)} s.` +
      `\nProbablemente whisper alargó el final. Vuelve a transcribir ese tramo:` +
      `\n  node herramientas/transcribir.mjs ${slug} --desde ${s}`,
  );
}
