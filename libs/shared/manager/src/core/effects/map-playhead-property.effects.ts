import { effect, inject, Injectable, untracked } from '@angular/core';
import { MapService } from '@geonimate/map';
import { ConfigService } from '@geonimate/config';
import { PropertyType } from '@geonimate/shared-utils';
import { PROPERTY_STRATEGIES } from '../services/property-strategies';
import { ManagerService } from '../services/manager.service';

@Injectable()
export class MapPlayheadPropertyEffects {
    private manager = inject(ManagerService);
    private map = inject(MapService);
    private config = inject(ConfigService);

    constructor() {
        effect(() => {
            const playheadData = this.manager.resolvedPlayheadData();
            const stateMap = this.config.keyframeStatesEntityMap();

            untracked(() => {
                const layersById = this.config.store.layersEntityMap();
                for (const data of playheadData) {
                    const targetLayer = layersById[data.trackId];
                    if (!targetLayer) {
                        continue;
                    }
                    Object.keys(data.propertiesData).forEach(prop => {
                        const strategy =
                            PROPERTY_STRATEGIES[prop as PropertyType];
                        const propData =
                            data.propertiesData[prop as PropertyType];
                        if (strategy && propData) {
                            strategy.applyEffect(
                                this.map,
                                targetLayer,
                                propData,
                                stateMap
                            );
                        }
                    });
                }
            });
        });
    }
}
