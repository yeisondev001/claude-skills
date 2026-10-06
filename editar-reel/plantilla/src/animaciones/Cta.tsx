import { K } from "../datos";
import { familia } from "../fuentes";
import { Colocar, Escuadras, PropsAnimacion, useTiempo } from "./comun";

/**
 * Llamada a la acción. Dos estilos:
 *  - "borde": recuadro menta "COMENTA MUSE" con una línea pequeña debajo (a mitad de vídeo).
 *  - "lleno": caja verde que escribe sola la palabra con cursor, y firma debajo (al final).
 * props: { estilo?, texto?, palabra?, sub?, firma? } — texto y palabra salen de plan.cta si no se dan.
 */
export const Cta: React.FC<PropsAnimacion> = ({ a, d, zona }) => {
  const { t, entrada, salida } = useTiempo(a);
  const props = a.props as { estilo?: "borde" | "lleno"; texto?: string; palabra?: string; sub?: string; firma?: string };
  const palabra = (props.palabra ?? d.plan.cta?.palabra ?? "").toUpperCase();
  const texto = (props.texto ?? d.plan.cta?.texto ?? "Comenta").toUpperCase();
  const { colores, fuentes } = d.marca;

  if (props.estilo !== "lleno") {
    return (
      <Colocar zona={zona} ancho={900} alto={200} style={{ justifyContent: "center" }}>
        <div
          style={{
            padding: "8px 34px 12px",
            background: "#e6f6ef",
            border: `5px solid ${colores.verde}`,
            transform: `rotate(-2.5deg) scale(${0.7 + 0.3 * entrada})`,
            opacity: Math.min(1, entrada * 1.5) * salida,
            textAlign: "center",
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ fontFamily: familia(fuentes.titulos), fontSize: 88, lineHeight: 1.1, color: colores.verde, whiteSpace: "nowrap" }}>
            {texto} {palabra}
          </div>
          {props.sub ? (
            <div
              style={{
                fontFamily: familia(fuentes.mono, "monospace"),
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "0.12em",
                color: colores.verde,
                textTransform: "uppercase",
              }}
            >
              {props.sub}
            </div>
          ) : null}
        </div>
      </Colocar>
    );
  }

  const { retrasoMs, msPorLetra } = K.animaciones.cta;
  const escritas = Math.max(0, Math.min(palabra.length, Math.floor((t - retrasoMs) / msPorLetra) + 1));
  const cursor = Math.floor(t / 420) % 2 === 0;
  return (
    <Colocar zona={zona} ancho={900} alto={250} style={{ alignItems: "flex-start", paddingLeft: 40 }}>
      <div style={{ position: "relative", opacity: Math.min(1, entrada * 1.5) * salida, transform: `translateY(${(1 - entrada) * 30}px)` }}>
        <Escuadras color={colores.menta} separacion={12} largo={44} />
        <div style={{ background: colores.verde, padding: "16px 30px 14px", minWidth: 470 }}>
          <div
            style={{
              fontFamily: familia(fuentes.mono, "monospace"),
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: "0.1em",
              color: "#d8f3e9",
            }}
          >
            {texto}
          </div>
          <div style={{ fontFamily: familia(fuentes.titulos), fontSize: 96, lineHeight: 1.05, color: "#fff", whiteSpace: "nowrap" }}>
            {palabra.slice(0, escritas)}
            <span style={{ opacity: cursor ? 1 : 0 }}>_</span>
          </div>
        </div>
        {props.firma ? (
          <div
            style={{
              marginTop: 22,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: familia(fuentes.mono, "monospace"),
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: "0.12em",
              color: "#fff",
              textTransform: "uppercase",
              textShadow: "0 2px 6px rgba(0,0,0,0.6)",
            }}
          >
            <span style={{ border: `2px solid ${colores.menta}`, color: colores.menta, padding: "0 6px" }}>
              {props.firma.slice(0, 1)}
            </span>
            {props.firma}
          </div>
        ) : null}
      </div>
    </Colocar>
  );
};
