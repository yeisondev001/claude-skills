import { getAvailableFonts } from "@remotion/google-fonts";
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import type { Marca } from "./datos";

const cargadas = new Map<string, Promise<void>>();

const cargar = (familia: string) => {
  if (!cargadas.has(familia)) {
    const fuente = getAvailableFonts().find((f) => f.fontFamily === familia);
    if (!fuente) throw new Error(`La fuente "${familia}" no está en Google Fonts. Revisa marca.json`);
    cargadas.set(
      familia,
      fuente.load().then(async (m) => {
        const info = m.getInfo();
        const pesos = Object.keys(info.fonts.normal ?? {}).filter((p) => ["400", "500", "600", "700", "800"].includes(p));
        await m
          .loadFont("normal", { weights: pesos, subsets: ["latin", "latin-ext"].filter((s) => info.subsets.includes(s)) })
          .waitUntilDone();
      }),
    );
  }
  return cargadas.get(familia)!;
};

/** Carga las fuentes de la marca antes de pintar ningún fotograma. */
export const useFuentes = (marca: Marca) => {
  const [handle] = useState(() => delayRender("Cargando fuentes"));
  useEffect(() => {
    Promise.all(Object.values(marca.fuentes).map(cargar))
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle, marca]);
};

export const familia = (nombre: string, respaldo = "sans-serif") => `'${nombre}', ${respaldo}`;
