import {
    KeyframeId,
    LAYER_TYPE_METADATA,
    PropertyType,
    TimeMs,
    ValueByPropertyType,
} from '@geonimate/shared-utils';
import {
    PropertyValues,
    KeyframeState as KeyframeConfigState,
} from '@geonimate/config';
import { PROPERTY_STRATEGIES } from '../services/property-strategies';

export interface GenericKeyframe {
    id: KeyframeId;
    timeMs: TimeMs;
}

export function getBracketingKeyframes(
    keyframes: GenericKeyframe[],
    timeMs: number
): {
    prev: GenericKeyframe | null;
    next: GenericKeyframe | null;
    t: number | null;
} {
    if (keyframes.length === 0) {
        return { prev: null, next: null, t: null };
    }

    let ki = 0;
    while (ki < keyframes.length && keyframes[ki].timeMs <= timeMs) {
        ki++;
    }

    let prevKf: GenericKeyframe;
    let nextKf: GenericKeyframe;

    if (ki === 0) {
        prevKf = keyframes[0];
        nextKf = keyframes[0];
    } else if (ki >= keyframes.length) {
        prevKf = keyframes[keyframes.length - 1];
        nextKf = keyframes[keyframes.length - 1];
    } else {
        prevKf = keyframes[ki - 1];
        nextKf = keyframes[ki];
    }

    const t =
        nextKf.timeMs === prevKf.timeMs
            ? 1
            : (timeMs - prevKf.timeMs) / (nextKf.timeMs - prevKf.timeMs);

    return { prev: prevKf, next: nextKf, t };
}

function copyActiveProperty<P extends PropertyType>(
    target: PropertyValues,
    source: PropertyValues,
    key: P
): void {
    const prop = source[key];
    if (prop?.active) {
        target[key] = prop;
    }
}

export function inheritValues(
    prevKf: GenericKeyframe,
    stateMap: Record<string, KeyframeConfigState>
): PropertyValues {
    const values: PropertyValues = {};
    const prevState = stateMap[prevKf.id];

    if (!prevState) return values;

    for (const key of Object.keys(prevState.properties) as PropertyType[]) {
        copyActiveProperty(values, prevState.properties, key);
    }

    return values;
}

function interpolateProperty<P extends PropertyType>(
    values: PropertyValues,
    prop: P,
    prevKf: GenericKeyframe,
    nextKf: GenericKeyframe,
    t: number,
    stateMap: { [key: KeyframeId]: KeyframeConfigState }
): void {
    const prevState = stateMap[prevKf.id];
    if (!prevState) {
        return;
    }
    const prevData = prevState.properties[prop];
    const strategy = PROPERTY_STRATEGIES[prop];

    let value: ValueByPropertyType<P> | null;

    if (strategy) {
        value = strategy.getValue(
            { from: prevKf.id, to: nextKf.id, t },
            stateMap
        );
    } else {
        value = prevData?.value ?? null;
    }

    if (value !== null) {
        Object.assign(values, {
            [prop]: {
                value,
                active: prevData?.active ?? false,
            },
        });
    }
}

export function interpolateValues(
    prevKf: GenericKeyframe,
    nextKf: GenericKeyframe,
    t: number,
    stateMap: { [key: KeyframeId]: KeyframeConfigState }
): PropertyValues {
    const values: PropertyValues = {};
    const prevState = stateMap[prevKf.id];
    const nextState = stateMap[nextKf.id];

    if (!prevState || !nextState) return values;

    const layerType = prevState.layerType;
    const allProps =
        LAYER_TYPE_METADATA[layerType]['keyframeProperties'] || [];

    for (const prop of allProps) {
        interpolateProperty(
            values,
            prop,
            prevKf,
            nextKf,
            t,
            stateMap
        );
    }

    return values;
}
