import { computed, inject, Injectable } from '@angular/core';
import {
    generateId,
    InferStoreType,
    KeyframeId,
    LayerId,
    Rgb,
    LayerType,
    createLayer,
    LAYER_TYPE_METADATA,
    PropertyType,
    StaticPosition,
} from '@geonimate/shared-utils';
import { MapService } from '@geonimate/map';
import {
    TimelineService,
    TrackKeyframeModel,
} from '@geonimate/timeline';
import { ConfigService, PropertyValues } from '@geonimate/config';
import { patchState } from '@ngrx/signals';
import { addEntity } from '@ngrx/signals/entities';
import { TrackModel } from '@geonimate/timeline';
import { settingsStore } from '@geonimate/settings';
import { getBracketingKeyframes } from '../utils/keyframe-creation-helpers';

@Injectable()
export class ManagerService {
    private map = inject(MapService);
    private timeline = inject(TimelineService);
    private config = inject(ConfigService);
    private settings = inject(settingsStore);

    togglePlay = this.timeline.togglePlay;
    isPlaying = this.timeline.isPlaying;
    changeScale = this.timeline.changeScale;
    activeLayerId = this.config.activeLayerId;
    goToNextTimestamp = this.timeline.goToNextTimestamp;
    goToPrevTimestamp = this.timeline.goToPrevTimestamp;

    addLayer(type: LayerType = 'shape') {
        const layer = this.config.addLayer(type);
        const fontSize = this.settings.fontSize();
        this.config.store.editLayer(layer.id, { fontSize });
        return layer;
    }

    updateStaticPosition(layerId: LayerId, position: StaticPosition) {
        const playheadMs = this.timeline.playheadPositionMs();

        const existingKeyframe = this.timeline.getKeyframeAtPlayhead(layerId);

        if (existingKeyframe) {
            this.config.updateKeyframeProperty(
                existingKeyframe.id,
                'staticPosition',
                position
            );
        } else {
            const keyframeId = generateId<KeyframeId>();
            const layer = this.config.store.layersEntityMap()[layerId];
            const layerType = layer?.type || 'text';

            this.config.addKeyframeState(keyframeId, layerId, layerType, {
                staticPosition: {
                    value: position,
                    active: true,
                },
            });

            this.timeline.insertKeyframe({
                id: keyframeId,
                trackId: layerId,
                timeMs: playheadMs,
            });
        }

        this.map.updateAnimatedProperty(layerId, 'staticPosition', position);
    }

    timelineTracks = computed<TrackModel[]>(() => {
        const timelineKeyframes = this.timeline.keyframesEntities();
        const timelineTracks = this.timeline.tracksEntities();
        const configKeyframeStates = this.config.keyframeStatesEntityMap();
        const activeMode = this.config.selectedPropertyMode();
        return timelineTracks.map(track => {
            const keyframes = timelineKeyframes
                .filter(kf => kf.trackId === track.id)
                .sort((a, b) => a.timeMs - b.timeMs)
                .map(kf => {
                    const { id, timeMs } = kf;
                    const draggable =
                        activeMode === 'all' ||
                        configKeyframeStates[id]?.properties[activeMode]
                            ?.active ||
                        false;
                    return { id, timeMs, draggable };
                });
            return { id: track.id, color: track.color, keyframes };
        });
    });

    activeTransitions = computed(() => {
        const keyframeConfigState = this.config.keyframeStatesEntityMap();
        const layersMap = this.config.store.layersEntityMap();
        return this.timelineTracks().map(track => {
            const layer = layersMap[track.id];
            const layerType = layer?.type || 'shape';
            const allProperties =
                LAYER_TYPE_METADATA[layerType]['keyframeProperties'] || [];

            const propertiesKeyframes: {
                [K in PropertyType]?: TrackKeyframeModel[];
            } = {};
            allProperties.forEach(prop => {
                propertiesKeyframes[prop] = track.keyframes.filter(kf => {
                    const state = keyframeConfigState[kf.id];
                    return state?.properties[prop]?.active ?? false;
                });
            });

            return {
                id: track.id,
                propertiesKeyframes,
            };
        });
    });

    resolvedPlayheadData = computed(() => {
        const playheadMs = this.timeline.playheadPositionMs();
        const activeTransitions = this.activeTransitions();
        return activeTransitions.map(track => {
            const propertiesData: {
                [K in PropertyType]?: {
                    from: KeyframeId | null;
                    to: KeyframeId | null;
                    t: number | null;
                };
            } = {};
            Object.keys(track.propertiesKeyframes).forEach(prop => {
                const { prev, next, t } = getBracketingKeyframes(
                    track.propertiesKeyframes[prop as PropertyType] || [],
                    playheadMs
                );
                propertiesData[prop as PropertyType] = {
                    from: prev?.id ?? null,
                    to: next?.id ?? null,
                    t,
                };
            });
            return {
                trackId: track.id,
                propertiesData,
            };
        });
    });

