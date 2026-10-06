// Iconos de trazo fino (24×24), dibujados a mano para no depender de librerías ni de logos con marca.
import React from "react";

const TRAZOS: Record<string, React.ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  video: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 7l3-4h4l-3 4M10 7l3-4h4l-3 4" />
    </>
  ),
  tijeras: (
    <>
      <circle cx="6" cy="6.5" r="2.8" />
      <circle cx="6" cy="17.5" r="2.8" />
      <path d="M8.3 8.2L20 18M8.3 15.8L20 6" />
    </>
  ),
  texto: <path d="M5 6.5V5h14v1.5M12 5v14M9 19h6" />,
  chispa: <path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7zM19 16c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z" />,
  chat: <path d="M4 5.5h16v10.5H10l-4.5 3.5V16H4z" />,
  imagen: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="9.5" r="1.8" />
      <path d="M3.5 17l5-4.5 4 3.5 3-2.5 5 4" />
    </>
  ),
  corazon: <path d="M12 19.5s-7.5-4.6-7.5-9.7C4.5 7 6.4 5 8.7 5c1.5 0 2.6.8 3.3 2 .7-1.2 1.8-2 3.3-2 2.3 0 4.2 2 4.2 4.8 0 5.1-7.5 9.7-7.5 9.7z" />,
  ojo: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" />
    </>
  ),
  rayo: <path d="M13.5 2.5L5 13.5h6l-1 8 8.5-11h-6z" />,
  musica: (
    <>
      <path d="M9 17.5V5.5l11-2v12" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="15.5" r="2.5" />
    </>
  ),
  lapiz: <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 013 3L8 18.5zM13.5 7l3 3" />,
  enviar: <path d="M3.5 11.5L20.5 4l-7.5 17-2.5-7z M10.5 14l10-10" />,
  grafica: <path d="M4 20V4M4 20h16M8.5 16v-5M13 16V8M17.5 16v-8" />,
  carpeta: <path d="M3.5 6.5a1.5 1.5 0 011.5-1.5h4.5l2 2.5H19a1.5 1.5 0 011.5 1.5v8.5a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5z" />,
  estrella: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />,
  candado: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" />
    </>
  ),
  buscar: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  microfono: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
    </>
  ),
  caja: (
    <>
      <path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z" />
      <path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3.5L21.5 20h-19z" />
      <path d="M12 9.5v5M12 17.2v.3" />
    </>
  ),
};

export const nombresIconos = Object.keys(TRAZOS);

/** Un icono por nombre; "letra:X" dibuja la letra X. Nombres desconocidos: un punto. */
export const Icono: React.FC<{ nombre?: string; tamano?: number; color?: string; grosor?: number }> = ({
  nombre = "",
  tamano = 48,
  color = "currentColor",
  grosor = 1.8,
}) => {
  if (nombre.startsWith("letra:")) {
    return (
      <svg width={tamano} height={tamano} viewBox="0 0 24 24">
        <text x="12" y="17.5" textAnchor="middle" fontSize="17" fontWeight="800" fontFamily="Inter, sans-serif" fill={color}>
          {nombre.slice(6, 8)}
        </text>
      </svg>
    );
  }
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRAZOS[nombre] ?? <circle cx="12" cy="12" r="2" />}
    </svg>
  );
};
