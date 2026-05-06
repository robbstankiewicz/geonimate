import { createLayer } from './layer.model';
import { generateId } from '../helpers/id.generator';
import type { LayerId } from '../types/ids';

describe('createLayer', () => {
    const rgb = { r: 200, g: 30, b: 90 };

    it('should default cameraLocked to false for camera layers', () => {
        const id = generateId<LayerId>();
        const layer = createLayer('camera', id, 'Cam', rgb);
        expect(layer.type).toBe('camera');
        if (layer.type === 'camera') {
            expect(layer.cameraLocked).toBe(false);
            expect(layer.timelineColor).toEqual(rgb);
        }
    });

    it('should set shape colors from timeline color and white label', () => {
        const id = generateId<LayerId>();
        const layer = createLayer('shape', id, 'S', rgb);
        expect(layer.type).toBe('shape');
        if (layer.type === 'shape') {
            expect(layer.shapeColor).toEqual(rgb);
            expect(layer.fontColor).toEqual({ r: 255, g: 255, b: 255 });
            expect(layer.timelineColor).toEqual(rgb);
        }
    });

    it('should set point dot from timeline color and white label', () => {
        const id = generateId<LayerId>();
        const layer = createLayer('point', id, 'P', rgb);
        expect(layer.type).toBe('point');
        if (layer.type === 'point') {
            expect(layer.dotColor).toEqual(rgb);
            expect(layer.fontColor).toEqual({ r: 255, g: 255, b: 255 });
        }
    });

    it('should set text font color from timeline color', () => {
        const id = generateId<LayerId>();
        const layer = createLayer('text', id, 'T', rgb);
        expect(layer.type).toBe('text');
        if (layer.type === 'text') {
            expect(layer.fontColor).toEqual(rgb);
            expect(layer.timelineColor).toEqual(rgb);
        }
    });

    it('should default text layer textAlign to center', () => {
        const id = generateId<LayerId>();
        const layer = createLayer('text', id, 'T', rgb);
        expect(layer.type).toBe('text');
        if (layer.type === 'text') {
            expect(layer.textAlign).toEqual('center');
        }
    });

    it('should default number layer textAlign to center', () => {
        const id = generateId<LayerId>();
        const layer = createLayer('number', id, 'N', rgb);
        expect(layer.type).toBe('number');
        if (layer.type === 'number') {
            expect(layer.textAlign).toEqual('center');
        }
    });

    it('should default date layer textAlign to center', () => {
        const id = generateId<LayerId>();
        const layer = createLayer('date', id, 'D', rgb);
        expect(layer.type).toBe('date');
        if (layer.type === 'date') {
            expect(layer.textAlign).toEqual('center');
        }
    });
});
