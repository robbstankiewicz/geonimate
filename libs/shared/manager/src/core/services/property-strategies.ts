import { MapService } from '@geonimate/map';
import { KeyframeState as KeyframeConfigState } from '@geonimate/config';
import { poly2poly } from 'poly2poly';
import {
    formatNumber,
    KeyframeId,
    Layer,
    PropertyType,
    Rgb,
    StaticPosition,
    ValueByPropertyType,
} from '@geonimate/shared-utils';

function lerpChannel(a: number, b: number, t: number): number {
    return Math.round(a + (b - a) * t);
}

function interpolateRgb(
    from: Rgb | null | undefined,
    to: Rgb | null | undefined,
    t: number
): Rgb | null {
    const a = from ?? undefined;
    const b = to ?? undefined;
    if (a === undefined && b === undefined) {
        return null;
    }
    if (a === undefined) {
        return b ?? null;
    }
    if (b === undefined) {
        return a;
    }
    return {
        r: lerpChannel(a.r, b.r, t),
        g: lerpChannel(a.g, b.g, t),
        b: lerpChannel(a.b, b.b, t),
    };
}


export interface PropertyStrategy<T extends PropertyType = PropertyType> {
    id: T;
    applyEffect: (
        mapService: MapService,
        targetLayer: Layer,
        interpolatedData: {
            from: KeyframeId | null;
            to: KeyframeId | null;
            t: number | null;
        },
        stateMap: {
            [key: KeyframeId]: KeyframeConfigState;
        }
    ) => void;
    getValue: (
        interpolatedData: {
            from: KeyframeId | null;
            to: KeyframeId | null;
            t: number | null;
        },
        stateMap: {
            [key: KeyframeId]: KeyframeConfigState;
        },
        mapService?: MapService
    ) => ValueByPropertyType<T> | null;
}

function getPropertyValue<T>(
    state: KeyframeConfigState | undefined,
    property: PropertyType
): T | undefined {
    return state?.properties[property]?.value as T | undefined;
}

