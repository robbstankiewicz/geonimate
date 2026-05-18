import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { ErrorService } from '@geonimate/shared-core';
import { provideManager } from '@geonimate/shared-manager';
import { provideDemos } from '@geonimate/demos';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideStore({}),
        provideEffects(),
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection(),
        provideRouter(appRoutes),
        providePrimeNG({
            theme: {
                preset: Aura,
            },
        }),
        MessageService,
        ErrorService,
        provideManager(),
        provideDemos([
            {
                id: 'europe-gdp',
                title: 'Europe GDP over the years',
                file: 'demos/europe-gdp.json',
            },
            {
                id: 'heartbeat',
                title: 'Shape animation',
                file: 'demos/heartbeat.json',
            }
        ]),
    ],
};
