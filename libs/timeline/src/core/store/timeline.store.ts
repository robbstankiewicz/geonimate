import {
    patchState,
    signalStore,
    type,
    withComputed,
    withHooks,
    withMethods,
    withState,
} from '@ngrx/signals';
import { computed, inject, InjectionToken, DestroyRef } from '@angular/core';
import {
    animationFrameScheduler,
    filter,
    interval,
    map,
    scan,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    addEntity,
    entityConfig,
    withEntities,
    updateEntity,
    setAllEntities,
    prependEntity,
    removeEntity,
} from '@ngrx/signals/entities';
import { SCALE_VALUES } from '../providers/scale-values.provider';
import { APP_OPTIONS, ErrorService } from '@geonimate/shared-core';
import {
    KeyframeId,
    TimeMs,
    LayerId,
    Rgb,
    findBestIndex,
} from '@geonimate/shared-utils';
import { withTreeShakableDevTools } from '@geonimate/shared-core';
import { KeyframeState } from '../models/keyframe-state';

export interface Track {
    id: LayerId;
    color: Rgb;
}
export interface TimestampEntity {
    id: TimeMs;
    keyframes: KeyframeId[];
}
const trackEntityConfig = entityConfig({
    entity: type<Track>(),
    collection: 'tracks',
});

const keyframeEntityConfig = entityConfig({
    entity: type<KeyframeState>(),
    collection: 'keyframes',
});

interface State {
    _scaleIndex: number;
    playheadPositionMs: TimeMs;
    isPlaying: boolean;
    options: {
        fps: number;
        timeMs: number;
    };
    _currentTimestampIndex: number;
}

const STATE = new InjectionToken('STATE', {
    factory: (): State => {
        const { fps, timeMs } = inject(APP_OPTIONS);
        return {
            _scaleIndex: 0,
            playheadPositionMs: 0,
            isPlaying: false,
            options: { fps, timeMs },
            _currentTimestampIndex: 0,
        };
    },
});