    private addCameraLayer() {
        const id = 'camera' as LayerId;
        const name = 'View';
        const timelineColor: Rgb = { r: 255, g: 255, b: 255 };
        const layer = createLayer('camera', id, name, timelineColor);
        patchState(
            this.config.store as InferStoreType<typeof this.config.store>,
            addEntity(layer, { collection: 'layers' })
        );
        this.timeline.addTrack({ id, color: layer.timelineColor });
    }

    constructor() {
        this.addCameraLayer();
    }

    private filterProperties(
        properties: PropertyValues,
        predicate: (key: string) => boolean
    ) {
        return Object.fromEntries(
            Object.entries(properties).filter(
                ([key, data]) => data?.active && predicate(key)
            )
        ) as PropertyValues;
    }

    splitKeyframeIfNeeded(keyframeId: KeyframeId) {
        const mode = this.config.selectedPropertyMode();
        if (mode === 'all') return;

        const stateMap = this.config.keyframeStatesEntityMap();
        const state = stateMap[keyframeId];
        if (!state) return;

        const isModeActive = state.properties[mode]?.active;
        if (!isModeActive) return;

        const hasOtherProps = (
            Object.keys(state.properties) as (keyof typeof state.properties)[]
        ).some(p => p !== mode && state.properties[p]?.active);
        if (!hasOtherProps) return;

        const kfMap = this.timeline.keyframesEntityMap();
        const originalKf = kfMap[keyframeId];
        if (!originalKf) return;

        const newKfId = generateId<KeyframeId>();

        const draggedProperties = this.filterProperties(
            state.properties,
            key => key === mode
        );

        const leftBehindProperties = this.filterProperties(
            state.properties,
            key => key !== mode
        );

        this.config.removeKeyframeState(keyframeId);
        this.config.addKeyframeState(
            keyframeId,
            state.layerId,
            state.layerType,
            draggedProperties
        );
        this.config.addKeyframeState(
            newKfId,
            state.layerId,
            state.layerType,
            leftBehindProperties
        );

        this.timeline.insertKeyframe({
            id: newKfId,
            timeMs: originalKf.timeMs,
            trackId: originalKf.trackId,
        });
    }

    copyKeyframeProperty(keyframeId: KeyframeId) {
        const mode = this.config.selectedPropertyMode();

        const stateMap = this.config.keyframeStatesEntityMap();
        const state = stateMap[keyframeId];
        if (!state) return;

        const kfMap = this.timeline.keyframesEntityMap();
        const originalKf = kfMap[keyframeId];
        if (!originalKf) return;

        const newKfId = generateId<KeyframeId>();

        const allProperties: PropertyValues = {};
        for (const key of Object.keys(state.properties) as PropertyType[]) {
            this.copyActiveProperty(allProperties, state.properties, key);
        }

        this.config.addKeyframeState(
            newKfId,
            state.layerId,
            state.layerType,
            allProperties
        );

        this.timeline.insertKeyframe({
            id: newKfId,
            trackId: originalKf.trackId,
            timeMs: originalKf.timeMs,
        });

        if (mode !== 'all') {
            const modeProp = state.properties[mode];
            if (!modeProp?.active) return;

            const draggedProperties: PropertyValues = {
                [mode]: { value: modeProp.value, active: modeProp.active },
            };

            this.config.setKeyframeProperties(keyframeId, draggedProperties);
        }
    }

    mergeKeyframeIfNeeded(keyframeId: KeyframeId) {
        const mode = this.config.selectedPropertyMode();
        if (mode === 'all') return;

        const kfMap = this.timeline.keyframesEntityMap();
        const droppedKf = kfMap[keyframeId];
        if (!droppedKf) return;

        const allKeyframes = this.timeline.keyframesEntities();
        const siblings = allKeyframes.filter(
            kf =>
                kf.trackId === droppedKf.trackId &&
                kf.timeMs === droppedKf.timeMs &&
                kf.id !== keyframeId
        );

        if (siblings.length === 0) return;

        const stateMap = this.config.keyframeStatesEntityMap();
        const droppedState = stateMap[keyframeId];
        if (!droppedState) return;

        const targetKf = siblings[0];
        const targetState = stateMap[targetKf.id];
        if (!targetState) return;

        const mergedProperties: PropertyValues = { ...targetState.properties };

        for (let i = 1; i < siblings.length; i++) {
            const sibling = siblings[i];
            const siblingState = stateMap[sibling.id];
            if (!siblingState) continue;

            for (const key of Object.keys(siblingState.properties) as PropertyType[]) {
                this.copyActiveProperty(mergedProperties, siblingState.properties, key);
            }
            this.timeline.removeKeyframeById(sibling.id);
            this.config.removeKeyframeState(sibling.id);
        }

        for (const key of Object.keys(droppedState.properties) as PropertyType[]) {
            this.copyActiveProperty(mergedProperties, droppedState.properties, key);
        }

        this.timeline.removeKeyframeById(keyframeId);
        this.config.removeKeyframeState(keyframeId);

        this.config.setKeyframeProperties(targetKf.id, mergedProperties);
    }

    private copyActiveProperty<P extends PropertyType>(
        target: PropertyValues,
        source: PropertyValues,
        key: P
    ): void {
        const prop = source[key];
        if (prop?.active) {
            target[key] = prop;
        }
    }
}
