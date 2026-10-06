import { familia } from "../fuentes";
import { Colocar, lineal, PropsAnimacion, Tarjeta, useTiempo } from "./comun";

type Mensaje = { texto: string; de?: "yo" | "otro"; ms?: number };

/**
 * Conversación tipo app de mensajes: cada burbuja aparece cuando lo digo.
 * props: { nombre?, mensajes: [{ texto, de: "yo" | "otro", ms }] }
 */
export const Chat: React.FC<PropsAnimacion> = ({ a, d, zona }) => {
  const { abs, entrada, salida } = useTiempo(a);
  const { nombre = "", mensajes = [] } = a.props as { nombre?: string; mensajes?: Mensaje[] };
  const { colores, fuentes } = d.marca;

  return (
    <Colocar zona={zona} ancho={880} alto={150 + mensajes.length * 96}>
      <Tarjeta marca={d.marca} ancho={880} entrada={entrada} salida={salida}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: "2px solid #dcdcd6" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#cfcfc9" }} />
          <div style={{ fontFamily: familia(fuentes.ui) }}>
            <div style={{ fontWeight: 700, fontSize: 28, color: colores.tinta }}>{nombre}</div>
            <div style={{ fontSize: 20, color: "#8a8a85" }}>Activo ahora</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 18 }}>
          {mensajes.map((m, i) => {
            const p = m.ms === undefined ? 1 : lineal(abs, [m.ms, m.ms + 200], [0, 1]);
            const yo = m.de !== "otro";
            return (
              <div
                key={i}
                style={{
                  alignSelf: yo ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                  padding: "16px 24px",
                  borderRadius: 26,
                  borderBottomRightRadius: yo ? 6 : 26,
                  borderBottomLeftRadius: yo ? 26 : 6,
                  background: yo ? colores.verde : "#e2e2dc",
                  color: yo ? "#fff" : colores.tinta,
                  fontFamily: familia(fuentes.ui),
                  fontWeight: 600,
                  fontSize: 28,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 18}px) scale(${0.9 + 0.1 * p})`,
                  transformOrigin: yo ? "right bottom" : "left bottom",
                }}
              >
                {m.texto}
              </div>
            );
          })}
        </div>
      </Tarjeta>
    </Colocar>
  );
};
