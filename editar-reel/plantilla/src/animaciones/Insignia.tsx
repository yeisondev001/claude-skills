import { Easing, Img, staticFile } from "remotion";
import { familia } from "../fuentes";
import { Colocar, lineal, PropsAnimacion, useTiempo } from "./comun";
import { Icono } from "./iconos";

/**
 * Insignia del producto o herramienta que nombro (icono de app + nombre + línea pequeña).
 * props: { nombre, sub?, icono? (nombre de icono o "letra:C"), imagen? (archivo en public/), color? }
 */
export const Insignia: React.FC<PropsAnimacion> = ({ a, d, zona }) => {
  const { t, salida } = useTiempo(a);
  const { nombre = "", sub, icono, imagen, color } = a.props as {
    nombre?: string;
    sub?: string;
    icono?: string;
    imagen?: string;
    color?: string;
  };
  const { colores, fuentes } = d.marca;
  const pop = lineal(t, [0, 260], [0, 1], Easing.out(Easing.back(2)));
  const textoEntra = lineal(t, [120, 380], [0, 1]);

  return (
    <Colocar zona={zona} ancho={900} alto={150} style={{ alignItems: "flex-start", paddingLeft: 60, justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: salida }}>
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 24,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            transform: `scale(${pop})`,
            overflow: "hidden",
          }}
        >
          {imagen ? (
            <Img src={staticFile(imagen)} style={{ width: "78%", height: "78%", objectFit: "contain" }} />
          ) : (
            <Icono nombre={icono ?? `letra:${nombre.slice(0, 1)}`} tamano={70} color={color ?? colores.verde} grosor={2.2} />
          )}
        </div>
        <div style={{ opacity: textoEntra, transform: `translateX(${(1 - textoEntra) * -20}px)` }}>
          <div
            style={{
              fontFamily: familia(fuentes.ui),
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1,
              color: "#fff",
              textShadow: "0 3px 12px rgba(0,0,0,0.6)",
            }}
          >
            {nombre}
          </div>
          {sub ? (
            <div
              style={{
                marginTop: 8,
                fontFamily: familia(fuentes.mono, "monospace"),
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#e8e8e3",
                textShadow: "0 2px 6px rgba(0,0,0,0.7)",
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
      </div>
    </Colocar>
  );
};
