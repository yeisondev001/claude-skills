import { Easing } from "remotion";
import { familia } from "../fuentes";
import { Colocar, lineal, PropsAnimacion, useTiempo } from "./comun";

/** Sello de goma rojo que cae de golpe sobre una palabra fuerte. props: { texto, sub? } */
export const Sello: React.FC<PropsAnimacion> = ({ a, d, zona }) => {
  const { t, salida } = useTiempo(a);
  const { texto = "", sub } = a.props as { texto?: string; sub?: string };
  const { colores, fuentes } = d.marca;
  const golpe = lineal(t, [0, 140], [1.7, 1], Easing.in(Easing.quad));
  const temblor = t > 140 && t < 260 ? Math.sin(t / 12) * 3 : 0;

  return (
    <Colocar zona={zona} ancho={900} alto={sub ? 220 : 180} style={{ justifyContent: "center" }}>
      <div
        style={{
          padding: sub ? "10px 34px 14px" : "10px 34px",
          border: `6px solid ${colores.rojo}`,
          outline: `2px solid ${colores.rojo}`,
          outlineOffset: -14,
          background: colores.crema,
          transform: `rotate(-4deg) scale(${golpe}) translateX(${temblor}px)`,
          opacity: lineal(t, [0, 90], [0, 1]) * salida,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: familia(fuentes.titulos),
            fontSize: 92,
            lineHeight: 1.05,
            color: colores.rojo,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {texto}
        </div>
        {sub ? (
          <div
            style={{
              fontFamily: familia(fuentes.mono, "monospace"),
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "0.14em",
              color: colores.rojo,
              textTransform: "uppercase",
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </Colocar>
  );
};
