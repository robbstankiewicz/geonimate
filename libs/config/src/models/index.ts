// Layer models moved to @geonimate/shared-utils
// Re-exporting here for backward compatibility during migration
export type {
    BaseLayer,
    ShapeLayer,
    PointLayer,
    CameraLayer,
    TextLayer,
    NumberLayer,
    DateLayer,
    Layer,
} from '@geonimate/shared-utils';

export * from './keyframe-state.model';
export * from './property-metadata';
export {
    LAYER_TYPE_METADATA,
    type LayerTypeMetadata,
} from '@geonimate/shared-utils';
