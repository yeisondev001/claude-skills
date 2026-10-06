import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { Capitulo as TCapitulo, Datos, K } from "../datos";
import { familia } from "../fuentes";
import { lineal } from "./comun";
import { Icono } from "./iconos";

/**
 * Separador de capítulo a pantalla completa: entra con un barrido (franja verde delante) desde la
 * derecha, monta sus piezas y sale deslizándose hacia arriba para descubrir el vídeo.
 */
export const Capitulo: React.FC<{ c: TCapitulo; numero: number; total: number; d: Datos }> = ({ c, numero, total, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const dur = c.hastaMs - c.desdeMs;
  const { barridoMs, salidaMs } = K.animaciones.capitulo;
  const alerta = c.variante === "alerta";
  const { colores, fuentes } = d.marca;
  const acento = alerta ? "#d64535" : colores.verde;
  const fondo = alerta ? "#12171c" : colores.fondo;
  const tinta = alerta ? "#f2f2ee" : colores.tinta;

  const entra = lineal(t, [0, barridoMs], [100, 0], Easing.inOut(Easing.cubic));
  const franja = lineal(t, [barridoMs * 0.7, barridoMs + 200], [24, 0]);
  const sube = lineal(t, [dur - salidaMs, dur], [0, -100], Easing.in(Easing.cubic));
  const c0 = barridoMs * 0.6; // las piezas empiezan cuando el barrido casi ha llegado
  const pieza = (retraso: number, duracion = 280) => lineal(t, [c0 + retraso, c0 + retraso + duracion], [0, 1]);
  const lineas = (Array.isArray(c.titulo) ? c.titulo : [c.titulo]).filter(Boolean) as string[];
  const quedan = total - numero;

  return (
    <AbsoluteFill style={{ transform: `translateX(${entra}%) translateY(${sube}%)` }}>
      <AbsoluteFill
        style={{
          background: alerta
            ? `repeating-linear-gradient(0deg, transparent 0 59px, rgba(255,255,255,0.05) 59px 60px), repeating-linear-gradient(90deg, transparent 0 59px, rgba(255,255,255,0.05) 59px 60px), ${fondo}`
            : fondo,
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${franja}%`, background: acento }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 22, background: acento }} />

      {/* Cabecera: CAPÍTULO ▬▬▬ QUEDAN N */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 72,
          right: 72,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: familia(fuentes.mono, "monospace"),
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: "0.12em",
          opacity: pieza(0, 200),
        }}
      >
        <span style={{ color: alerta ? "#9aa3ab" : "#5e605c" }}>{alerta ? "VEREDICTO" : "CAPÍTULO"}</span>
        <div style={{ flex: 1, display: "flex", gap: 10 }}>
          {Array.from({ length: Math.max(1, total) }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 14, borderRadius: 8, border: `2.5px solid ${tinta}`, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: i < numero - 1 ? "100%" : i === numero - 1 ? `${100 * pieza(80, 400)}%` : "0%",
                  background: i === numero - 1 ? acento : tinta,
                }}
              />
            </div>
          ))}
        </div>
        <span style={{ color: acento }}>{alerta ? "" : quedan > 0 ? `QUEDAN ${quedan}` : "EL ÚLTIMO"}</span>
      </div>

      {/* Número gigante */}
      <div style={{ position: "absolute", top: 352, left: 60, height: 370, overflow: "hidden" }}>
        <div
          style={{
            fontFamily: familia(fuentes.titulos),
            fontSize: 360,
            lineHeight: 1,
            color: alerta ? acento : tinta,
            transform: `translateY(${(1 - pieza(40, 320)) * 100}%)`,
          }}
        >
          {alerta ? "!" : String(numero).padStart(2, "0")}
        </div>
      </div>

      {/* Icono */}
      {c.icono ? (
        <div
          style={{
            position: "absolute",
            top: 420,
            right: 110,
            width: 190,
            height: 190,
            borderRadius: 44,
            background: acento,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
            transform: `scale(${lineal(t, [c0 + 200, c0 + 480], [0, 1], Easing.out(Easing.back(1.8)))})`,
          }}
        >
          <Icono nombre={c.icono} tamano={120} color="#fff" grosor={1.9} />
        </div>
      ) : null}

      {/* Título en dos líneas: la segunda en el color de acento */}
      <div style={{ position: "absolute", top: 760, left: 72, right: 72 }}>
        {lineas.map((l, i) => (
          <div key={i} style={{ overflow: "hidden", height: 138 }}>
            <div
              style={{
                fontFamily: familia(fuentes.titulos),
                fontSize: 128,
                lineHeight: 1.08,
                textTransform: "uppercase",
                color: i === lineas.length - 1 && lineas.length > 1 ? acento : tinta,
                transform: `translateY(${(1 - pieza(140 + i * 90)) * 105}%)`,
                whiteSpace: "nowrap",
              }}
            >
              {l}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 18, height: 7, width: `${100 * pieza(360, 400)}%`, background: acento }} />
      </div>

      {/* Cinta de aviso */}
      {c.aviso ? (
        <div
          style={{
            position: "absolute",
            top: 1320,
            left: 72,
            padding: "8px 16px",
            background: alerta ? "rgba(214,69,53,0.15)" : colores.amarillo,
            border: `2px solid ${alerta ? acento : "#d9c27f"}`,
            fontFamily: familia(fuentes.mono, "monospace"),
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: alerta ? acento : "#5a4a17",
            opacity: pieza(520, 260),
          }}
        >
          {c.aviso}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Etiqueta fija de arriba a la izquierda con el capítulo en curso: "01 [TU ACTIVIDAD]". */
export const EtiquetaCapitulo: React.FC<{ d: Datos; top: number }> = ({ d, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const caps = d.plan.capitulos ?? [];
  const i = caps.findIndex((c, k) => t >= c.hastaMs - K.animaciones.capitulo.salidaMs && t < (caps[k + 1]?.desdeMs ?? Infinity));
  if (i < 0) return null;
  const c = caps[i];
  const { fuentes } = d.marca;
  const entra = lineal(t, [c.hastaMs - K.animaciones.capitulo.salidaMs, c.hastaMs], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 60,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: entra,
        transform: `translateX(${(1 - entra) * -30}px)`,
      }}
    >
      <span style={{ fontFamily: familia(fuentes.titulos), fontSize: 50, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
        {String(i + 1).padStart(2, "0")}
      </span>
      <span
        style={{
          background: "#fff",
          color: "#0c1014",
          padding: "6px 14px",
          fontFamily: familia(fuentes.mono, "monospace"),
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {c.etiqueta}
      </span>
    </div>
  );
};
