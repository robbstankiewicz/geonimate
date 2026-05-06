import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    ConfigService,
} from '@geonimate/config';
import { MapService } from '@geonimate/map';
import { TimelineService } from '@geonimate/timeline';
import { generateId, KeyframeId, LayerId } from '@geonimate/shared-utils';
import { PropertyValues } from '@geonimate/config';
import { Point, Polygon } from 'ol/geom';

function toOpenRing(ring: [number, number][]): [number, number][] {
    if (ring.length < 2) return ring;
    // first el
    const [fx, fy] = ring[0];
    // last el
    const [lx, ly] = ring[ring.length - 1];
    // compare and slice
    return fx === lx && fy === ly ? ring.slice(0, -1) : ring;
}

@Injectable()
export class MapToConfigTimelineEffects {
    private map = inject(MapService);
    private config = inject(ConfigService);
    private timeline = inject(TimelineService);

    constructor() {
        this.map.featureUpdated$
            .pipe(takeUntilDestroyed())
            .subscribe(
                ({
                    layerId,
                    geometry,
                }: {
                    layerId: LayerId;
                    geometry: Polygon | Point;
                }) => {
                    const keyframeId = generateId<KeyframeId>();
                    const existingKeyframe =
                        this.timeline.getKeyframeAtPlayhead(layerId);

                    if (existingKeyframe) {
                        const layer =
                            this.config.store.layersEntityMap()[layerId];
                        const layerType = layer?.type || 'shape';

                        if (layerType === 'shape') {
                            const coordinates = toOpenRing(
                                (geometry as Polygon).getCoordinates()[0] as [
                                    number,
                                    number,
                                ][]
                            );
                            this.config.updateKeyframeProperty(
                                existingKeyframe.id,
                                'shape',
                                coordinates
                            );
                            this.map.updateAnimatedProperty(
                                layerId,
                                'shape',
                                coordinates
                            );
                        } else if (
                            layerType === 'point' ||
                            layerType === 'text' ||
                            layerType === 'number' ||
                            layerType === 'date'
                        ) {
                            const position = (
                                geometry as Point
                            ).getCoordinates();
                            if (position) {
                                this.config.updateKeyframeProperty(
                                    existingKeyframe.id,
                                    'mapPosition',
                                    position
                                );
                                this.map.updateAnimatedProperty(
                                    layerId,
                                    'mapPosition',
                                    position
                                );
                            }
                        }
                    } else {
                        const layer =
                            this.config.store.layersEntityMap()[layerId];
                        const layerType = layer?.type || 'shape';
                        const values: PropertyValues = {};

                        if (layerType === 'shape') {
                            const coordinates = toOpenRing(
                                (geometry as Polygon).getCoordinates()[0] as [
                                    number,
                                    number,
                                ][]
                            );
                            values['shape'] = {
                                value: coordinates,
                                active: true,
                            };
                        } else if (
                            layerType === 'point' ||
                            layerType === 'text' ||
                            layerType === 'number' ||
                            layerType === 'date'
                        ) {
                            const position = (
                                geometry as Point
                            ).getCoordinates();
                            if (position) {
                                values['mapPosition'] = {
                                    value: position,
                                    active: true,
                                };
                            }
                        }

                        this.config.addKeyframeState(
                            keyframeId,
                            layerId,
                            layerType,
                            values
                        );
                        this.timeline.addKeyframe({
                            id: keyframeId,
                            trackId: layerId,
                        });

                        if (values['mapPosition']?.active) {
                            this.map.updateAnimatedProperty(
                                layerId,
                                'mapPosition',
                                values['mapPosition'].value
                            );
                        }
                        if (values['shape']?.active) {
                            this.map.updateAnimatedProperty(
                                layerId,
                                'shape',
                                values['shape'].value
                            );
                        }
                    }
                }
            );
    }
}
