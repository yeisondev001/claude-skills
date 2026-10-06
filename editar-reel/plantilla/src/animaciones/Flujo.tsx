import React from "react";
import { familia } from "../fuentes";
import { Colocar, lineal, numeroCapitulo, PropsAnimacion, Tarjeta, useTiempo } from "./comun";
import { Icono } from "./iconos";

type Paso = { texto: string; icono?: string; ms?: number };

/**
 * Pasos con icono que se encienden uno a uno y se unen con flechas (A → B → C).
 * props: { titulo?, pasos: [{ texto, icono, ms }], flechas?: true } — sin flechas sirve para "métricas".
 */
export const Flujo: React.FC<PropsAnimacion> = ({ a, d, zona }) => {
  const { abs, entrada, salida } = useTiempo(a);
  const { titulo, pasos = [], flechas = true } = a.props as { titulo?: string; pasos?: Paso[]; flechas?: boolean };
  const { colores, fuentes } = d.marca;
  const encendido = (p: Paso) => (p.ms === undefined ? 1 : lineal(abs, [p.ms, p.ms + 180], [0, 1]));

  return (
    <Colocar zona={zona} ancho={900} alto={titulo ? 300 : 250}>
      <Tarjeta marca={d.marca} numero={numeroCapitulo(d, a.desdeMs)} titulo={titulo} ancho={900} entrada={entrada} salida={salida}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, paddingTop: 8 }}>
          {pasos.map((p, i) => {
            const on = encendido(p);
            const siguiente = pasos[i + 1];
            return (
              <React.Fragment key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 170, opacity: 0.3 + 0.7 * on }}>
                  <div
                    style={{
                      position: "relative",
                      width: 104,
                      height: 104,
                      borderRadius: 16,
                      border: `3px solid ${colores.tinta}`,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${0.9 + 0.1 * on + 0.06 * Math.sin(Math.PI * on)})`,
                    }}
                  >
                    <Icono nombre={p.icono} tamano={54} color={colores.tinta} />
                    {on > 0.5 ? (
                      <div
                        style={{
                          position: "absolute",
                          right: -12,
                          top: -12,
                          width: 34,
                          height: 34,
                          borderRadius: 7,
                          background: colores.verde,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icono nombre="check" tamano={26} color="#fff" grosor={3} />
                      </div>
                    ) : null}
                  </div>
                  <span
                    style={{
                      marginTop: 12,
                      fontFamily: familia(fuentes.ui),
                      fontWeight: 600,
                      fontSize: 26,
                      color: colores.tinta,
                      textAlign: "center",
                      lineHeight: 1.1,
                    }}
                  >
                    {p.texto}
                  </span>
                </div>
                {flechas && siguiente ? (
                  <div style={{ width: 70, height: 104, display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        position: "relative",
                        height: 3,
                        width: `${100 * encendido(siguiente)}%`,
                        background: colores.tinta,
                        opacity: encendido(siguiente) > 0.02 ? 1 : 0,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          right: -2,
                          top: -7,
                          borderLeft: `12px solid ${colores.tinta}`,
                          borderTop: "8.5px solid transparent",
                          borderBottom: "8.5px solid transparent",
                        }}
                      />
                    </div>
                  </div>
                ) : !flechas && siguiente ? (
                  <div style={{ width: 20 }} />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </Tarjeta>
    </Colocar>
  );
};
