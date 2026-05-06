import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfigService } from '@geonimate/config';
import { MapService } from '@geonimate/map';
import { TimelineService } from '@geonimate/timeline';
import { generateId, KeyframeId, Layer, LayerId } from '@geonimate/shared-utils';
import { PropertyValues } from '@geonimate/config';
import {
    getBracketingKeyframes,
    inheritValues,
    interpolateValues,
} from '../utils/keyframe-creation-helpers';

@Injectable()
export class ConfigToTimelineEffects {
    private config = inject(ConfigService);
    private timeline = inject(TimelineService);
    private map = inject(MapService);

    constructor() {
        this.config.layerSettingsChanged$
            .pipe(takeUntilDestroyed())
            .subscribe(
                ({
                    id,
                    settings,
                }: {
                    id: LayerId;
                    settings: Partial<Layer>;
                }) => {
                    if (settings.timelineColor !== undefined) {
                        this.timeline.editTrack(id, {
                            color: settings.timelineColor,
                        });
                    }
                }
            );

        this.config.layerAdded$
            .pipe(takeUntilDestroyed())
            .subscribe((layer: Layer) => {
                this.config.setActiveLayer(layer.id);
                this.timeline.addTrack({
                    id: layer.id,
                    color: layer.timelineColor,
                });
            });

        this.config.layerMoved$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.timeline.setOrder(this.config.layersIds());
        });

        this.config.layerRemoved$
            .pipe(takeUntilDestroyed())
            .subscribe((layerId: LayerId) => {
                this.timeline.removeTrack(layerId);
            });

        this.config.addKeyframe$
            .pipe(takeUntilDestroyed())
            .subscribe(async (trackId: LayerId) => {
                const keyframeId = generateId<KeyframeId>();
                const playheadMs = this.timeline.playheadPositionMs();

                const existingKeyframe =
                    this.timeline.getKeyframeAtPlayhead(trackId);
                if (existingKeyframe) {
                    console.warn(
                        `Keyframe already exists at ${playheadMs}ms for track ${trackId}, skipping add`
                    );
                    return;
                }

                const layer = this.config.store.layersEntityMap()[trackId];
                const layerType = layer?.type || 'shape';
                const stateMap = this.config.keyframeStatesEntityMap();

                let values: PropertyValues = {};

                if (layerType === 'camera') {
                    const center = this.map.getCenter() ?? [0, 0];
                    const zoom = this.map.getZoom() ?? 0;
                    values = {
                        center: { value: center, active: true },
                        zoom: { value: zoom, active: true },
                    };
                } else {
                    const allKeyframes =
                        this.timeline.getKeyframesForTrack(trackId);
                    const {
                        prev: prevKf,
                        next: nextKf,
                        t,
                    } = getBracketingKeyframes(allKeyframes, playheadMs);

                    if (
                        prevKf &&
                        nextKf &&
                        t !== null &&
                        prevKf.id !== nextKf.id
                    ) {
                        values = interpolateValues(
                            prevKf,
                            nextKf,
                            t,
                            stateMap
                        );
                    } else if (prevKf) {
                        values = inheritValues(prevKf, stateMap);
                    } else {
                        values = {};
                    }
                }

                this.config.addKeyframeState(
                    keyframeId,
                    trackId,
                    layerType,
                    values
                );
                this.timeline.insertKeyframe({
                    id: keyframeId,
                    trackId,
                    timeMs: playheadMs,
                });
            });

        this.config.removeKeyframeById$
            .pipe(takeUntilDestroyed())
            .subscribe((id: KeyframeId) => {
                this.timeline.removeKeyframeById(id);
                this.config.removeKeyframeState(id);
            });

        this.config.movePlayheadToKeyframe$
            .pipe(takeUntilDestroyed())
            .subscribe((id: KeyframeId) => {
                const keyframe = this.timeline.keyframesEntityMap()[id];
                if (!keyframe) {
                    return;
                }
                this.timeline.setPlayheadFreehand(keyframe.timeMs);
            });
    }
}
