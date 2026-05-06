import { inject, Injectable } from '@angular/core';
import { timelineStore } from '../store/timeline.store';
import { KeyframeId, LayerId, TimeMs } from '@geonimate/shared-utils';
import { Subject } from 'rxjs';
import { KeyframeState } from '../models/keyframe-state';

@Injectable()
export class TimelineService {
    keyframeDragStarted$ = new Subject<{
        keyframeId: KeyframeId;
        altKey: boolean;
    }>();
    keyframeDragEnded$ = new Subject<KeyframeId>();
    private store = inject(timelineStore);
    setOrder = this.store.setOrder;
    addTrack = this.store.addTrack;
    editTrack = this.store.editTrack;
    removeTrack = this.store.removeTrack;
    togglePlay = this.store.togglePlay;
    isPlaying = this.store.isPlaying;
    changeScale = this.store.changeScale;
    addKeyframe = this.store.addKeyframe;
    playheadPositionMs = this.store.playheadPositionMs;
    tracks = this.store.tracks;
    keyframesEntityMap = this.store.keyframesEntityMap;
    keyframesEntities = this.store.keyframesEntities;
    tracksEntities = this.store.tracksEntities;
    insertKeyframe = this.store.insertKeyframe;
    removeKeyframeById = this.store.removeKeyframeById;
    setPlayheadFreehand = this.store.setPlayheadFreehand;

    getKeyframeAtPlayhead(trackId: LayerId): KeyframeState | undefined {
        const timeMs = this.store.playheadPositionMs();
        return this.getKeyframeAtTime(trackId, timeMs);
    }

    getKeyframeAtTime(
        trackId: LayerId,
        timeMs: TimeMs
    ): KeyframeState | undefined {
        return this.store
            .keyframesEntities()
            .find(kf => kf.trackId === trackId && kf.timeMs === timeMs);
    }

    getKeyframesForTrack(trackId: LayerId): KeyframeState[] {
        return this.store
            .keyframesEntities()
            .filter(kf => kf.trackId === trackId)
            .sort((a, b) => a.timeMs - b.timeMs);
    }

    getPreviousKeyframe(
        trackId: LayerId,
        timeMs: TimeMs
    ): KeyframeState | undefined {
        const keyframes = this.getKeyframesForTrack(trackId);
        const previous = keyframes.filter(kf => kf.timeMs < timeMs).pop();
        return previous;
    }

    getNextKeyframe(
        trackId: LayerId,
        timeMs: TimeMs
    ): KeyframeState | undefined {
        const keyframes = this.getKeyframesForTrack(trackId);
        const next = keyframes.filter(kf => kf.timeMs > timeMs).shift();
        return next;
    }

    goToNextTimestamp = this.store.goToNextTimestamp;
    goToPrevTimestamp = this.store.goToPrevTimestamp;
    updateMaxTimeMs = this.store.updateMaxTimeMs;
    updateFps = this.store.updateFps;
}
