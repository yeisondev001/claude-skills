import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Rect } from "../camara";
import { Animacion, Datos, K, Marca } from "../datos";
import { familia } from "../fuentes";

export type PropsAnimacion = { a: Animacion; d: Datos; zona: Rect };

export const lineal = (t: number, rango: [number, number], salida: [number, number], easing = Easing.out(Easing.cubic)) =>
  interpolate(t, rango, salida, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Milisegundos desde que empezó la animación, su duración y las curvas de entrada y salida. */
export const useTiempo = (a: { desdeMs: number; hastaMs: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const dur = a.hastaMs - a.desdeMs;
  const entrada = lineal(t, [0, K.animaciones.entradaMs], [0, 1], Easing.out(Easing.back(1.5)));
  const salida = lineal(t, [dur - K.animaciones.salidaMs, dur], [1, 0], Easing.in(Easing.cubic));
  return { t, dur, entrada, salida, abs: a.desdeMs + t };
};

/** Diseña a tamaño fijo y lo encaja en el hueco: centrado en horizontal, pegado arriba (bajo los subtítulos). */
export const Colocar: React.FC<{ zona: Rect; ancho: number; alto: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  zona,
  ancho,
  alto,
  children,
  style,
}) => {
  const s = Math.min(1, zona.width / ancho, zona.height / alto);
  return (
    <div
      style={{
        position: "absolute",
        left: zona.left + zona.width / 2 - ancho / 2,
        top: zona.top,
        width: ancho,
        height: alto,
        transform: `scale(${s})`,
        transformOrigin: "top center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Número ("01", "02"…) del capítulo en curso en ese momento, o undefined si no hay capítulos. */
export const numeroCapitulo = (d: Datos, ms: number) => {
  const i = (d.plan.capitulos ?? []).filter((c) => c.desdeMs <= ms).length;
  return i > 0 ? String(i).padStart(2, "0") : undefined;
};

/** Escuadras de las esquinas (el marco de visor que rodea las tarjetas). */
export const Escuadras: React.FC<{ color: string; separacion?: number; largo?: number }> = ({ color, separacion = 14, largo = 34 }) => {
  const g = 4;
  const lado = (pos: React.CSSProperties, bordes: React.CSSProperties) => (
    <div style={{ position: "absolute", width: largo, height: largo, ...pos, ...bordes }} />
  );
  const b = `${g}px solid ${color}`;
  return (
    <>
      {lado({ left: -separacion, top: -separacion }, { borderLeft: b, borderTop: b })}
      {lado({ right: -separacion, top: -separacion }, { borderRight: b, borderTop: b })}
      {lado({ left: -separacion, bottom: -separacion }, { borderLeft: b, borderBottom: b })}
      {lado({ right: -separacion, bottom: -separacion }, { borderRight: b, borderBottom: b })}
    </>
  );
};

/** Tarjeta clara con cabecera en monoespaciada: "01 LO QUE PUEDE CONSULTAR      3 / 8". */
export const Tarjeta: React.FC<{
  marca: Marca;
  numero?: string;
  titulo?: string;
  contador?: string;
  ancho: number;
  entrada: number;
  salida: number;
  children: React.ReactNode;
}> = ({ marca, numero, titulo, contador, ancho, entrada, salida, children }) => {
  const { colores, fuentes } = marca;
  return (
    <div
      style={{
        position: "relative",
        width: ancho,
        background: colores.fondo,
        borderRadius: 18,
        padding: "22px 26px 26px",
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
        opacity: Math.min(1, entrada * 1.4) * salida,
        transform: `scale(${0.94 + 0.06 * entrada})`,
      }}
    >
      <Escuadras color={colores.menta} />
      {titulo || contador ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: familia(fuentes.mono, "monospace"),
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: colores.tinta,
            marginBottom: 18,
          }}
        >
          <span>
            {numero ? <span style={{ color: colores.verde, marginRight: 14 }}>{numero}</span> : null}
            {titulo}
          </span>
          <span>{contador}</span>
        </div>
      ) : null}
      {children}
    </div>
  );
};
