import { InjectionToken, type Provider } from '@angular/core';

export interface DemoMeta {
    id: string;
    title: string;
    file: string;
}

export const DEMO_REGISTRY = new InjectionToken<readonly DemoMeta[]>('DEMO_REGISTRY', {
    factory: () => [],
});

export function provideDemos(demos: readonly DemoMeta[]): Provider {
    return { provide: DEMO_REGISTRY, useValue: demos };
}