export const timelineStore = signalStore(
    withTreeShakableDevTools('Timeline'),
    withState(() => inject(STATE)),
    withEntities(trackEntityConfig),
    withEntities(keyframeEntityConfig),
    withComputed((store, scales = inject(SCALE_VALUES)) => {
        const scale = computed(() => scales[store._scaleIndex()]);
        const stepsCount = computed(
            () => (store.options.timeMs() / 1000) * store.options.fps()
        );
        const sortedTimestamps = computed(() => {
            const keyframesEntities = store.keyframesEntities();
            const timestampsSet = new Set<TimeMs>([0, store.options.timeMs()]);
            for (const keyframe of keyframesEntities) {
                timestampsSet.add(keyframe.timeMs);
            }
            return Array.from(timestampsSet).sort((a, b) => a - b);
        });

        const _nextTimestampIndex = computed(() => {
            const currIndex = store._currentTimestampIndex();
            return sortedTimestamps()[currIndex + 1] !== undefined
                ? currIndex + 1
                : currIndex;
        });
        const tracks = computed(() => {
            const keyframesEntities = store.keyframesEntities();
            const tracksEntities = store.tracksEntities();

            return tracksEntities.map(track => ({
                id: track.id,
                color: track.color,
                keyframes: keyframesEntities
                    .filter(kf => kf.trackId === track.id)
                    .sort((a, b) => a.timeMs - b.timeMs),
            }));
        });
        return {
            scale,
            stepsCount,
            sortedTimestamps,
            _nextTimestampIndex,
            tracks,
        };
    }),
    withMethods(
        (
            store,
            scales = inject(SCALE_VALUES),
            errorService = inject(ErrorService)
        ) => {
            const setPlayhead = (playheadPositionMs: number) => {
                patchState(store, () => ({ playheadPositionMs }));
            };
            const setPlayheadFreehand = (playheadPositionMs: number) => {
                const currentTimestampIndex = store._currentTimestampIndex();
                const nextTimestampIndex = store._nextTimestampIndex();
                const sorted = store.sortedTimestamps();

                if (
                    playheadPositionMs < sorted[currentTimestampIndex] ||
                    playheadPositionMs >= sorted[nextTimestampIndex]
                ) {
                    const i = findBestIndex(sorted, playheadPositionMs);
                    patchState(store, () => ({
                        playheadPositionMs,
                        _currentTimestampIndex: i - 1,
                    }));
                    return;
                }
                patchState(store, () => ({ playheadPositionMs }));
            };

            const togglePlay = (value?: boolean) => {
                const timeMs = store.playheadPositionMs();
                const newIndex =
                    findBestIndex(store.sortedTimestamps(), timeMs) - 1;
                const isPlaying = value === undefined ? !store.isPlaying() : value;
                patchState(store, () => ({
                    isPlaying,
                    _currentTimestampIndex: newIndex,
                }));
            };
            const changeScale = (change: 'up' | 'down') => {
                const newIndex =
                    change === 'up'
                        ? store._scaleIndex() + 1
                        : store._scaleIndex() - 1;
                if (scales[newIndex] !== undefined) {
                    patchState(store, () => ({ _scaleIndex: newIndex }));
                }
            };
            const editTrack = (id: LayerId, changes: Partial<Track>) => {
                patchState(
                    store,
                    updateEntity(
                        {
                            id,
                            changes,
                        },
                        trackEntityConfig
                    )
                );
            };
            const addTrack = (track: Track) => {
                patchState(store, state => {
                    const ids = state.tracksIds.toSpliced(1, 0, track.id);
                    const entities = {
                        ...state.tracksEntityMap,
                        [track.id]: track,
                    };
                    return {
                        ...state,
                        tracksIds: ids,
                        tracksEntityMap: entities,
                    };
                });
            };
            const removeTrack = (trackId: LayerId) => {
                if (!store.tracksEntityMap()[trackId]) {
                    return;
                }
                const keyframeIds = store
                    .keyframesEntities()
                    .filter(kf => kf.trackId === trackId)
                    .map(kf => kf.id);
                for (const id of keyframeIds) {
                    patchState(store, removeEntity(id, keyframeEntityConfig));
                }
                patchState(store, removeEntity(trackId, trackEntityConfig));
                const timeMs = store.playheadPositionMs();
                const newIndex =
                    findBestIndex(store.sortedTimestamps(), timeMs) - 1;
                patchState(store, { _currentTimestampIndex: newIndex });
            };
            const addKeyframe = (keyframe: Omit<KeyframeState, 'timeMs'>) => {
                const timeMs = store.playheadPositionMs();
                patchState(
                    store,
                    addEntity({ ...keyframe, timeMs }, keyframeEntityConfig)
                );
                const newIndex =
                    findBestIndex(store.sortedTimestamps(), timeMs) - 1;
                patchState(store, { _currentTimestampIndex: newIndex });
            };
            const removeKeyframeById = (id: KeyframeId) => {
                patchState(store, removeEntity(id, keyframeEntityConfig));
                const timeMs = store.playheadPositionMs();
                const newIndex =
                    findBestIndex(store.sortedTimestamps(), timeMs) - 1;
                patchState(store, { _currentTimestampIndex: newIndex });
            };
            const insertKeyframe = (keyframe: KeyframeState) => {
                patchState(store, addEntity(keyframe, keyframeEntityConfig));
                const newIndex =
                    findBestIndex(store.sortedTimestamps(), keyframe.timeMs) -
                    1;
                patchState(store, { _currentTimestampIndex: newIndex });
            };
            const setOrder = (newOrder: LayerId[]) => {
                const newEntities = newOrder.map(
                    id => store.tracksEntityMap()[id]
                );
                patchState(
                    store,
                    setAllEntities(newEntities, trackEntityConfig)
                );
            };
            const moveTrack = (trackId: LayerId, newIndex: number) => {
                const tracks = store.tracksEntities();
                const oldIndex = tracks.findIndex(t => t.id === trackId);
                if (oldIndex === -1) return;
                const track = tracks[oldIndex];
                const newTracks = tracks
                    .toSpliced(oldIndex, 1)
                    .toSpliced(newIndex, 0, track);
                patchState(store, setAllEntities(newTracks, trackEntityConfig));
            };

            const moveKeyframe = (
                keyframeId: KeyframeId,
                newTimeMs: TimeMs
            ) => {
                const keyframe = store.keyframesEntityMap()[keyframeId];
                if (!keyframe) return;
                patchState(
                    store,
                    updateEntity(
                        {
                            id: keyframeId,
                            changes: { timeMs: newTimeMs },
                        },
                        keyframeEntityConfig
                    )
                );
            };
            const goToNextTimestamp = () => {
                const timestamps = store.sortedTimestamps();
                const currIndex = store._currentTimestampIndex();
                const nextIndex = currIndex + 1;
                const nextTime = timestamps[nextIndex] ?? timestamps[0];
                setPlayheadFreehand(nextTime);
            };
            const goToPrevTimestamp = () => {
                const timeMs = store.playheadPositionMs();
                const timestamps = store.sortedTimestamps();
                let index = store._currentTimestampIndex();
                const currIndexTimeMs = timestamps[index];
                if (currIndexTimeMs === timeMs) {
                    index = index - 1;
                }
                const prevTime =
                    timestamps[index] ?? timestamps[timestamps.length - 1];
                setPlayheadFreehand(prevTime);
            };
            const updateMaxTimeMs = (timeMs: number) => {
                const currentTimeMs = store.options.timeMs();
                if (timeMs < currentTimeMs) {
                    // move keyframes to the end
                    const keyframesToClamp = store
                        .keyframesEntities()
                        .filter(kf => kf.timeMs > timeMs);
                    for (const kf of keyframesToClamp) {
                        patchState(
                            store,
                            updateEntity(
                                { id: kf.id, changes: { timeMs } },
                                keyframeEntityConfig
                            )
                        );
                    }
                    if (keyframesToClamp.length > 0) {
                        errorService.showWarning(
                            'Timeline Duration Reduced',
                            `${keyframesToClamp.length} keyframe(s) moved to ${timeMs}ms`
                        );
                    }
                }
                patchState(store, state => ({
                    options: { ...state.options, timeMs },
                }));

                setPlayheadFreehand(0);
            };
            const updateFps = (fps: number) => {
                patchState(store, state => ({
                    options: { ...state.options, fps },
                }));
            };
            return {
                setPlayhead,
                setPlayheadFreehand,
                moveKeyframe,
                insertKeyframe,
                removeKeyframeById,
                moveTrack,
                setOrder,
                addKeyframe,
                addTrack,
                editTrack,
                removeTrack,
                changeScale,
                togglePlay,
                goToNextTimestamp,
                goToPrevTimestamp,
                updateMaxTimeMs,
                updateFps,
                loadState(snapshot: {
                    tracks: Track[];
                    keyframes: KeyframeState[];
                }) {
                    patchState(
                        store,
                        setAllEntities(snapshot.tracks, trackEntityConfig)
                    );
                    patchState(
                        store,
                        setAllEntities(snapshot.keyframes, keyframeEntityConfig)
                    );
                    patchState(store, {
                        playheadPositionMs: 0,
                        _currentTimestampIndex: 0,
                        isPlaying: false,
                    });
                },
            };
        }
    ),
    withHooks((store, destroyRef = inject(DestroyRef)) => ({
        onInit: () => {
            const isPlaying$ = toObservable(store.isPlaying);
            const start$ = isPlaying$.pipe(filter(v => v));
            const stop$ = isPlaying$.pipe(filter(v => !v));
            start$
                .pipe(
                    switchMap(() =>
                        interval(0, animationFrameScheduler).pipe(
                            map(() => performance.now()),
                            scan(
                                (acc, timestamp) => {
                                    if (
                                        acc.currentTime ===
                                        store.options.timeMs()
                                    ) {
                                        return {
                                            ...acc,
                                            currentTime: 0,
                                        };
                                    }
                                    const delta = timestamp - acc.timestamp;
                                    const currentTime = Math.min(
                                        acc.currentTime + delta,
                                        store.options.timeMs()
                                    );
                                    return {
                                        timestamp,
                                        delta,
                                        currentTime,
                                    };
                                },
                                {
                                    timestamp: performance.now(),
                                    delta: 0,
                                    currentTime: store.playheadPositionMs(),
                                }
                            ),
                            tap(rafState => {
                                store.setPlayhead(rafState.currentTime);
                            }),
                            takeUntil(stop$)
                        )
                    ),
                    takeUntilDestroyed(destroyRef)
                )
                .subscribe();
        },
    }))
);
