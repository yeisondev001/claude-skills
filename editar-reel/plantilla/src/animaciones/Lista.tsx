import { familia } from "../fuentes";
import { Colocar, lineal, numeroCapitulo, PropsAnimacion, Tarjeta, useTiempo } from "./comun";
import { Icono } from "./iconos";

type Item = { texto: string; ms?: number };

/**
 * Lista que se va marcando mientras la enumero, con contador "3 / 8".
 * props: { titulo, items: [{ texto, ms }] } — ms = palabra en la que se nombra (línea de tiempo cortada).
 */
export const Lista: React.FC<PropsAnimacion> = ({ a, d, zona }) => {
  const { abs, entrada, salida } = useTiempo(a);
  const { titulo, items = [] } = a.props as { titulo?: string; items?: Item[] };
  const { colores, fuentes } = d.marca;
  const columnas = items.length > 3 ? 2 : 1;
  const filas = Math.ceil(items.length / columnas);
  const hechos = items.filter((it) => it.ms !== undefined && abs >= it.ms).length;

  return (
    <Colocar zona={zona} ancho={900} alto={110 + filas * 84}>
      <Tarjeta
        marca={d.marca}
        numero={numeroCapitulo(d, a.desdeMs)}
        titulo={titulo}
        contador={`${hechos} / ${items.length}`}
        ancho={900}
        entrada={entrada}
        salida={salida}
      >
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columnas}, 1fr)`, gap: 14 }}>
          {items.map((it, i) => {
            const marca = it.ms === undefined ? 0 : lineal(abs, [it.ms, it.ms + 160], [0, 1]);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  height: 70,
                  padding: "0 18px",
                  borderRadius: 10,
                  border: marca > 0 ? `2.5px solid ${colores.tinta}` : "2.5px dashed #b9b9b3",
                  background: marca > 0 ? "#ffffff" : "transparent",
                  transform: `scale(${1 + 0.04 * Math.sin(Math.PI * marca)})`,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: 7,
                    border: marca > 0 ? "none" : "2.5px solid #9d9d97",
                    background: marca > 0 ? colores.verde : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {marca > 0 ? <Icono nombre="check" tamano={30} color="#fff" grosor={3} /> : null}
                </div>
                <span
                  style={{
                    fontFamily: familia(fuentes.ui),
                    fontWeight: 600,
                    fontSize: 30,
                    color: marca > 0 ? colores.tinta : "#7d7d78",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {it.texto}
                </span>
              </div>
            );
          })}
        </div>
      </Tarjeta>
    </Colocar>
  );
};
