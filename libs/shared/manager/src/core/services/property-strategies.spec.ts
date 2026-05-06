import { KeyframeState as KeyframeConfigState } from '@geonimate/config';
import { MapService } from '@geonimate/map';
import {
    createLayer,
    generateId,
    KeyframeId,
    LayerId,
} from '@geonimate/shared-utils';
import { PROPERTY_STRATEGIES } from './property-strategies';

describe('Camera lock', () => {
    const cameraId = 'camera' as LayerId;
    const k1 = generateId<KeyframeId>();
    const k2 = generateId<KeyframeId>();

    function cameraKeyframeState(
        id: KeyframeId,
        center: [number, number],
        zoom: number
    ): KeyframeConfigState {
        return {
            id,
            layerId: cameraId,
            layerType: 'camera',
            properties: {
                center: { active: true, value: center },
                zoom: { active: true, value: zoom },
            },
        } as KeyframeConfigState;
    }

    const interpolatedData = { from: k1, to: k2, t: 0.5 };
    const stateMap = {
        [k1]: cameraKeyframeState(k1, [0, 0], 2),
        [k2]: cameraKeyframeState(k2, [10, 20], 8),
    };

    it('center: calls setCenter when camera keyframes are unlocked', () => {
        const map = { setCenter: jest.fn(), setZoom: jest.fn() } as unknown as MapService;
        const targetLayer = {
            ...createLayer('camera', cameraId, 'c', {
                r: 0,
                g: 0,
                b: 0,
            }),
            cameraLocked: false,
        };

        PROPERTY_STRATEGIES.center.applyEffect(
            map,
            targetLayer,
            interpolatedData,
            stateMap
        );

        expect(map.setCenter).toHaveBeenCalled();
    });

    it('center: does not call setCenter when camera keyframes are locked', () => {
        const map = { setCenter: jest.fn(), setZoom: jest.fn() } as unknown as MapService;
        const targetLayer = {
            ...createLayer('camera', cameraId, 'c', {
                r: 0,
                g: 0,
                b: 0,
            }),
            cameraLocked: true,
        };

        PROPERTY_STRATEGIES.center.applyEffect(
            map,
            targetLayer,
            interpolatedData,
            stateMap
        );

        expect(map.setCenter).not.toHaveBeenCalled();
    });

});

describe('PROPERTY_STRATEGIES.label', () => {
    const layerId = 'text-layer' as LayerId;
    const k1 = generateId<KeyframeId>();
    const k2 = generateId<KeyframeId>();

    function textKeyframeState(
        id: KeyframeId,
        label: string
    ): KeyframeConfigState {
        return {
            id,
            layerId,
            layerType: 'text',
            properties: {
                label: { active: true, value: label },
            },
        } as KeyframeConfigState;
    }

    it('formats interpolated fractional midpoint near zero as 0.00, not -0.00', () => {
        const interpolatedData = { from: k1, to: k2, t: 0.58 };
        const stateMap = {
            [k1]: textKeyframeState(k1, '-14.5'),
            [k2]: textKeyframeState(k2, '10.5'),
        };

        const rawNearZero =
            -14.5 + (10.5 - -14.5) * interpolatedData.t;
        expect(rawNearZero.toFixed(2)).toBe('-0.00');

        expect(
            PROPERTY_STRATEGIES.label.getValue(interpolatedData, stateMap)
        ).toBe('0.00');
    });

    it('keeps Math.round semantics for integer label interpolation at half values', () => {
        const interpolatedData = { from: k1, to: k2, t: 1 / 6 };
        const stateMap = {
            [k1]: textKeyframeState(k1, '-2'),
            [k2]: textKeyframeState(k2, '1'),
        };

        expect(
            PROPERTY_STRATEGIES.label.getValue(interpolatedData, stateMap)
        ).toBe('-1');
    });
});

