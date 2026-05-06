import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { appRoutes } from './app.routes';
import { MessageService } from 'primeng/api';
import { ErrorService } from '@geonimate/shared-core';
import { provideManager } from '@geonimate/shared-manager';

export const appConfig: ApplicationConfig = {
    providers: [
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
