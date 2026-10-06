import React, { useMemo } from "react";
import { AbsoluteFill, Html5Audio, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Capitulo, EtiquetaCapitulo } from "./animaciones/Capitulo";
import { Chat } from "./animaciones/Chat";
import { Cifra } from "./animaciones/Cifra";
import { PropsAnimacion } from "./animaciones/comun";
import { Cta } from "./animaciones/Cta";
import { Flujo } from "./animaciones/Flujo";
import { Insignia } from "./animaciones/Insignia";
import { Lista } from "./animaciones/Lista";
import { Sello } from "./animaciones/Sello";
import { camara, diseno } from "./camara";
import { archivo, Datos, K, TipoAnimacion } from "./datos";
import { familia, useFuentes } from "./fuentes";
import { Subtitulos } from "./Subtitulos";

const COMPONENTES: Record<TipoAnimacion, React.FC<PropsAnimacion>> = {
  lista: Lista,
  flujo: Flujo,
  chat: Chat,
  sello: Sello,
  cta: Cta,
  insignia: Insignia,
  cifra: Cifra,
};

export type PropsReel = { slug: string; antesDespues?: boolean; datos?: Datos };

const aFotograma = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

const Camara: React.FC<{ d: Datos }> = ({ d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { video } = camara(d, (frame / fps) * 1000);
  return (
    <>
      <OffthreadVideo
        src={archivo(d.slug, "cortado.mp4")}
        style={{ position: "absolute", ...video, maxWidth: "none", filter: K.camara.filtro }}
      />
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(0,0,0,${K.camara.vineta}) 100%)` }}
      />
    </>
  );
};

/** La versión editada completa (vídeo, tarjetas, capítulos y subtítulos) en un lienzo de 1080×1920. */
const Edicion: React.FC<{ d: Datos }> = ({ d }) => {
  const { fps } = useVideoConfig();
  const { zona, etiquetaTop } = diseno(d);
  const capitulos = d.plan.capitulos ?? [];
  const animaciones = useMemo(() => (d.plan.animaciones ?? []).map((a) => ({ ...a, props: a.props ?? {} })), [d]);
  // Mientras un capítulo tapa la pantalla entera no hay subtítulos (como en el ejemplo).
  const tapado = (t: number) =>
    capitulos.some((c) => t >= c.desdeMs + K.animaciones.capitulo.barridoMs && t < c.hastaMs - K.animaciones.capitulo.salidaMs);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Camara d={d} />
      <EtiquetaCapitulo d={d} top={etiquetaTop} />
      {animaciones.map((a, i) => {
        const Componente = COMPONENTES[a.tipo];
        const desde = aFotograma(a.desdeMs, fps);
        const hasta = aFotograma(a.hastaMs, fps);
        if (!Componente || hasta <= desde) return null;
        return (
          <Sequence key={i} from={desde} durationInFrames={hasta - desde} layout="none">
            <Componente a={a} d={d} zona={zona} />
          </Sequence>
        );
      })}
      <Subtitulos d={d} ocultar={tapado} />
      {capitulos.map((c, i) => {
        const desde = aFotograma(c.desdeMs, fps);
        const hasta = aFotograma(c.hastaMs, fps);
        if (hasta <= desde) return null;
        return (
          <Sequence key={`c${i}`} from={desde} durationInFrames={hasta - desde} layout="none">
            <Capitulo c={c} numero={i + 1} total={capitulos.filter((x) => x.variante !== "alerta").length} d={d} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const Sonido: React.FC<{ d: Datos }> = ({ d }) => (
  <>
    {d.hayMusica ? (
      <Html5Audio src={archivo(d.slug, "musica.wav")} volume={(f) => d.volumenMusica[f] ?? K.musica.volumenSilencio} />
    ) : null}
    {d.haySfx ? <Html5Audio src={archivo(d.slug, "sfx.wav")} volume={K.sfx.volumen} /> : null}
  </>
);

export const Reel: React.FC<PropsReel> = ({ datos }) => {
  const d = datos!;
  useFuentes(d.marca);
  return (
    <AbsoluteFill>
      <Edicion d={d} />
      <Sonido d={d} />
    </AbsoluteFill>
  );
};

const Etiqueta: React.FC<{ texto: string; d: Datos; style: React.CSSProperties }> = ({ texto, d, style }) => (
  <div
    style={{
      position: "absolute",
      background: "#fff",
      color: d.marca.colores.tinta,
      fontFamily: familia(d.marca.fuentes.mono, "monospace"),
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      padding: "6px 16px",
      ...style,
    }}
  >
    {texto}
  </div>
);

const ALTO_ORIGINAL = 760;

/**
 * Antes/después: el original arriba (sin encuadre, color ni gráficos) y debajo el reel editado
 * completo a escala. Los dos salen del mismo cortado.mp4, así que van sincronizados y sin pausas.
 */
export const ReelAntesDespues: React.FC<PropsReel> = ({ datos }) => {
  const d = datos!;
  useFuentes(d.marca);
  const ajuste = Math.min(K.ancho / d.ancho, ALTO_ORIGINAL / d.alto);
  const escala = (K.alto - ALTO_ORIGINAL - 24) / K.alto;
  const anchoMini = K.ancho * escala;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f14" }}>
      <OffthreadVideo
        src={archivo(d.slug, "cortado.mp4")}
        muted
        style={{
          position: "absolute",
          width: d.ancho * ajuste,
          height: d.alto * ajuste,
          left: (K.ancho - d.ancho * ajuste) / 2,
          top: (ALTO_ORIGINAL - d.alto * ajuste) / 2,
          maxWidth: "none",
        }}
      />
      <Etiqueta texto="Original" d={d} style={{ left: 32, top: ALTO_ORIGINAL - 70 }} />
      <div style={{ position: "absolute", top: ALTO_ORIGINAL - 3, left: 0, right: 0, height: 6, background: d.marca.colores.verde }} />
      <div
        style={{
          position: "absolute",
          top: ALTO_ORIGINAL + 12,
          left: (K.ancho - anchoMini) / 2,
          width: K.ancho,
          height: K.alto,
          transform: `scale(${escala})`,
          transformOrigin: "top left",
          borderRadius: 40,
          overflow: "hidden",
        }}
      >
        <Edicion d={d} />
      </div>
      <Etiqueta texto="Editado por Claude" d={d} style={{ left: 32, top: ALTO_ORIGINAL + 36 }} />
      <Sonido d={d} />
    </AbsoluteFill>
  );
};
