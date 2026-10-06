import { Easing } from "remotion";
import { K } from "../datos";
import { familia } from "../fuentes";
import { Colocar, lineal, numeroCapitulo, PropsAnimacion, Tarjeta, useTiempo } from "./comun";

/** Un número que cuenta cuando lo digo, en tarjeta. props: { valor, prefijo?, sufijo?, etiqueta?, decimales? } */
export const Cifra: React.FC<PropsAnimacion> = ({ a, d, zona }) => {
  const { t, entrada, salida } = useTiempo(a);
  const { valor = 0, prefijo = "", sufijo = "", etiqueta, decimales = 0 } = a.props as {
    valor?: number;
    prefijo?: string;
    sufijo?: string;
    etiqueta?: string;
    decimales?: number;
  };
  const { colores, fuentes } = d.marca;
  const actual = valor * lineal(t, [0, K.animaciones.cifra.cuentaMs], [0, 1], Easing.out(Easing.quad));
  const texto = actual.toLocaleString("es-ES", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

  return (
    <Colocar zona={zona} ancho={760} alto={330}>
      <Tarjeta marca={d.marca} numero={numeroCapitulo(d, a.desdeMs)} titulo={etiqueta} ancho={760} entrada={entrada} salida={salida}>
        <div
          style={{
            fontFamily: familia(fuentes.titulos),
            fontSize: 190,
            lineHeight: 1,
            color: colores.verde,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {prefijo}
          {texto}
          {sufijo}
        </div>
      </Tarjeta>
    </Colocar>
  );
};
