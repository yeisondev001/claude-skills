import type { Caption } from "@remotion/captions";
import { getStaticFiles, staticFile } from "remotion";
import C from "./constantes.json";

export const K = C;

export type TipoAnimacion = "lista" | "flujo" | "chat" | "sello" | "cta" | "insignia" | "cifra";

export type Animacion = {
  tipo: TipoAnimacion;
  desdeMs: number;
  hastaMs: number;
  frase?: string;
  sfx?: string;
  props?: Record<string, unknown>;
};

export type Capitulo = {
  titulo: [string, string?] | string[];
  etiqueta: string; // texto corto de la etiqueta fija de arriba a la izquierda
  desdeMs: number;
  hastaMs: number;
  icono?: string;
  aviso?: string; // cinta amarilla del final, p. ej. "EN EL 04: UN CASO REAL"
  variante?: "normal" | "alerta";
};

export type Plan = {
  cta?: { palabra?: string; texto?: string };
  marca?: { colores?: Partial<Marca["colores"]>; fuentes?: Partial<Marca["fuentes"]> };
  camara?: { modo?: "cara" | "fijo" };
  diseno?: { lado?: "arriba" | "abajo" };
  capitulos?: Capitulo[];
  zooms?: { desdeMs: number; hastaMs: number; escala: number }[];
  animaciones?: Animacion[];
  musica?: { volumen?: number; bpm?: number; semilla?: number; estilo?: string };
};

export type Marca = {
  colores: { fondo: string; tinta: string; verde: string; menta: string; rojo: string; crema: string; amarillo: string };
  fuentes: { titulos: string; subtitulos: string; ui: string; mono: string };
};

export type MuestraCara = { t: number; ojosX: number; ojosY: number; x: number; y: number; w: number; h: number };
export type Cara = { intervalo: number; ancho: number; alto: number; muestras: MuestraCara[] };

export type Datos = {
  slug: string;
  ancho: number;
  alto: number;
  duracion: number;
  palabras: Caption[];
  cortes: number[];
  cara: Cara | null;
  plan: Plan;
  marca: Marca;
  volumenMusica: number[];
  hayMusica: boolean;
  haySfx: boolean;
};

export const archivo = (slug: string, nombre: string) => staticFile(`videos/${slug}/${nombre}`);

const leer = async <T,>(url: string): Promise<T | null> => {
  const r = await fetch(url);
  if (!r.ok) return null;
  return (await r.json()) as T;
};

const existe = (url: string) => getStaticFiles().some((f) => f.src === url);

export const cargarDatos = async (slug: string): Promise<Datos> => {
  const info = await leer<{ ancho: number; alto: number }>(archivo(slug, "info.json"));
  const cortes = await leer<{ duracionNueva: number; cortes: number[] }>(archivo(slug, "cortes.json"));
  if (!info || !cortes) {
    throw new Error(`Faltan info.json o cortes.json en public/videos/${slug}. Ejecuta preparar.py y cortar.py`);
  }
  const palabras = (await leer<Caption[]>(archivo(slug, "subtitulos.json"))) ?? [];
  const cara = await leer<Cara>(archivo(slug, "cara.json"));
  const plan = (await leer<Plan>(archivo(slug, "plan.json"))) ?? {};
  const base = (await leer<Marca>(staticFile("marca.json")))!;
  const marca: Marca = {
    colores: { ...base.colores, ...plan.marca?.colores },
    fuentes: { ...base.fuentes, ...plan.marca?.fuentes },
  };

  // Música por debajo de la voz: más baja mientras hablo, sube un poco en las pausas.
  const fps = K.fps;
  const total = Math.floor(cortes.duracionNueva * fps);
  const hablando = new Array<number>(total).fill(0);
  for (const p of palabras) {
    const a = Math.max(0, Math.floor(((p.startMs - 150) / 1000) * fps));
    const b = Math.min(total, Math.ceil(((p.endMs + 250) / 1000) * fps));
    for (let f = a; f < b; f++) hablando[f] = 1;
  }
  const mult = plan.musica?.volumen ?? 1;
  const crudo = hablando.map((h) => (h ? K.musica.volumenHablando : K.musica.volumenSilencio) * mult);
  const radio = 8;
  const volumenMusica = crudo.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - radio); j <= Math.min(total - 1, i + radio); j++) {
      s += crudo[j];
      n++;
    }
    return Number((s / n).toFixed(4));
  });

  return {
    slug,
    ancho: info.ancho,
    alto: info.alto,
    duracion: cortes.duracionNueva,
    palabras,
    cortes: cortes.cortes,
    cara: plan.camara?.modo === "fijo" ? null : cara,
    plan,
    marca,
    volumenMusica,
    hayMusica: existe(archivo(slug, "musica.wav")),
    haySfx: existe(archivo(slug, "sfx.wav")),
  };
};
