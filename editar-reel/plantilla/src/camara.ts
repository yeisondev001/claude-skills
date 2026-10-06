// Cámara virtual y maqueta.
//
// Estilo de referencia: el vídeo siempre a pantalla completa, los subtítulos en una línea fija
// y las tarjetas justo debajo de ellos. La cara se mantiene en un sitio estable de la pantalla, y la
// maqueta (dónde van subtítulos y tarjetas) se calcula una vez por vídeo a partir de dónde cae la
// cara: si hay sitio debajo de la barbilla va ahí (como en el ejemplo); si no, encima de la cabeza.
import { Datos, K } from "./datos";

export type Rect = { top: number; left: number; width: number; height: number };

const W_OUT = K.ancho;
const H_OUT = K.alto;

const suave = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const entre = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const mezcla = (a: number, b: number, p: number) => a + (b - a) * p;

/** 1 dentro de [a, b], con rampas suaves de `r` ms antes y después. */
export const peso = (t: number, a: number, b: number, r: number) =>
  Math.min(suave((t - (a - r)) / r), suave((b + r - t) / r));

const cacheZooms = new WeakMap<Datos, { t: number; z: number }[]>();
/** En cada corte cambia un poco el zoom para que parezca otro plano (sin cambiar demasiado seguido). */
const zoomPorCorte = (d: Datos, tMs: number) => {
  let tabla = cacheZooms.get(d);
  if (!tabla) {
    tabla = [{ t: 0, z: K.camara.zoomsPorCorte[0] }];
    for (const c of d.cortes) {
      if (c - tabla[tabla.length - 1].t >= K.camara.minimoEntreCambios) {
        tabla.push({ t: c, z: K.camara.zoomsPorCorte[tabla.length % K.camara.zoomsPorCorte.length] });
      }
    }
    cacheZooms.set(d, tabla);
  }
  let z = tabla[0].z;
  for (const e of tabla) if (e.t * 1000 <= tMs) z = e.z;
  return z;
};

const caraEn = (d: Datos, tMs: number) => {
  if (!d.cara || d.cara.muestras.length === 0) return null;
  const m = d.cara.muestras;
  const i = entre(tMs / 1000 / d.cara.intervalo, 0, m.length - 1);
  const a = m[Math.floor(i)];
  const b = m[Math.ceil(i)];
  const p = i - Math.floor(i);
  return {
    ojosX: mezcla(a.ojosX, b.ojosX, p),
    ojosY: mezcla(a.ojosY, b.ojosY, p),
    x: mezcla(a.x, b.x, p),
    y: mezcla(a.y, b.y, p),
    w: mezcla(a.w, b.w, p),
    h: mezcla(a.h, b.h, p),
  };
};

const mediana = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0.4;
};

const cacheOjos = new WeakMap<Datos, number>();
/** Altura de pantalla en la que se mantienen los ojos todo el vídeo: donde caen de forma natural. */
const ojosObjetivo = (d: Datos) => {
  let y = cacheOjos.get(d);
  if (y === undefined) {
    const s = Math.max(W_OUT / d.ancho, H_OUT / d.alto) * K.camara.zoomBase;
    const H = d.alto * s;
    const ey = d.cara ? mediana(d.cara.muestras.map((m) => m.ojosY)) : 0.4;
    y = entre((H_OUT - H) / 2 + ey * H, H_OUT * 0.2, H_OUT * 0.75);
    cacheOjos.set(d, y);
  }
  return y;
};

export type Estado = { video: Rect; cara: { top: number; bottom: number; left: number; right: number } | null };

export const camara = (d: Datos, tMs: number): Estado => {
  let z = K.camara.zoomBase * zoomPorCorte(d, tMs);
  for (const zm of d.plan.zooms ?? []) z *= 1 + (zm.escala - 1) * peso(tMs, zm.desdeMs, zm.hastaMs, K.camara.transicionMs);
  const s = Math.max(W_OUT / d.ancho, H_OUT / d.alto) * z;
  const W = d.ancho * s;
  const H = d.alto * s;
  const c = caraEn(d, tMs);
  const ex = c?.ojosX ?? 0.5;
  const ey = c?.ojosY ?? 0.4;
  const left = W >= W_OUT ? entre(W_OUT / 2 - ex * W, W_OUT - W, 0) : (W_OUT - W) / 2;
  const top = H >= H_OUT ? entre(ojosObjetivo(d) - ey * H, H_OUT - H, 0) : (H_OUT - H) / 2;
  return {
    video: { top, left, width: W, height: H },
    // Cara de cejas a barbilla (el pelo sí se puede tapar).
    cara: c ? { top: top + c.y * H, bottom: top + (c.y + c.h) * H, left: left + c.x * W, right: left + (c.x + c.w) * W } : null,
  };
};

export type Diseno = {
  lado: "arriba" | "abajo";
  subtitulos: Rect; // bloque de subtítulos
  zona: Rect; // hueco para tarjetas, debajo de los subtítulos
  etiquetaTop: number; // etiqueta fija del capítulo
};

const cacheDiseno = new WeakMap<Datos, Diseno>();
export const diseno = (d: Datos): Diseno => {
  const hecho = cacheDiseno.get(d);
  if (hecho) return hecho;

  let caraTop = H_OUT * 0.22;
  let caraBottom = H_OUT * 0.46;
  if (d.cara) {
    caraTop = Infinity;
    caraBottom = -Infinity;
    for (let t = 0; t <= d.duracion * 1000; t += 250) {
      const { cara } = camara(d, t);
      if (!cara) continue;
      caraTop = Math.min(caraTop, cara.top);
      caraBottom = Math.max(caraBottom, cara.bottom);
    }
  }
  const z = K.zonaSegura;
  const alto = K.subtitulos.altoBloque;
  const hayCapitulos = (d.plan.capitulos?.length ?? 0) > 0;
  const arriba = { ini: z.arriba + (hayCapitulos ? 90 : 16), fin: caraTop - 20 };
  const abajo = { ini: caraBottom + K.subtitulos.separacionCara, fin: H_OUT - z.abajo };
  const lado =
    d.plan.diseno?.lado ??
    (abajo.fin - abajo.ini >= alto + 320 ? "abajo" : arriba.fin - arriba.ini >= abajo.fin - abajo.ini ? "arriba" : "abajo");
  const banda = lado === "abajo" ? abajo : arriba;
  // La columna de botones de Instagram (derecha) solo ocupa la mitad de abajo.
  const left = z.izquierda;
  const width = W_OUT - left - (banda.fin > z.derechaDesde ? z.derecha : z.izquierda);
  const subtitulos = { top: banda.ini, left, width, height: alto };
  const zonaTop = banda.ini + alto + 6;
  const resultado: Diseno = {
    lado,
    subtitulos,
    zona: { top: zonaTop, left, width, height: Math.max(180, banda.fin - zonaTop) },
    etiquetaTop: z.arriba + 18,
  };
  cacheDiseno.set(d, resultado);
  return resultado;
};
