import { LayerType } from './layer.model';
import { PropertyType } from '../types/property-value';

export interface LayerTypeMetadata {
    type: LayerType;
    label: string;
    icon: string;
    keyframeProperties: PropertyType[];
}

export const LAYER_TYPE_METADATA = {
    shape: {
        type: 'shape',
        label: 'Shape',
        icon: 'pi-stop',
        keyframeProperties: [
            'shape',
            'label',
            'color',
            'fontColor',
            'opacity',
            'display',
        ],
    },
    point: {
        type: 'point',
        label: 'Point',
        icon: 'pi-map-marker',
        keyframeProperties: [
            'mapPosition',
            'staticPosition',
            'label',
            'color',
            'fontColor',
            'opacity',
            'display',
        ],
    },
    text: {
        type: 'text',
        label: 'Text',
        icon: 'pi-language',
        keyframeProperties: [
            'mapPosition',
            'staticPosition',
            'label',
            'fontColor',
            'opacity',
            'display',
        ],
    },
    number: {
        type: 'number',
        label: 'Number',
        icon: 'pi-hashtag',
        keyframeProperties: [
            'mapPosition',
            'staticPosition',
            'number',
            'fontColor',
            'opacity',
            'display',
        ],
    },
    date: {
        type: 'date',
        label: 'Date',
        icon: 'pi-calendar',
        keyframeProperties: [
            'mapPosition',
            'staticPosition',
            'date',
            'fontColor',
            'opacity',
            'display',
        ],
    },
    camera: {
        type: 'camera',
        label: 'Camera',
        icon: 'pi-video',
        keyframeProperties: ['center', 'zoom'],
    },
} as const satisfies Record<LayerType, LayerTypeMetadata>;

export type KeyframePropertiesOfLayer<T extends LayerType = LayerType> =
    (typeof LAYER_TYPE_METADATA)[T]['keyframeProperties'][number];
