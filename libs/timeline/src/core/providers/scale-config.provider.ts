import { InjectionToken } from '@angular/core';

export const SCALE_CONFIG = new InjectionToken('SCALE_CONFIG', {
  factory: () => ({
    minimumSpaceForTickPx: 50,
    denominatorValuesMs: [100, 200, 250, 500, 1000, 1500, 2000, 2500, 5000],
  }),
});
