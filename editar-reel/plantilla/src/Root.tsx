import { CalculateMetadataFunction, Composition } from "remotion";
import { cargarDatos, K } from "./datos";
import { PropsReel, Reel, ReelAntesDespues } from "./Reel";

// Cambia este slug para ver otro vídeo en el Studio (npm run dev).
const SLUG_POR_DEFECTO = "prueba";

const calcular: CalculateMetadataFunction<PropsReel> = async ({ props }) => {
  const datos = await cargarDatos(props.slug);
  return {
    durationInFrames: Math.max(1, Math.floor(datos.duracion * K.fps)),
    props: { ...props, datos },
  };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      calculateMetadata={calcular}
      fps={K.fps}
      width={K.ancho}
      height={K.alto}
      durationInFrames={1}
      defaultProps={{ slug: SLUG_POR_DEFECTO } as PropsReel}
    />
    <Composition
      id="ReelAntesDespues"
      component={ReelAntesDespues}
      calculateMetadata={calcular}
      fps={K.fps}
      width={K.ancho}
      height={K.alto}
      durationInFrames={1}
      defaultProps={{ slug: SLUG_POR_DEFECTO } as PropsReel}
    />
  </>
);