export const PROPERTY_STRATEGIES: {
    [P in PropertyType]: PropertyStrategy<P>;
} = {
    shape: {
        id: 'shape',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            mapService.updateAnimationFeature(
                targetLayer.id,
                value as [number, number][] | null
            );
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromRing = getPropertyValue<[number, number][]>(
                stateMap[interpolatedData.from],
                'shape'
            );
            const toRing = getPropertyValue<[number, number][]>(
                stateMap[interpolatedData.to],
                'shape'
            );

            if (!fromRing || !toRing) {
                return fromRing ?? null;
            }

            return poly2poly(fromRing, toRing, interpolatedData.t) as [
                number,
                number,
            ][];
        },
    },
    opacity: {
        id: 'opacity',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            if (value !== null && typeof value === 'number') {
                mapService.updateLayerOpacity(targetLayer.id, value);
            }
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<number>(
                stateMap[interpolatedData.from],
                'opacity'
            );
            const toValue = getPropertyValue<number>(
                stateMap[interpolatedData.to],
                'opacity'
            );
            if (fromValue === undefined && toValue === undefined) {
                return null;
            }
            const fromNum = fromValue ?? 100;
            const toNum = toValue ?? 100;
            return fromNum + (toNum - fromNum) * interpolatedData.t;
        },
    },
    display: {
        id: 'display',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            if (value !== null && typeof value === 'boolean') {
                mapService.updateLayerDisplay(targetLayer.id, value);
            }
        },
        getValue(interpolatedData, stateMap) {
            if (interpolatedData.from === null) {
                return null;
            }
            const value = getPropertyValue<boolean>(
                stateMap[interpolatedData.from],
                'display'
            );
            return value ?? null;
        },
    },
    mapPosition: {
        id: 'mapPosition',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            const point =
                value &&
                Array.isArray(value) &&
                value.length === 2 &&
                typeof value[0] === 'number' &&
                typeof value[1] === 'number'
                    ? (value as [number, number])
                    : null;
            mapService.updatePointFeature(targetLayer.id, point);
            mapService.updateAnimatedProperty(
                targetLayer.id,
                'mapPosition',
                value
            );
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<[number, number]>(
                stateMap[interpolatedData.from],
                'mapPosition'
            );
            const toValue = getPropertyValue<[number, number]>(
                stateMap[interpolatedData.to],
                'mapPosition'
            );
            if (fromValue == null && toValue == null) {
                return null;
            }
            if (fromValue == null) {
                return toValue ?? null;
            }
            if (toValue == null) {
                return fromValue;
            }
            return [
                fromValue[0] + (toValue[0] - fromValue[0]) * interpolatedData.t,
                fromValue[1] + (toValue[1] - fromValue[1]) * interpolatedData.t,
            ] as [number, number];
        },
    },
    staticPosition: {
        id: 'staticPosition',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap, mapService);
            if (value) {
                mapService.updateAnimatedProperty(
                    targetLayer.id,
                    'staticPosition',
                    value
                );
            }
        },
        getValue(interpolatedData, stateMap, mapService?: MapService) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }

            const fromValue = getPropertyValue<StaticPosition>(
                stateMap[interpolatedData.from],
                'staticPosition'
            );
            const toValue = getPropertyValue<StaticPosition>(
                stateMap[interpolatedData.to],
                'staticPosition'
            );

            if (!fromValue || !toValue) {
                return fromValue ?? toValue ?? null;
            }

            const container = mapService?.getMapElement?.();
            const containerWidth = container?.offsetWidth ?? 1920;
            const containerHeight = container?.offsetHeight ?? 1080;

            const fromCenterX =
                fromValue.anchorX === 'left'
                    ? fromValue.offsetX
                    : containerWidth - fromValue.offsetX;
            const fromCenterY =
                fromValue.anchorY === 'top'
                    ? fromValue.offsetY
                    : containerHeight - fromValue.offsetY;

            const toCenterX =
                toValue.anchorX === 'left'
                    ? toValue.offsetX
                    : containerWidth - toValue.offsetX;
            const toCenterY =
                toValue.anchorY === 'top'
                    ? toValue.offsetY
                    : containerHeight - toValue.offsetY;

            const currentCenterX =
                fromCenterX + (toCenterX - fromCenterX) * interpolatedData.t;
            const currentCenterY =
                fromCenterY + (toCenterY - fromCenterY) * interpolatedData.t;

            const anchorX: 'left' | 'right' =
                currentCenterX < containerWidth / 2 ? 'left' : 'right';
            const anchorY: 'top' | 'bottom' =
                currentCenterY < containerHeight / 2 ? 'top' : 'bottom';

            const offsetX =
                anchorX === 'left'
                    ? currentCenterX
                    : containerWidth - currentCenterX;
            const offsetY =
                anchorY === 'top'
                    ? currentCenterY
                    : containerHeight - currentCenterY;

            return {
                anchorX,
                anchorY,
                offsetX,
                offsetY,
            };
        },
    },
    color: {
        id: 'color',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            mapService.updateAnimatedProperty(targetLayer.id, 'color', value);
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<Rgb>(
                stateMap[interpolatedData.from],
                'color'
            );
            const toValue = getPropertyValue<Rgb>(
                stateMap[interpolatedData.to],
                'color'
            );
            return interpolateRgb(fromValue, toValue, interpolatedData.t);
        },
    },
    fontColor: {
        id: 'fontColor',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            mapService.updateAnimatedProperty(
                targetLayer.id,
                'fontColor',
                value
            );
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<Rgb>(
                stateMap[interpolatedData.from],
                'fontColor'
            );
            const toValue = getPropertyValue<Rgb>(
                stateMap[interpolatedData.to],
                'fontColor'
            );
            return interpolateRgb(fromValue, toValue, interpolatedData.t);
        },
    },
    // text: {
    //     id: 'text',
    //     applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
    //         const value = this.getValue(interpolatedData, stateMap);
    //         mapService.updateAnimatedProperty(targetLayer.id, 'text', value);
    //     },
    //     getValue(interpolatedData, stateMap) {
    //         if (interpolatedData.from === null) {
    //             return null;
    //         }
    //         const value = getPropertyValue<string>(
    //             stateMap[interpolatedData.from],
    //             'text'
    //         );
    //         return value ?? null;
    //     },
    // },
    label: {
        id: 'label',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            mapService.updateAnimatedProperty(targetLayer.id, 'label', value);
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<string>(
                stateMap[interpolatedData.from],
                'label'
            );
            const toValue = getPropertyValue<string>(
                stateMap[interpolatedData.to],
                'label'
            );

            if (fromValue == null && toValue == null) {
                return null;
            }
            if (fromValue == null) {
                return toValue ?? null;
            }
            if (toValue == null) {
                return fromValue;
            }

            const fromNum = Number(fromValue);
            const toNum = Number(toValue);

            if (
                !isNaN(fromNum) &&
                !isNaN(toNum) &&
                String(fromValue).trim() !== '' &&
                String(toValue).trim() !== ''
            ) {
                const current =
                    fromNum + (toNum - fromNum) * interpolatedData.t;
                const isInteger =
                    Number.isInteger(fromNum) && Number.isInteger(toNum);
                if (isInteger) {
                    const rounded = Math.round(current);
                    return String(rounded === 0 ? 0 : rounded);
                }
                return formatNumber(current, 2);
            } else {
                return fromValue;
            }
        },
    },
    number: {
        id: 'number',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            mapService.updateAnimatedProperty(targetLayer.id, 'number', value);
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<number>(
                stateMap[interpolatedData.from],
                'number'
            );
            const toValue = getPropertyValue<number>(
                stateMap[interpolatedData.to],
                'number'
            );
            if (fromValue === undefined && toValue === undefined) {
                return null;
            }
            const fromNum = fromValue ?? 0;
            const toNum = toValue ?? 0;
            return fromNum + (toNum - fromNum) * interpolatedData.t;
        },
    },
    date: {
        id: 'date',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            const value = this.getValue(interpolatedData, stateMap);
            mapService.updateAnimatedProperty(targetLayer.id, 'date', value);
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<string>(
                stateMap[interpolatedData.from],
                'date'
            );
            const toValue = getPropertyValue<string>(
                stateMap[interpolatedData.to],
                'date'
            );

            if (fromValue === undefined && toValue === undefined) {
                return null;
            }
            if (fromValue === undefined) {
                return toValue ?? null;
            }
            if (toValue === undefined) {
                return fromValue;
            }

            const fromTime = new Date(fromValue).getTime();
            const toTime = new Date(toValue).getTime();

            if (isNaN(fromTime) || isNaN(toTime)) {
                return null;
            }

            return new Date(
                fromTime + (toTime - fromTime) * interpolatedData.t
            ).toISOString();
        },
    },
    center: {
        id: 'center',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            if (targetLayer.type === 'camera' && targetLayer.cameraLocked)
                return;
            const value = this.getValue(interpolatedData, stateMap);
            if (value && Array.isArray(value) && value.length === 2) {
                mapService.setCenter(value as [number, number]);
            }
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<[number, number]>(
                stateMap[interpolatedData.from],
                'center'
            );
            const toValue = getPropertyValue<[number, number]>(
                stateMap[interpolatedData.to],
                'center'
            );
            if (fromValue === undefined && toValue === undefined) {
                return null;
            }
            if (fromValue === undefined) {
                return toValue ?? null;
            }
            if (toValue === undefined) {
                return fromValue;
            }
            return [
                fromValue[0] + (toValue[0] - fromValue[0]) * interpolatedData.t,
                fromValue[1] + (toValue[1] - fromValue[1]) * interpolatedData.t,
            ] as [number, number];
        },
    },
    zoom: {
        id: 'zoom',
        applyEffect(mapService, targetLayer, interpolatedData, stateMap) {
            if (targetLayer.type === 'camera' && targetLayer.cameraLocked)
                return;
            const value = this.getValue(interpolatedData, stateMap);
            if (value !== null && typeof value === 'number') {
                mapService.setZoom(value);
            }
        },
        getValue(interpolatedData, stateMap) {
            if (
                interpolatedData.from === null ||
                interpolatedData.to === null ||
                interpolatedData.t === null
            ) {
                return null;
            }
            const fromValue = getPropertyValue<number>(
                stateMap[interpolatedData.from],
                'zoom'
            );
            const toValue = getPropertyValue<number>(
                stateMap[interpolatedData.to],
                'zoom'
            );
            if (fromValue === undefined && toValue === undefined) {
                return null;
            }
            if (fromValue === undefined) {
                return toValue ?? null;
            }
            if (toValue === undefined) {
                return fromValue;
            }
            return fromValue + (toValue - fromValue) * interpolatedData.t;
        },
    },
};
