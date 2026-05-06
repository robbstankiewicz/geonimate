import { Rgb } from './rgb.model';
import { LayerId } from '../types/ids';

const WHITE: Rgb = { r: 255, g: 255, b: 255 };

export type StaticTextAlign = 'left' | 'center' | 'right';

export interface BaseLayer {
    id: LayerId;
    name: string;
    type: LayerType;
    timelineColor: Rgb;
    display: boolean;
}

export interface ShapeLayer extends BaseLayer {
    type: 'shape';
    image: string;
    defaultText: string;
    fontSize: number;
    shapeColor: Rgb;
    fontColor: Rgb;
}

export interface PointLayer extends BaseLayer {
    type: 'point';
    image: string;
    defaultText: string;
    fontSize: number;
    dotColor: Rgb;
    fontColor: Rgb;
}

export interface CameraLayer extends BaseLayer {
    type: 'camera';
    cameraLocked: boolean;
}

export interface TextLayer extends BaseLayer {
    type: 'text';
    defaultText: string;
    placement: 'static' | 'map';
    textAlign?: StaticTextAlign;
    fontSize: number;
    fontColor: Rgb;
}

export interface NumberLayer extends BaseLayer {
    type: 'number';
    defaultNumber: number;
    placement: 'static' | 'map';
    textAlign?: StaticTextAlign;
    fontSize: number;
    decimals: number;
    fontColor: Rgb;
}

export interface DateLayer extends BaseLayer {
    type: 'date';
    defaultDate: Date;
    format: string;
    placement: 'static' | 'map';
    textAlign?: StaticTextAlign;
    fontSize: number;
    fontColor: Rgb;
}

export type LayerType = Layer['type'];

export type Layer =
    | ShapeLayer
    | PointLayer
    | CameraLayer
    | TextLayer
    | NumberLayer
    | DateLayer;

type LayerSpecificDefaults = {
    shape: Pick<ShapeLayer, 'defaultText' | 'image' | 'fontSize'>;
    point: Pick<PointLayer, 'defaultText' | 'image' | 'fontSize'>;
    camera: Pick<CameraLayer, 'cameraLocked'>;
    text: Pick<TextLayer, 'defaultText' | 'placement' | 'textAlign' | 'fontSize'>;
    number: Pick<
        NumberLayer,
        'defaultNumber' | 'placement' | 'textAlign' | 'fontSize' | 'decimals'
    >;
    date: Pick<DateLayer, 'defaultDate' | 'format' | 'placement' | 'textAlign' | 'fontSize'>;
};

export const LAYER_DEFAULTS: LayerSpecificDefaults = {
    shape: { defaultText: '', image: '', fontSize: 16 },
    point: { defaultText: '', image: '', fontSize: 16 },
    camera: { cameraLocked: false },
    text: {
        defaultText: 'Lorem ipsum',
        placement: 'map',
        textAlign: 'center',
        fontSize: 16,
    },
    number: {
        defaultNumber: 0,
        placement: 'map',
        textAlign: 'center',
        fontSize: 16,
        decimals: 0,
    },
    date: {
        defaultDate: new Date(),
        format: 'YYYY-MM-DD',
        placement: 'map',
        textAlign: 'center',
        fontSize: 16,
    },
};

export function createLayer(
    type: LayerType,
    id: LayerId,
    name: string,
    timelineColor: Rgb
): Layer {
    const base: BaseLayer = {
        id,
        name,
        timelineColor,
        type,
        display: true,
    };
    const defaults = LAYER_DEFAULTS[type];
    switch (type) {
        case 'shape':
            return {
                ...base,
                ...defaults,
                shapeColor: timelineColor,
                fontColor: WHITE,
            } as ShapeLayer;
        case 'point':
            return {
                ...base,
                ...defaults,
                dotColor: timelineColor,
                fontColor: WHITE,
            } as PointLayer;
        case 'camera':
            return { ...base, ...defaults } as CameraLayer;
        case 'text':
            return {
                ...base,
                ...defaults,
                fontColor: timelineColor,
            } as TextLayer;
        case 'number':
            return {
                ...base,
                ...defaults,
                fontColor: timelineColor,
            } as NumberLayer;
        case 'date':
            return {
                ...base,
                ...defaults,
                fontColor: timelineColor,
            } as DateLayer;
    }
}
