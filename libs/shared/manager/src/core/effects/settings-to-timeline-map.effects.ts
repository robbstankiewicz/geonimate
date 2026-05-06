import { effect, inject, Injectable, untracked } from '@angular/core';
import { MapService } from '@geonimate/map';
import { TimelineService } from '@geonimate/timeline';
import { settingsStore } from '@geonimate/settings';

@Injectable()
export class SettingsToTimelineMapEffects {
    private map = inject(MapService);
    private timeline = inject(TimelineService);
    private settings = inject(settingsStore);

    constructor() {
        effect(() => {
            const timeMs = this.settings.timeMs();
            untracked(() => this.timeline.updateMaxTimeMs(timeMs));
        });

        effect(() => {
            const fps = this.settings.fps();
            untracked(() => this.timeline.updateFps(fps));
        });

        effect(() => {
            const layerName = this.settings.backgroundLayer();
            untracked(() => {
                const layers = this.map.backgroundLayers();
                const layer = layers.find(
                    (l: { name: string }) => l.name === layerName
                );
                if (layer) {
                    this.map.setActiveBackgroundLayer(layer.id);
                }
            });
        });

        effect(() => {
            const fontFamily = this.settings.fontFamily();
            untracked(() => this.map.setGlobalFontFamily(fontFamily));
        });

        effect(() => {
            const fontSize = this.settings.fontSize();
            untracked(() => this.map.setGlobalFontSize(fontSize));
        });

        effect(() => {
            const scaleTextWithMap = this.settings.scaleTextWithMap();
            untracked(() => this.map.setScaleTextWithMap(scaleTextWithMap));
        });
    }
}
