import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { isDevMode } from '@angular/core';
import { ErrorService } from '@geonimate/shared-core';
import { provideManager } from '@geonimate/shared-manager';
import { MessageService } from 'primeng/api';


export const appConfig: ApplicationConfig = {
    providers: [
        provideStore({}),
        provideStoreDevtools({
            logOnly: !isDevMode(),
            connectInZone: true,
        }),
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
    ],
};
