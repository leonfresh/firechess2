import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ChaosPromo} from './ChaosPromo';
const Root=()=> <Composition id="chaos-promo" component={ChaosPromo} durationInFrames={720} fps={30} width={1080} height={1920}/>;
registerRoot(Root);
