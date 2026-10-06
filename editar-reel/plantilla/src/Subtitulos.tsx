// Subtítulos tipo karaoke: el bloque entero en blanco y la palabra que se está diciendo en menta.
import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { diseno } from "./camara";
import { Datos, K } from "./datos";
import { familia } from "./fuentes";

type Bloque = { inicio: number; fin: number; palabras: { texto: string; ms: number }[] };

/** Bloques de pocas palabras (una o dos líneas) que cortan en pausas y finales de frase. */
const agrupar = (d: Datos): Bloque[] => {
  const bloques: Bloque[] = [];
  let actual: Bloque | null = null;
  d.palabras.forEach((p, i) => {
    const texto = p.text.trim();
    if (!texto) return;
    const previa = d.palabras[i - 1];
    const romper =
      !actual ||
      actual.palabras.length >= K.subtitulos.palabrasPorBloque ||
      p.startMs - previa.endMs > K.subtitulos.pausaCorteMs ||
      /[.?!…]$/.test(previa.text.trim());
    if (romper) {
      actual = { inicio: p.startMs, fin: 0, palabras: [] };
      bloques.push(actual);
    }
    actual!.palabras.push({ texto, ms: p.startMs });
  });
  bloques.forEach((b, n) => {
    const ultima = b.palabras[b.palabras.length - 1];
    const fin = d.palabras.find((p) => p.startMs === ultima.ms)?.endMs ?? ultima.ms + 400;
    b.fin = Math.min(bloques[n + 1]?.inicio ?? Infinity, fin + 500);
  });
  return bloques;
};

export const Subtitulos: React.FC<{ d: Datos; ocultar: (t: number) => boolean }> = ({ d, ocultar }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const bloques = useMemo(() => agrupar(d), [d]);
  const bloque = bloques.find((b) => b.inicio <= t && t < b.fin);
  if (!bloque || ocultar(t)) return null;

  const { subtitulos } = diseno(d);
  const { colores, fuentes } = d.marca;
  const entra = interpolate(t - bloque.inicio, [0, 70], [0, 1], { extrapolateRight: "clamp" });
  // Activa: la última palabra que ya ha empezado.
  let activa = -1;
  bloque.palabras.forEach((w, k) => {
    if (w.ms <= t) activa = k;
  });

  return (
    <div
      style={{
        position: "absolute",
        ...subtitulos,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        opacity: entra,
      }}
    >
      <div
        style={{
          maxWidth: K.subtitulos.anchoMax,
          textAlign: "center",
          fontFamily: familia(fuentes.subtitulos, "sans-serif"),
          fontWeight: 700,
          fontSize: K.subtitulos.tamano,
          lineHeight: 1.04,
          letterSpacing: "0.01em",
          wordSpacing: "0.32em",
          textTransform: "uppercase",
          color: "#ffffff",
          textShadow: "0 3px 2px rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.45)",
          WebkitTextStroke: "1.5px rgba(0,0,0,0.55)",
          paintOrder: "stroke fill",
        }}
      >
        {bloque.palabras.map((w, k) => (
          <span key={k} style={{ color: k === activa ? colores.menta : undefined }}>
            {w.texto}
            {k < bloque.palabras.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
