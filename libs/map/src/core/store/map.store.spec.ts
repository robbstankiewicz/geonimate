import { TestBed } from '@angular/core/testing';
import { mapStore } from './map.store';
import { APP_OPTIONS, ErrorService } from '@geonimate/shared-core';
import { BACKGROUND_LAYERS } from '@geonimate/shared-core';
import BaseLayer from 'ol/layer/Base';
import { useGeographic } from 'ol/proj.js';
import Feature from 'ol/Feature';
import OlPolygon from 'ol/geom/Polygon';
import Draw from 'ol/interaction/Draw';
import {
    backgroundLayersMock,
    errorServiceMock,
} from '@geonimate/shared-core/testing';
import {
    generateId,
    LayerId,
    Rgb,
    LayerType,
    Layer,
    createLayer,
} from '@geonimate/shared-utils';

function createLayerConfig(
    type: LayerType,
    id: LayerId,
    name: string,
    timelineColor: Rgb,
    extra: Partial<Layer> = {}
): Layer {
    return { ...createLayer(type, id, name, timelineColor), ...extra } as Layer;
}


describe('Map store', () => {
    beforeEach(() => {
        useGeographic();
        TestBed.configureTestingModule({
            providers: [
                mapStore,
                errorServiceMock(),
                {
                    provide: APP_OPTIONS,
                    useValue: {
                        center: [10, 10],
                        zoom: 8,
                    },
                },
                backgroundLayersMock(),
            ],
        });
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    it('should add shape layers', async () => {
        const store = TestBed.inject(mapStore);
        await jest.runAllTimersAsync();
        const layer1 = createLayerConfig(
            'shape',
            generateId<LayerId>(),
            'Shape 1',
            {
                r: 255,
                g: 0,
                b: 0,
            }
        );
        const layer2 = createLayerConfig(
            'shape',
            generateId<LayerId>(),
            'Shape 2',
            {
                r: 0,
                g: 255,
                b: 0,
            }
        );
        store.addLayer(layer1);
        store.addLayer(layer2);
        expect(store.layersEntities().length).toEqual(2);
        expect(store.map()?.getLayers().getLength()).toEqual(4);
    });

    it('should add layer with OpenLayers visibility false when display is false', async () => {
        const store = TestBed.inject(mapStore);
        await jest.runAllTimersAsync();
        const layer = createLayerConfig(
            'shape',
            generateId<LayerId>(),
            'Hidden',
            { r: 255, g: 0, b: 0 },
            { display: false }
        );
        store.addLayer(layer);
        const olLayer = store.layersEntityMap()[layer.id].value;
        expect(olLayer.getVisible()).toBe(false);
    });

    it('should update OpenLayers visibility when layer config display changes', async () => {
        const store = TestBed.inject(mapStore);
        await jest.runAllTimersAsync();
        const layer = createLayerConfig(
            'shape',
            generateId<LayerId>(),
            'Shape',
            { r: 255, g: 0, b: 0 }
        );
        store.addLayer(layer);
        const olLayer = store.layersEntityMap()[layer.id].value;
        expect(olLayer.getVisible()).toBe(true);

        store.updateLayerConfig(layer.id, { display: false });
        expect(olLayer.getVisible()).toBe(false);

        store.updateLayerConfig(layer.id, { display: true });
        expect(olLayer.getVisible()).toBe(true);
    });
    it('should create map instance on init', async () => {
        const baseLayer = new BaseLayer({});
        TestBed.overrideProvider(BACKGROUND_LAYERS, {
            useValue: {
                layers: [
                    {
                        name: 'Layer 1',
                        factory: () => Promise.resolve(baseLayer),
                    },
                ],
                default: 'Layer 1',
            },
        });
        const store = TestBed.inject(mapStore);
        await jest.runAllTimersAsync();
        expect(store.map()).toBeDefined();
        expect(store.map()?.getView().getCenter()).toEqual([10, 10]);
        expect(store.map()?.getView().getZoom()).toEqual(8);
        expect(store.selectedBackgroundLayer().name).toEqual('Layer 1');
    });
    it('should select next resolved layer if one before fails', async () => {
        TestBed.overrideProvider(BACKGROUND_LAYERS, {
            useValue: {
                layers: [
                    {
                        name: 'Fail',
                        factory: () => Promise.reject('Load failed'),
                    },
                    {
                        name: 'Success',
                        factory: () => Promise.resolve(new BaseLayer({})),
                    },
                ],
                default: 'Fail',
            },
        });
        const store = TestBed.inject(mapStore);
        await jest.runAllTimersAsync();
        expect(store.selectedBackgroundLayer().name).toEqual('Success');
    });
    it('should show error if no layers were loaded', async () => {
        TestBed.overrideProvider(BACKGROUND_LAYERS, {
            useValue: {
                layers: [
                    {
                        name: 'Fail',
                        factory: () => Promise.reject('Load failed'),
                    },
                ],
                default: 'Fail',
            },
        });
        const errorService = TestBed.inject(ErrorService);
        const store = TestBed.inject(mapStore);
        await jest.runAllTimersAsync();
        expect(store.backgroundLayersEntities().length).toEqual(0);
        expect(store.selectedBackgroundLayer()).toBeUndefined();
        expect(errorService.showError).toHaveBeenCalled();
    });
    it('should be able to change active layer', async () => {
        const baseLayer = new BaseLayer({});
        const baseLayer2 = new BaseLayer({});
        TestBed.overrideProvider(BACKGROUND_LAYERS, {
            useValue: {
                layers: [
                    {
                        name: 'Layer 1',
                        factory: () => Promise.resolve(baseLayer),
                    },
                    {
                        name: 'Layer 2',
                        factory: () => Promise.resolve(baseLayer2),
                    },
                ],
                default: 'Layer 1',
            },
        });
        const store = TestBed.inject(mapStore);
        await jest.runAllTimersAsync();
        const entities = store.backgroundLayersEntities();
        const layer2Id = entities[1].id;
        store.setActiveBackgroundLayer(layer2Id);
        expect(store.selectedBackgroundLayer().name).toEqual('Layer 2');
        expect(store.selectedBackgroundLayer().value.getVisible()).toEqual(
            true
        );
    });


    describe('layer config updates and style function', () => {
        it('should NOT show text when defaultText is empty', async () => {
            const store = TestBed.inject(mapStore);
            await jest.runAllTimersAsync();

            const layerId = generateId<LayerId>();
            const layer = createLayerConfig(
                'shape',
                layerId,
                'Shape Layer',
                { r: 255, g: 0, b: 0 },
                { defaultText: '' }
            );
            store.addLayer(layer);

            const olLayer = store.layersEntityMap()[layerId].value;
            const source = olLayer.getSource()!;
            const polygonFeature = new Feature<OlPolygon>(
                new OlPolygon([
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ])
            );
            source.addFeature(polygonFeature);

            const styleFunc = olLayer.getStyle();
            expect(typeof styleFunc).toBe('function');

            const styles = (styleFunc as any)(polygonFeature, 1);
            expect(styles).toBeDefined();

            const textStyle = styles.find((s: any) => s.getText && s.getText());
            expect(textStyle).toBeUndefined();
        });

        it('should show text from defaultText config when set', async () => {
            const store = TestBed.inject(mapStore);
            await jest.runAllTimersAsync();

            const layerId = generateId<LayerId>();
            const layer = createLayerConfig(
                'shape',
                layerId,
                'Shape Layer',
                { r: 255, g: 0, b: 0 },
                { defaultText: 'Hello World' }
            );
            store.addLayer(layer);

            const olLayer = store.layersEntityMap()[layerId].value;
            const source = olLayer.getSource()!;
            const polygonFeature = new Feature<OlPolygon>(
                new OlPolygon([
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ])
            );
            source.addFeature(polygonFeature);

            const styleFunc = olLayer.getStyle();

            const styles = (styleFunc as any)(polygonFeature, 1);

            const textStyle = styles.find((s: any) => s.getText && s.getText());
            expect(textStyle).toBeDefined();
            expect(textStyle.getText().getText()).toBe('Hello World');
        });

        it('should update style text when layer config is updated', async () => {
            const store = TestBed.inject(mapStore);
            await jest.runAllTimersAsync();

            const layerId = generateId<LayerId>();
            const layer = createLayerConfig(
                'shape',
                layerId,
                'Shape Layer',
                { r: 255, g: 0, b: 0 },
                { defaultText: '' }
            );
            store.addLayer(layer);

            const olLayer = store.layersEntityMap()[layerId].value;
            const source = olLayer.getSource()!;
            const polygonFeature = new Feature<OlPolygon>(
                new OlPolygon([
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ])
            );
            source.addFeature(polygonFeature);

            const styleFunc = olLayer.getStyle();

            let styles = (styleFunc as any)(polygonFeature, 1);
            let textStyle = styles.find((s: any) => s.getText && s.getText());
            expect(textStyle).toBeUndefined();

            store.updateLayerConfig(layerId, { defaultText: 'Updated Text' });

            styles = (styleFunc as any)(polygonFeature, 1);
            textStyle = styles.find((s: any) => s.getText && s.getText());
            expect(textStyle).toBeDefined();
            expect(textStyle.getText().getText()).toBe('Updated Text');
        });

        it('should prioritize animated text over defaultText', async () => {
            const store = TestBed.inject(mapStore);
            await jest.runAllTimersAsync();

            const layerId = generateId<LayerId>();
            const layer = createLayerConfig(
                'shape',
                layerId,
                'Shape Layer',
                { r: 255, g: 0, b: 0 },
                { defaultText: 'Default Text' }
            );
            store.addLayer(layer);

            const olLayer = store.layersEntityMap()[layerId].value;
            const source = olLayer.getSource()!;
            const polygonFeature = new Feature<OlPolygon>(
                new OlPolygon([
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ])
            );
            source.addFeature(polygonFeature);

            const styleFunc = olLayer.getStyle();

            store.updateAnimatedProperty(layerId, 'label', 'Animated Text');

            const styles = (styleFunc as any)(polygonFeature, 1);
            const textStyle = styles.find((s: any) => s.getText && s.getText());
            expect(textStyle).toBeDefined();
            expect(textStyle.getText().getText()).toBe('Animated Text');
        });
    });
});
