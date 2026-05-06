import { Coordinate } from 'ol/coordinate';
import { Rgb } from '../models/rgb.model';

export interface StaticPosition {
    anchorX: 'left' | 'right';
    anchorY: 'top' | 'bottom';
    offsetX: number;
    offsetY: number;
}

export type PropertyValueType = {
    shape: Coordinate[];
    mapPosition: Coordinate;
    staticPosition: StaticPosition;
    color: Rgb;
    fontColor: Rgb;
    // text: string;
    label: string;
    number: number;
    date: string;
    opacity: number;
    display: boolean;
    center: [number, number]; // [x, y]
    zoom: number;
};

export type PropertyType = keyof PropertyValueType;

export type ValueByPropertyType<T extends PropertyType = PropertyType> = PropertyValueType[T];
