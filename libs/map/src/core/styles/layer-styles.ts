import { FeatureLike } from 'ol/Feature';
import { Fill, Stroke, Style, Text, Circle, Icon } from 'ol/style';
import {
    Layer,
    ShapeLayer,
    PointLayer,
    TextLayer,
    NumberLayer,
    DateLayer,
    formatDate,
    formatNumber,
    KeyframePropertiesOfLayer,
    PropertyValueType,
} from '@geonimate/shared-utils';
import { toHex, toRgba, Rgb } from '@geonimate/shared-utils';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';

export interface MapTextStyleContext {
    resolution: number;
    scaleTextWithMap: boolean;
    textScaleReferenceResolution: number;
}

export function resolveScaledTextFontPx(
    basePx: number,
    context: MapTextStyleContext
): number {
    const sensitivity = 1; // todo
    const scaled =
        basePx * sensitivity * (context.textScaleReferenceResolution / context.resolution);

    return scaled
}

export type StyleFunction<T extends Layer = Layer> = (
    feature: FeatureLike,
    props: {
        [K in KeyframePropertiesOfLayer<T['type']>]?: PropertyValueType[K];
    },
    layerConfig: T,
    mapFontFamily: string,
    mapFontSize: number,
    mapTextStyle: MapTextStyleContext
) => Style[];

function createFillStroke(color: Rgb): { fill: Fill; stroke: Stroke } {
    return {
        fill: new Fill({ color: toRgba(color, 0.2) }),
        stroke: new Stroke({
            color: toHex(color),
            width: 4,
        }),
    };
}

const ICON_SIZE = 64;

export const shapeStyleStrategy: StyleFunction<ShapeLayer> = (
    feature,
    props,
    layerConfig,
    mapFontFamily,
    mapFontSize,
    mapTextStyle
) => {
    const styles: Style[] = [];

    const shapeFillRgb = props.color ?? layerConfig.shapeColor;
    const { fill, stroke } = createFillStroke(shapeFillRgb);

    styles.push(new Style({ fill, stroke }));

    const geometry = feature.getGeometry() as Polygon;
    const centroid = geometry.getInteriorPoint();
    if (!centroid) {
        return styles;
    }

    const imgUrl = layerConfig.image;
    const textValue = props.label || layerConfig.defaultText;
    const hasImage = !!imgUrl;
    const hasText = !!textValue;
    const baseFontPx = layerConfig.fontSize || mapFontSize;
    const fontSize = resolveScaledTextFontPx(baseFontPx, mapTextStyle);
    const labelRgb = props.fontColor ?? layerConfig.fontColor;

    const GAP = 5; // pixels between image and text

    let imageDisplacementY = 0;
    let textOffsetY = 0;

    if (hasImage && hasText) {
        imageDisplacementY = ICON_SIZE / 2 + GAP; // Shift UP
        textOffsetY = fontSize / 2 + GAP; // Shift DOWN
    }

    if (hasImage) {
        styles.push(
            new Style({
                geometry: centroid,
                image: new Icon({
                    src: imgUrl,
                    crossOrigin: imgUrl.startsWith('data:')
                        ? undefined
                        : 'anonymous',
                    height: ICON_SIZE,
                    anchor: [0.5, 0.5],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    displacement: [0, imageDisplacementY],
                }),
            })
        );
    }

    if (hasText) {
        styles.push(
            new Style({
                geometry: centroid,
                text: new Text({
                    text: String(textValue),
                    font: `bold ${fontSize}px ${mapFontFamily}`,
                    fill: new Fill({ color: toHex(labelRgb) }),
                    stroke: new Stroke({
                        color: 'black',
                        width: 2,
                    }),
                    textAlign: 'center',
                    textBaseline: 'middle',
                    offsetY: textOffsetY,
                }),
            })
        );
    }

    return styles;
};

