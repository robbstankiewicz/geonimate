import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { APP_OPTIONS, BACKGROUND_LAYERS } from '@geonimate/shared-core';

function clampFontSize(size: number, min: number, max: number): number {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.min(hi, Math.max(lo, size));
}

export interface SettingsState {
    timeMs: number;
    fps: number;
    fontFamily: string;
    fontSize: number;
    backgroundLayer: string;
    scaleTextWithMap: boolean;
}

export const WEB_SAFE_FONTS = [
    'Tahoma',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Trebuchet MS',
    'Impact',
    'Courier New',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Arial Black',
    'Lucida Sans Unicode',
] as const;

export const settingsStore = signalStore(
    withState(() => {
        const appOptions = inject(APP_OPTIONS);
        const backgroundLayers = inject(BACKGROUND_LAYERS);
        const fontMin = appOptions.minFontSize ?? 1;
        const fontMax = appOptions.maxFontSize ?? 100;
        return {
            timeMs: appOptions.timeMs,
            fps: appOptions.fps,
            fontFamily: appOptions.fontFamily,
            fontSize: clampFontSize(appOptions.fontSize, fontMin, fontMax),
            backgroundLayer: backgroundLayers.default,
            scaleTextWithMap: appOptions.scaleTextWithMap ?? true,
            minFontSize: appOptions.minFontSize ?? 1,
            maxFontSize: appOptions.maxFontSize ?? 100,
        };
    }),
    withComputed(() => ({
        fontOptions: () => [...WEB_SAFE_FONTS],
    })),
    withMethods((store, backgroundLayers = inject(BACKGROUND_LAYERS)) => ({
        updateMaxTimeMs(timeMs: number) {
            patchState(store, () => ({ timeMs }));
        },
        updateFps(fps: number) {
            patchState(store, () => ({ fps }));
        },
        updateFontFamily(fontFamily: string) {
            patchState(store, () => ({ fontFamily }));
        },
        updateFontSize(fontSize: number) {
            patchState(store, () => ({
                fontSize,
            }));
        },
        updateBackgroundLayer(backgroundLayer: string) {
            patchState(store, () => ({ backgroundLayer }));
        },
        updateScaleTextWithMap(scaleTextWithMap: boolean) {
            patchState(store, () => ({ scaleTextWithMap }));
        },
        loadState(snapshot: SettingsState) {
            patchState(store, {
                ...snapshot,
                scaleTextWithMap: snapshot.scaleTextWithMap ?? true,
                fontSize: snapshot.fontSize,
            });
        },
        getBackgroundLayerOptions(): string[] {
            return backgroundLayers.layers.map(layer => layer.name);
        },
    }))
);
