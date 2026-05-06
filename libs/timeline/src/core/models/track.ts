import { LayerId, Rgb } from '@geonimate/shared-utils';
import { TrackKeyframeModel } from './track-keyframe';

export interface TrackModel {
    id: LayerId;
    color: Rgb;
    keyframes: TrackKeyframeModel[];
}