export const pointStyleStrategy: StyleFunction<PointLayer> = (
    feature,
    props,
    layerConfig,
    mapFontFamily,
    mapFontSize,
    mapTextStyle
) => {
    const styles: Style[] = [];

    const pos = props.mapPosition;
    if (!pos) {
        return [];
    }

    const featGeom = feature.getGeometry();
    if (!featGeom || featGeom.getType() !== 'Point') {
        return [];
    }
    const geom = featGeom as Point;

    const baseFontPx = layerConfig.fontSize || mapFontSize;
    const fontSize = resolveScaledTextFontPx(baseFontPx, mapTextStyle);
    const pointLabelRgb = props.fontColor ?? layerConfig.fontColor;
    const dotRgb = props.color ?? layerConfig.dotColor;
    const imgUrl = layerConfig.image;
    const textValue = props.label || layerConfig.defaultText;
    const hasImage = !!imgUrl;
    const hasText = !!textValue;

    const DOT_RADIUS = 8;
    const GAP = 10;

    if (hasImage) {
        styles.push(
            new Style({
                geometry: geom,
                image: new Icon({
                    src: imgUrl,
                    crossOrigin: imgUrl.startsWith('data:')
                        ? undefined
                        : 'anonymous',
                    height: ICON_SIZE,
                    anchor: [0.5, 0.5],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
            })
        );
    } else {
        styles.push(
            new Style({
                geometry: geom,
                image: new Circle({
                    radius: DOT_RADIUS,
                    fill: new Fill({ color: toHex(dotRgb) }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            })
        );
    }

    if (hasText) {
        const centerElementHeight = hasImage ? ICON_SIZE : DOT_RADIUS * 2;
        const textOffsetY = centerElementHeight / 2 + GAP + fontSize / 2;

        styles.push(
            new Style({
                geometry: geom,
                text: new Text({
                    text: String(textValue),
                    font: `bold ${fontSize}px ${mapFontFamily} sans-serif`,
                    fill: new Fill({ color: toHex(pointLabelRgb) }),
                    stroke: new Stroke({
                        color: 'black',
                        width: 2,
                    }),
                    textAlign: 'center',
                    textBaseline: 'middle',
                    offsetY: textOffsetY,
                }),
            })
        );
    }

    return styles;
};

export const textStyleStrategy: StyleFunction<TextLayer> = (
    feature,
    props,
    layerConfig,
    mapFontFamily,
    mapFontSize,
    mapTextStyle
) => {
    const styles: Style[] = [];

    if (layerConfig.placement === 'static') {
        return [];
    }

    const pos = props.mapPosition;
    if (!pos) {
        return [];
    }

    const featGeom = feature.getGeometry();
    if (!featGeom || featGeom.getType() !== 'Point') {
        return [];
    }
    const geom = featGeom as Point;

    const textValue = props.label || layerConfig.defaultText || '';
    const baseFontPx = layerConfig.fontSize || mapFontSize;
    const fontSize = resolveScaledTextFontPx(baseFontPx, mapTextStyle);
    const textRgb = props.fontColor ?? layerConfig.fontColor;

    styles.push(
        new Style({
            geometry: geom,
            text: new Text({
                text: String(textValue),
                font: `bold ${fontSize}px ${mapFontFamily}`,
                fill: new Fill({ color: toHex(textRgb) }),
                stroke: new Stroke({
                    color: 'black',
                    width: 2,
                }),
            }),
        })
    );

    return styles;
};

export const numberStyleStrategy: StyleFunction<NumberLayer> = (
    feature,
    props,
    layerConfig,
    mapFontFamily,
    mapFontSize,
    mapTextStyle
) => {
    const styles: Style[] = [];

    if (layerConfig.placement === 'static') {
        return [];
    }

    const pos = props.mapPosition;
    if (!pos) {
        return [];
    }

    const featGeom = feature.getGeometry();
    if (!featGeom || featGeom.getType() !== 'Point') {
        return [];
    }
    const geom = featGeom as Point;

    let numValue = props.number;
    if (numValue === null || numValue === undefined) {
        numValue = layerConfig.defaultNumber ?? 0;
    }
    const decimals = layerConfig.decimals ?? 0;
    const textValue = formatNumber(Number(numValue), decimals);
    const baseFontPx = layerConfig.fontSize || mapFontSize;
    const fontSize = resolveScaledTextFontPx(baseFontPx, mapTextStyle);
    const numberRgb = props.fontColor ?? layerConfig.fontColor;

    styles.push(
        new Style({
            geometry: geom,
            text: new Text({
                text: textValue,
                font: `bold ${fontSize}px ${mapFontFamily}`,
                fill: new Fill({ color: toHex(numberRgb) }),
                stroke: new Stroke({
                    color: 'black',
                    width: 2,
                }),
            }),
        })
    );

    return styles;
};

export const dateStyleStrategy: StyleFunction<DateLayer> = (
    feature,
    props,
    layerConfig,
    mapFontFamily,
    mapFontSize,
    mapTextStyle
) => {
    const styles: Style[] = [];

    if (layerConfig.placement === 'static') {
        return [];
    }

    const pos = props.mapPosition;
    if (!pos) {
        return [];
    }

    const featGeom = feature.getGeometry();
    if (!featGeom || featGeom.getType() !== 'Point') {
        return [];
    }
    const geom = featGeom as Point;

    const dateValue = props.date || layerConfig.defaultDate;
    const format = layerConfig.format || 'YYYY-MM-DD';
    const textValue = dateValue ? formatDate(dateValue, format) : '';
    const baseFontPx = layerConfig.fontSize || mapFontSize;
    const fontSize = resolveScaledTextFontPx(baseFontPx, mapTextStyle);
    const dateRgb = props.fontColor ?? layerConfig.fontColor;

    styles.push(
        new Style({
            geometry: geom,
            text: new Text({
                text: textValue,
                font: `bold ${fontSize}px ${mapFontFamily}`,
                fill: new Fill({ color: toHex(dateRgb) }),
                stroke: new Stroke({
                    color: 'black',
                    width: 2,
                }),
            }),
        })
    );

    return styles;
};

const styleStrategies: {
    [K in Layer['type']]: StyleFunction<Extract<Layer, { type: K }>>;
} = {
    shape: shapeStyleStrategy,
    point: pointStyleStrategy,
    text: textStyleStrategy,
    number: numberStyleStrategy,
    date: dateStyleStrategy,
    camera: ((
        _feature,
        _props,
        _layerConfig,
        _ff,
        _fs,
        _ctx
    ) => []) as StyleFunction<Extract<Layer, { type: 'camera' }>>,
};

export function getStyleStrategy<T extends Layer['type']>(
    type: T
): StyleFunction<Extract<Layer, { type: T }>> {
    return styleStrategies[type];
}
