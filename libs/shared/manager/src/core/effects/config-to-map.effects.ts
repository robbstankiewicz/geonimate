import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfigService } from '@geonimate/config';
import { MapService } from '@geonimate/map';
import { Layer, LayerId } from '@geonimate/shared-utils';

@Injectable()
export class ConfigToMapEffects {
    private config = inject(ConfigService);
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
                    this.map.updateLayerConfig(id, settings);
                }
            );

        this.config.layerAdded$
            .pipe(takeUntilDestroyed())
            .subscribe((layer: Layer) => {
                this.map.addLayer(layer);
                this.map.updateZIndexes(this.config.layersIds());
            });

        this.config.layerMoved$.pipe(takeUntilDestroyed()).subscribe(() => {
            const visualLayerIds = this.config.store
                .layersEntities()
                .filter((l: Layer) => l.type !== 'camera')
                .map((l: Layer) => l.id);
            this.map.updateZIndexes(visualLayerIds);
        });

        this.config.layerRemoved$
            .pipe(takeUntilDestroyed())
            .subscribe((layerId: LayerId) => {
                this.map.removeLayer(layerId);
                const visualLayerIds = this.config.store
                    .layersEntities()
                    .filter((l: Layer) => l.type !== 'camera')
                    .map((l: Layer) => l.id);
                this.map.updateZIndexes(visualLayerIds);
            });

        this.config.activeLayerChanged$
            .pipe(takeUntilDestroyed())
            .subscribe((layerId: LayerId | null) =>
                this.map.setActiveDrawingLayer(layerId)
            );
    }
}
