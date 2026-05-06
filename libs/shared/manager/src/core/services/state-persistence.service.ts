import { Injectable, inject } from '@angular/core';
import { configStore } from '@geonimate/config';
import type { KeyframeState as ConfigKeyframeState } from '@geonimate/config';
import { MapService } from '@geonimate/map';
import { settingsStore, SettingsState } from '@geonimate/settings';
import {
    TimelineService,
    timelineStore,
    type Track,
    type KeyframeState as TimelineKeyframeState,
} from '@geonimate/timeline';
import type { Layer } from '@geonimate/shared-utils';
import { ErrorService } from '@geonimate/shared-core';

export const REPLAY_FILE_VERSION = 1 as const;

export interface GeoAnimateReplayV1 {
    version: typeof REPLAY_FILE_VERSION;
    settings: SettingsState;
    config: {
        layers: Layer[];
        keyframeStates: ConfigKeyframeState[];
    };
    timeline: {
        tracks: Track[];
        keyframes: TimelineKeyframeState[];
    };
    map: {
        center: [number, number] | null;
        zoom: number | null;
    };
}

@Injectable()
export class StatePersistenceService {
    private settings = inject(settingsStore);
    private config = inject(configStore);
    private timelineStore = inject(timelineStore);
    private timeline = inject(TimelineService);
    private map = inject(MapService);
    private errorService = inject(ErrorService);

    exportState(): GeoAnimateReplayV1 {
        return {
            version: REPLAY_FILE_VERSION,
            settings: {
                timeMs: this.settings.timeMs(),
                fps: this.settings.fps(),
                fontFamily: this.settings.fontFamily(),
                fontSize: this.settings.fontSize(),
                backgroundLayer: this.settings.backgroundLayer(),
                scaleTextWithMap: this.settings.scaleTextWithMap(),
            },
            config: {
                layers: this.config.layersEntities(),
                keyframeStates: this.config.keyframeStatesEntities(),
            },
            timeline: {
                tracks: this.timelineStore.tracksEntities(),
                keyframes: this.timelineStore.keyframesEntities(),
            },
            map: {
                center: this.map.getCenter(),
                zoom: this.map.getZoom(),
            },
        };
    }

    downloadJson(filename = 'geonimate-replay.json'): void {
        const payload = this.exportState();
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    async applyFromUrl(url: string): Promise<void> {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                this.errorService.showError(
                    'Demo load failed',
                    `Could not fetch demo (${res.status}).`
                );
                return;
            }
            const parsed = await res.json();
            this.applySnapshot(parsed);
        } catch {
            this.errorService.showError(
                'Demo load failed',
                'Could not fetch or parse demo file.'
            );
        }
    }

    async importFromFile(file: File): Promise<void> {
        try {
            const text = await file.text();
            const parsed= JSON.parse(text);
            this.applySnapshot(parsed);
        } catch {
            this.errorService.showError(
                'Import failed',
                'Could not read or parse JSON.'
            );
        }
    }

    applySnapshot(snapshot: GeoAnimateReplayV1): void {
        this.timeline.togglePlay(false);
        const rawSettings = snapshot.settings
        this.settings.loadState({
            timeMs: rawSettings.timeMs,
            fps: rawSettings.fps,
            fontFamily: rawSettings.fontFamily as string,
            fontSize: rawSettings.fontSize,
            backgroundLayer: rawSettings.backgroundLayer,
            scaleTextWithMap: rawSettings.scaleTextWithMap ?? true,
        });
        this.config.loadState(snapshot.config);
        this.timelineStore.loadState(snapshot.timeline);
        this.map.rebuildLayers(snapshot.config.layers);
        this.map.clearAnimatedProperties();
        const visualLayerIds = snapshot.config.layers
            .filter(l => l.type !== 'camera')
            .map(l => l.id);
        this.map.updateZIndexes(visualLayerIds);
        const { center, zoom } = snapshot.map;
        if (
            center !== null &&
            Array.isArray(center) &&
            center.length === 2 &&
            typeof center[0] === 'number' &&
            typeof center[1] === 'number'
        ) {
            this.map.setCenter(center as [number, number]);
        }
        if (zoom !== null && typeof zoom === 'number') {
            this.map.setZoom(zoom);
        }
    }
}
