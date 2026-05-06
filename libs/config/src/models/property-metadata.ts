import { InputSignal, Type } from '@angular/core';
import { OpacityControlComponent } from '../ui/keyframe-properties/opacity-control.component';
import { DisplayControlComponent } from '../ui/keyframe-properties/display-control.component';
import { TextControlComponent } from '../ui/keyframe-properties/text-control.component';
import { NumberControlComponent } from '../ui/keyframe-properties/number-control.component';
import { DateControlComponent } from '../ui/keyframe-properties/date-control.component';
import { Vector2ControlComponent } from '../ui/keyframe-properties/vector2-control.component';
import { ZoomControlComponent } from '../ui/keyframe-properties/zoom-control.component';
import { RgbControlComponent } from '../ui/keyframe-properties/rgb-control.component';
import {
    Layer,
    LayerType,
    PropertyType,
    PropertyValueType,
} from '@geonimate/shared-utils';

export type PropertyConfigValueSourceByLayer = {
    [K in LayerType]?: keyof Extract<Layer, { type: K }>;
};

export interface PropertyMetadata<T = unknown> {
    id: string;
    label: string;
    defaultValue: T;
    controlComponent: Type<unknown> | null;
    valueFromConfigKey?: PropertyConfigValueSourceByLayer;
}

export interface GenericControlComponent {
    value: InputSignal<PropertyValueType>;
}

export const PROPERTY_REGISTRY: {
    [K in PropertyType]: PropertyMetadata<PropertyValueType[K] | null>;
} = {
    shape: {
        id: 'shape',
        label: 'Shape',
        defaultValue: null,
        controlComponent: null,
    },
    mapPosition: {
        id: 'mapPosition',
        label: 'Map Position',
        defaultValue: null,
        controlComponent: Vector2ControlComponent,
    },
    staticPosition: {
        id: 'staticPosition',
        label: 'Overlay Position',
        defaultValue: null,
        controlComponent: null,
    },
    color: {
        id: 'color',
        label: 'Color',
        defaultValue: null,
        controlComponent: RgbControlComponent,
        valueFromConfigKey: {
            shape: 'shapeColor',
            point: 'dotColor',
        },
    },
    fontColor: {
        id: 'fontColor',
        label: 'Font color',
        defaultValue: null,
        controlComponent: RgbControlComponent,
        valueFromConfigKey: {
            shape: 'fontColor',
            point: 'fontColor',
            text: 'fontColor',
            number: 'fontColor',
            date: 'fontColor',
        },
    },
    // text: {
    //     id: 'text',
    //     label: 'Text',
    //     defaultValue: null,
    //     controlComponent: TextControlComponent,
    // },
    label: {
        id: 'label',
        label: 'Text',
        defaultValue: null,
        controlComponent: TextControlComponent,
        valueFromConfigKey: {
            shape: 'defaultText',
            point: 'defaultText',
            text: 'defaultText',
        },
    },
    number: {
        id: 'number',
        label: 'Number',
        defaultValue: null,
        controlComponent: NumberControlComponent,
        valueFromConfigKey: {
            number: 'defaultNumber',
        },
    },
    date: {
        id: 'date',
        label: 'Date',
        defaultValue: null,
        controlComponent: DateControlComponent,
        valueFromConfigKey: {
            date: 'defaultDate',
        },
    },
    opacity: {
        id: 'opacity',
        label: 'Opacity',
        defaultValue: 100,
        controlComponent: OpacityControlComponent,
    },
    display: {
        id: 'display',
        label: 'Display',
        defaultValue: true,
        controlComponent: DisplayControlComponent,
    },
    center: {
        id: 'center',
        label: 'Center',
        defaultValue: null,
        controlComponent: Vector2ControlComponent,
    },
    zoom: {
        id: 'zoom',
        label: 'Zoom',
        defaultValue: null,
        controlComponent: ZoomControlComponent,
    },
};
