import { KeyframeId } from '@geonimate/shared-utils';

export interface TrackKeyframeModel {
    id: KeyframeId;
    timeMs: number;
    draggable: boolean;
}
