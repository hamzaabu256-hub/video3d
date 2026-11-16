import React from "react";
import { Composition, Still } from "remotion";
import { Demo3D, TOTAL as DEMO3D_FRAMES } from "./demo3d/Demo";
import { Story, Thumb } from "./story/Story";
import { EPISODES } from "./story/registry";

export const Root: React.FC = () => (
  <>
    {/* الديمو الأصلي */}
    <Composition id="Demo3D" component={Demo3D} width={1080} height={1920} fps={30} durationInFrames={DEMO3D_FRAMES} />
    {/* لكل حلقة: عمودي 9:16 + أفقي 16:9 + صورة مصغرة */}
    {Object.entries(EPISODES).map(([id, e]) => (
      <React.Fragment key={id}>
        <Composition id={id} component={Story} width={1080} height={1920} fps={e.timeline.fps} durationInFrames={e.timeline.total} defaultProps={{ ep: id }} />
        <Composition id={id + "-16x9"} component={Story} width={1920} height={1080} fps={e.timeline.fps} durationInFrames={e.timeline.total} defaultProps={{ ep: id }} />
        <Still id={id + "-thumb"} component={Thumb} width={1280} height={720} defaultProps={{ ep: id }} />
      </React.Fragment>
    ))}
  </>
);
