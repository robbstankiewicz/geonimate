import { InjectionToken } from '@angular/core';

export const APP_OPTIONS = new InjectionToken('APP_OPTIONS', {
    factory: () => ({
        center: [1646147.84115, 7041990.541857],
        zoom: 5,
        timeMs: 10000,
        fps: 8,
        trackPaddingPx: 30,
        fontSize: 46,
        fontFamily: 'Verdana',
        minFontSize: 1,
        maxFontSize: 100,
        scaleTextWithMap: true,
    }),
});

