/// <reference types="jest" />

import BaseLayer from 'ol/layer/Base';
import { BACKGROUND_LAYERS } from '../providers/background-layers.provider';
import { ErrorService } from '../services/error.service';

export function errorServiceMock() {
    return {
        provide: ErrorService,
        useValue: {
            showError: jest.fn(),
        },
    };
}

export function backgroundLayersMock() {
    return {
        provide: BACKGROUND_LAYERS,
        useValue: {
            layers: [
                {
                    name: 'Layer 1',
                    factory: () => Promise.resolve(new BaseLayer({})),
                },
                {
                    name: 'Layer 2',
                    factory: () => Promise.resolve(new BaseLayer({})),
                }
            ],
            default: 'Layer 1',
        },
    };
}
