import { Route } from '@angular/router';
import { DemoPageComponent } from '@geonimate/demos';

export const appRoutes: Route[] = [
    { path: '', pathMatch: 'full', redirectTo: 'design' },
    {
        path: 'design',
        loadComponent: () =>
            import('@geonimate/shell').then(m => m.DesignAppComponent),
    },
    {
        path: 'player',
        loadComponent: () =>
            import('@geonimate/shell').then(m => m.PlayerAppComponent),
    },
    {
        path: 'demo/:id',
        component: DemoPageComponent,
    },
    { path: '**', redirectTo: 'design' },
];
