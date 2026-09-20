import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {CamelShort,GameShowcase} from './Showcase';
registerRoot(()=> <><Composition id="camel-short" component={CamelShort} durationInFrames={540} fps={30} width={1080} height={1920}/><Composition id="showcase" component={GameShowcase} durationInFrames={1800} fps={30} width={1920} height={1080}/></>);
