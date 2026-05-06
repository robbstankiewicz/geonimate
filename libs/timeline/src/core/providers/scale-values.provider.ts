import { InjectionToken } from "@angular/core";

export const SCALE_VALUES = new InjectionToken('SCALE_VALUES', {
    factory: () => [1, 1.3, 1.65, 2.2, 3]
})
