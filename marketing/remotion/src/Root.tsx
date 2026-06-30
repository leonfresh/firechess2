import { Composition } from "remotion";
import { Roast, TOTAL_FRAMES } from "./Roast";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="roast"
      component={Roast}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
