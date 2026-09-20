import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {GameplayPromo} from './GameplayPromo';
registerRoot(()=> <Composition id="gameplay" component={GameplayPromo} durationInFrames={720} fps={30} width={1080} height={1920}/>);
