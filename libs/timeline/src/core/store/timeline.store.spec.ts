import { TestBed } from '@angular/core/testing';
import { ErrorService } from '@geonimate/shared-core';
import { timelineStore } from './timeline.store';
import {
    generateId,
    InferStoreType,
    KeyframeId,
    LayerId,
} from '@geonimate/shared-utils';
describe('timelineStore', () => {
    let store: InferStoreType<typeof timelineStore>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                timelineStore,
                {
                    provide: ErrorService,
                    useValue: {
                        showError: jest.fn(),
                        showWarning: jest.fn(),
                    },
                },
            ],
        });
        store = TestBed.inject(timelineStore);
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    it('should init', () => {
        expect(store).toBeDefined();
        expect(store.playheadPositionMs()).toBe(0);
    });
    it('should start moving playhead on start press', async () => {
        await jest.runAllTimersAsync();
        store.togglePlay(true);
        expect(store.isPlaying()).toBe(true);
        jest.advanceTimersByTime(500);
        store.togglePlay(false);
        jest.advanceTimersByTime(5000);
        expect(store.playheadPositionMs()).toBeCloseTo(500, -2);
    });
    it('should move track', () => {
        const id1 = 'track1' as LayerId;
        const id2 = 'track2' as LayerId;
        const id3 = 'track3' as LayerId;
        store.addTrack({
            id: id1, color: { r: 0, g: 0, b: 0 },
        });
        store.addTrack({
            id: id2, color: { r: 0, g: 0, b: 0 },
        });
        store.addTrack({
            id: id3, color: { r: 0, g: 0, b: 0 },
        });
        store.moveTrack(id3, 0);
        expect(store.tracksEntities()[0].id).toBe('track3');
    });

    it('should remove track and associated keyframes', () => {
        const id = 'track1' as LayerId;
        store.addTrack({
            id,
            color: { r: 0, g: 0, b: 0 },
        });
        const kfId = generateId<KeyframeId>();
        store.insertKeyframe({
            id: kfId,
            trackId: id,
            timeMs: 500,
        });
        expect(store.keyframesEntityMap()[kfId]).toBeDefined();

        store.removeTrack(id);

        expect(store.tracksEntityMap()[id]).toBeUndefined();
        expect(store.keyframesEntityMap()[kfId]).toBeUndefined();
    });

});
