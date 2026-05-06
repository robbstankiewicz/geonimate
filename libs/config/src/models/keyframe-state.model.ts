import { KeyframeId, KeyframePropertiesOfLayer, LayerId, LayerType, PropertyValueType, ValueByPropertyType } from '@geonimate/shared-utils';

export interface KeyframeState<T extends LayerType = LayerType> {
    id: KeyframeId;
    layerId: LayerId;
    layerType: T;
    properties: PropertyValues<T>;
}

export type PropertyValues<T extends LayerType = LayerType> = {
    [P in KeyframePropertiesOfLayer<T>]?: AnimatableProperty<PropertyValueType[P]>;
};

export interface AnimatableProperty<P extends ValueByPropertyType = ValueByPropertyType> {
    active: boolean;
    value: P;
}
