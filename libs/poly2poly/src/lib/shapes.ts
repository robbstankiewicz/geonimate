export type Point = [number, number];
export type Polygon = Point[];

export interface BoundingBox {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}
