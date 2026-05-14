import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStore,
    type,
    withComputed,
    withHooks,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';
import {
    addEntity,
    entityConfig,
    removeEntity,
    updateEntity,
    setAllEntities,
    withEntities,
} from '@ngrx/signals/entities';
import { Map as OlMap, View } from 'ol';
import { APP_OPTIONS, ErrorService } from '@geonimate/shared-core';
import { BACKGROUND_LAYERS } from '@geonimate/shared-core';
import BaseLayer from 'ol/layer/Base';
import {
    generateId,
    KeyframePropertiesOfLayer,
    LayerId,
    PropertyType,
    PropertyValueType,
} from '@geonimate/shared-utils';
import { Layer } from '@geonimate/shared-utils';
import { withTreeShakableDevTools } from '@geonimate/shared-core';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw, { type GeometryFunction } from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import OlPolygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { Subject } from 'rxjs';
import { getStyleStrategy } from '../styles/layer-styles';
import { Point } from 'ol/geom';
import { altKeyOnly, noModifierKeys } from 'ol/events/condition';

type Ring = [number, number][];

interface State {
    _selectedLayer: string | undefined;
    _activeLayerId: LayerId | null;
    map: OlMap | undefined;
    mapFontFamily: string;
    mapFontSize: number;
    mapScaleTextWithMap: boolean;
    textScaleReferenceResolution: number;
}

export interface BackgroundLayer {
    id: LayerId;
    name: string;
    value: BaseLayer;
}

export interface MapLayer<T extends Layer = Layer> {
    id: LayerId;
    value: VectorLayer;
    config: T;
    animatedProperties: {
        [K in KeyframePropertiesOfLayer<T['type']>]?: PropertyValueType[K];
    };
}

const backgroundLayerEntityConfig = entityConfig({
    entity: type<BackgroundLayer>(),
    collection: 'backgroundLayers',
});

const layerEntityConfig = entityConfig({
    entity: type<MapLayer>(),
    collection: 'layers',
});

export const mapStore = signalStore(
    withTreeShakableDevTools('Map Store'),
    withState<State>(() => {
        const {
            fontSize,
            fontFamily,
            scaleTextWithMap,
        } = inject(APP_OPTIONS);
        return {
            map: undefined,
            _selectedLayer: undefined,
            _activeLayerId: null,
            mapFontFamily: fontFamily,
            mapFontSize: fontSize,
            mapScaleTextWithMap: scaleTextWithMap ?? true,
            textScaleReferenceResolution: 0,
        };
    }),
    withEntities(backgroundLayerEntityConfig),
    withEntities(layerEntityConfig),
    withProps(() => ({
        featureUpdated$: new Subject<{
            layerId: LayerId;
            geometry: OlPolygon | Point;
        }>(),
        _drawInteraction: null as Draw | null,
        _modifyInteraction: null as Modify | null,
        _cleanupShapeDrawCancelHandlers: null as (() => void) | null,
        _lastCommittedShapeFeature: null as Feature<OlPolygon> | null,
    })),
    withMethods((store, errorService = inject(ErrorService)) => {
        const clearDrawingInteractions = (olMap: OlMap) => {
            if (store._cleanupShapeDrawCancelHandlers) {
                store._cleanupShapeDrawCancelHandlers();
                store._cleanupShapeDrawCancelHandlers = null;
            }
            store._lastCommittedShapeFeature = null;
            if (store._drawInteraction) {
                olMap.removeInteraction(store._drawInteraction);
                store._drawInteraction = null;
            }
            if (store._modifyInteraction) {
                olMap.removeInteraction(store._modifyInteraction);
                store._modifyInteraction = null;
            }
        };

        const methods = {
            setActiveBackgroundLayer: (id: string) => {
                const entities = store.backgroundLayersEntityMap();
                const layerToSelect = entities[id];
                layerToSelect.value.setVisible(true);
                const currentLayerId = store._selectedLayer();
                if (currentLayerId) {
                    entities[currentLayerId].value.setVisible(false);
                }
                patchState(store, {
                    _selectedLayer: id,
                });
            },
            setMapElement(element: HTMLElement) {
                const map = store.map();
                if (!map) {
                    errorService.showError();
                    console.error(`Initialize the map first!`);
                    return;
                }
                map.setTarget(element);
            },
            detachMapFromView() {
                const olMap = store.map();
                if (olMap) {
                    clearDrawingInteractions(olMap);
                    olMap.setTarget(undefined);
                }
                patchState(store, { _activeLayerId: null });
            },
            _updateZIndexes() {
                store.layersEntities().forEach((layer, index) => {
                    layer.value.setZIndex(index);
                });
            },
            updateZIndex(id: LayerId, zIndex: number) {
                const layer = store.layersEntityMap()[id];
                if (!layer) {
                    return;
                }
                layer.value.setZIndex(zIndex);
            },
            removeLayer(id: LayerId) {
                const layer = store.layersEntityMap()[id];
                if (!layer) {
                    console.error(`Layer with id ${id} does not exist`);
                    return;
                }
                store.map()?.removeLayer(layer.value);
                layer.value.dispose();
                patchState(store, removeEntity(id, layerEntityConfig));
            },
            addLayer(layerConfig: Layer) {
                const source = new VectorSource();
                const { id, type } = layerConfig;

                const styleStrategy = getStyleStrategy(type);

                const newLayer = new VectorLayer({
                    source,
                    style: (feature, resolution) => {
                        const mapLayer = store.layersEntityMap()[id];
                        const props = mapLayer?.animatedProperties || {};
                        const config = mapLayer?.config || layerConfig;
                        const mapFontFamily = store.mapFontFamily();
                        const mapFontSize = store.mapFontSize();
                        const mapTextStyleContext = {
                            resolution,
                            scaleTextWithMap: store.mapScaleTextWithMap(),
                            textScaleReferenceResolution:
                                store.textScaleReferenceResolution(),
                        };
                        return styleStrategy(
                            feature,
                            props,
                            config,
                            mapFontFamily,
                            mapFontSize,
                            mapTextStyleContext
                        );
                    },
                });
                newLayer.setVisible(layerConfig.display !== false);
                patchState(
                    store,
                    addEntity(
                        {
                            id,
                            value: newLayer,
                            config: layerConfig,
                            animatedProperties: {},
                        },
                        layerEntityConfig
                    )
                );
                store.map()?.addLayer(newLayer);
            },
            updateLayerConfig(layerId: LayerId, configUpdate: Partial<Layer>) {
                const mapLayer = store.layersEntityMap()[layerId];
                if (!mapLayer) {
                    console.error(`Layer not found for ${layerId}`);
                    return;
                }

                const updatedConfig = {
                    ...mapLayer.config,
                    ...configUpdate,
                } as Layer;

                patchState(
                    store,
                    updateEntity(
                        { id: layerId, changes: { config: updatedConfig } },
                        layerEntityConfig
                    )
                );

                mapLayer.value.changed();

                if (configUpdate.display !== undefined) {
                    methods.updateLayerDisplay(layerId, configUpdate.display);
                }

                if (store._activeLayerId() === layerId) {
                    methods.setActiveLayer(layerId);
                }
            },
            setActiveLayer(id: LayerId | null) {
                const olMap = store.map();
                if (!olMap) return;

                clearDrawingInteractions(olMap);

                patchState(store, { _activeLayerId: id });

                if (id === null) return;

                const layer = store.layersEntityMap()[id];
                if (!layer) return;

                if (layer.config.type === 'camera') return;

                if (
                    layer.config.type === 'text' ||
                    layer.config.type === 'number' ||
                    layer.config.type === 'date'
                ) {
                    if (layer.config.placement === 'static') return;
                }

                const source = layer.value.getSource() as VectorSource;

                const modify = new Modify({ source });
                modify.on('modifyend', event => {
                    const feature =
                        event.features.getArray()[0] as Feature<OlPolygon>;
                    const geometry = feature.getGeometry();
                    if (geometry) {
                        store.featureUpdated$.next({
                            layerId: id,
                            geometry: geometry.clone(),
                        });
                    }
                });
                olMap.addInteraction(modify);
                store._modifyInteraction = modify;

                let isRightAngleModifierPressed = false;
                const shapeGeometryFunction: GeometryFunction = (
                    coordinates,
                    geometry?
                ) => {
                    const polygonGeometry =
                        geometry instanceof OlPolygon ? geometry : undefined;
                    const polygonCoordinates = coordinates as [number, number][][];
                    const ring = polygonCoordinates[0];

                    if (!ring || !ring.length) {
                        return polygonGeometry ?? new OlPolygon([[]]);
                    }

                    const sameCoord = (a: number[], b: number[]) =>
                        a[0] === b[0] && a[1] === b[1];

                    const snapPointInPlace = (
                        target: number[],
                        reference: number[]
                    ) => {
                        const deltaX = Math.abs(target[0] - reference[0]);
                        const deltaY = Math.abs(target[1] - reference[1]);
                        if (deltaX >= deltaY) {
                            target[1] = reference[1];
                        } else {
                            target[0] = reference[0];
                        }
                    };

                    if (isRightAngleModifierPressed && ring.length > 2) {
                        const lastIndex = ring.length - 1;
                        const lastCoord = ring[lastIndex];
                        const firstCoord = ring[0];

                        if (!sameCoord(lastCoord, firstCoord)) {
                            const prevCoord = ring[lastIndex - 1];
                            if (sameCoord(lastCoord, prevCoord)) {
                                const anchorCoord = ring[lastIndex - 2];
                                snapPointInPlace(
                                    prevCoord as number[],
                                    anchorCoord as number[]
                                );
                                lastCoord[0] = prevCoord[0];
                                lastCoord[1] = prevCoord[1];
                            } else {
                                snapPointInPlace(
                                    lastCoord as number[],
                                    prevCoord as number[]
                                );
                            }
                        }
                    } else if (
                        isRightAngleModifierPressed &&
                        ring.length > 1
                    ) {
                        snapPointInPlace(
                            ring[ring.length - 1] as number[],
                            ring[ring.length - 2] as number[]
                        );
                    }

                    if (polygonGeometry) {
                        polygonGeometry.setCoordinates([ring]);
                        return polygonGeometry;
                    }

                    return new OlPolygon([ring]);
                };

                const drawType =
                    layer.config.type === 'shape' ? 'Polygon' : 'Point';
                const draw = new Draw({
                    source,
                    type: drawType,
                    condition:
                        layer.config.type === 'shape'
                            ? event =>
                                  noModifierKeys(event) || altKeyOnly(event)
                            : undefined,
                    geometryFunction:
                        layer.config.type === 'shape'
                            ? shapeGeometryFunction
                            : undefined,
                });

                if (layer.config.type === 'shape') {
                    draw.on('drawstart', () => {
                        const existingFeature = source.getFeatures()[0] as
                            | Feature<OlPolygon>
                            | undefined;
                        store._lastCommittedShapeFeature = existingFeature
                            ? (existingFeature.clone() as Feature<OlPolygon>)
                            : null;
                        source.clear();
                    });

                    const restorePreviousShape = () => {
                        source.clear();
                        if (store._lastCommittedShapeFeature) {
                            source.addFeature(
                                store._lastCommittedShapeFeature.clone()
                            );
                        }
                    };

                    const cancelShapeDrawing = () => {
                        draw.abortDrawing();
                        restorePreviousShape();
                    };

                    const onWindowKeyDown = (event: KeyboardEvent) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            cancelShapeDrawing();
                        }
                        if (event.key === 'Alt') {
                            isRightAngleModifierPressed = true;
                        }
                    };
                    const onWindowKeyUp = (event: KeyboardEvent) => {
                        if (event.key === 'Alt') {
                            isRightAngleModifierPressed = false;
                        }
                    };
                    window.addEventListener('keydown', onWindowKeyDown);
                    window.addEventListener('keyup', onWindowKeyUp);
                    store._cleanupShapeDrawCancelHandlers = () => {
                        window.removeEventListener('keydown', onWindowKeyDown);
                        window.removeEventListener('keyup', onWindowKeyUp);
                    };
                } else {
                    draw.on('drawstart', () => {
                        source.clear();
                    });
                }

                draw.on('drawend', event => {
                    const geometry = event.feature.getGeometry() as
                        | OlPolygon
                        | Point;
                    if (geometry) {
                        store.featureUpdated$.next({
                            layerId: id,
                            geometry: geometry.clone(),
                        });
                    }
                    if (layer.config.type === 'shape') {
                        store._lastCommittedShapeFeature = event.feature.clone() as
                            Feature<OlPolygon>;
                    }
                });
                olMap.addInteraction(draw);
                store._drawInteraction = draw;
            },
            updateAnimationFeature(layerId: LayerId, ring: Ring | null) {
                const layer = store.layersEntityMap()[layerId];
                if (!layer) return;
                const source = layer.value.getSource() as VectorSource;
                if (ring === null) {
                    return;
                }
                source.clear();
                source.addFeature(
                    new Feature<OlPolygon>(new OlPolygon([ring]))
                );
            },
            updatePointFeature(
                layerId: LayerId,
                pos: [number, number] | null
            ) {
                const layer = store.layersEntityMap()[layerId];
                if (!layer) return;
                const source = layer.value.getSource() as VectorSource;
                source.clear();
                if (pos === null) {
                    return;
                }
                source.addFeature(new Feature<Point>(new Point(pos)));
            },
            updateLayerOpacity(layerId: LayerId, opacity: number) {
                const layer = store.layersEntityMap()[layerId];
                if (!layer) return;
                layer.value.setOpacity(opacity / 100);
            },
            updateLayerDisplay(layerId: LayerId, display: boolean) {
                const layer = store.layersEntityMap()[layerId];
                if (!layer) return;
                layer.value.setVisible(display);
            },
            updateAnimatedProperty<K extends PropertyType>(
                layerId: LayerId,
                property: K,
                value: PropertyValueType[K] | null
            ) {
                const mapLayer = store.layersEntityMap()[layerId];
                if (!mapLayer) {
                    return;
                }

                const updatedAnimatedProperties = {
                    ...mapLayer.animatedProperties,
                    [property]: value,
                };

                patchState(
                    store,
                    updateEntity(
                        {
                            id: layerId,
                            changes: {
                                animatedProperties: updatedAnimatedProperties,
                            },
                        },
                        layerEntityConfig
                    )
                );

                // style refresh
                mapLayer.value.changed();
            },
            setGlobalFontFamily(fontFamily: string) {
                patchState(store, { mapFontFamily: fontFamily });
                store.layersEntities().forEach(layer => {
                    layer.value.changed();
                });
            },
            setGlobalFontSize(fontSize: number) {
                patchState(store, { mapFontSize: fontSize });
                store.layersEntities().forEach(layer => {
                    layer.value.changed();
                });
            },
            setScaleTextWithMap(scaleTextWithMap: boolean) {
                patchState(store, { mapScaleTextWithMap: scaleTextWithMap });
                store.layersEntities().forEach(layer => {
                    layer.value.changed();
                });
            },
            setCenter(center: [number, number]) {
                store.map()?.getView().setCenter(center);
            },
            setZoom(zoom: number) {
                store.map()?.getView().setZoom(zoom);
            },
            rebuildLayers(layerConfigs: Layer[]) {
                const olMap = store.map();
                if (!olMap) return;

                clearDrawingInteractions(olMap);
                patchState(store, { _activeLayerId: null });

                const idsToRemove = [...store.layersIds()];
                for (const id of idsToRemove) {
                    const layer = store.layersEntityMap()[id];
                    if (layer) {
                        olMap.removeLayer(layer.value);
                        layer.value.dispose();
                    }
                }
                patchState(store, setAllEntities([] as MapLayer[], layerEntityConfig));

                for (const layerConfig of layerConfigs) {
                    methods.addLayer(layerConfig);
                }
                methods._updateZIndexes();
            },
            clearAnimatedProperties() {
                const ids = [...store.layersIds()];
                for (const id of ids) {
                    patchState(
                        store,
                        updateEntity(
                            { id, changes: { animatedProperties: {} } },
                            layerEntityConfig
                        )
                    );
                }
                store.layersEntities().forEach(layer => layer.value.changed());
            },
        };
        return methods;
    }),
    withComputed(store => ({
        selectedBackgroundLayer: computed(
            () => store.backgroundLayersEntityMap()[store._selectedLayer()!]
        ),
    })),
    withHooks(store => ({
        onInit: async () => {
            const errorService = inject(ErrorService);
            const { center, zoom } = inject(APP_OPTIONS);
            const backgroundLayers = inject(BACKGROUND_LAYERS);
            const olMap = new OlMap({
                controls: [],
                view: new View({
                    center,
                    zoom,
                }),
            });
            const initialResolution = olMap.getView().getResolution();
            patchState(store, {
                map: olMap,
                textScaleReferenceResolution: initialResolution
            });
            await Promise.allSettled(
                backgroundLayers.layers.map(({ name, factory }) =>
                    factory()
                        .then(baseLayer => {
                            const isDefault = name === backgroundLayers.default;
                            const id = generateId<LayerId>();
                            // baseLayer.set('name', name);
                            // baseLayer.set('id', id);
                            olMap.addLayer(baseLayer);
                            if (isDefault) {
                                patchState(store, {
                                    _selectedLayer: id,
                                });
                            }
                            baseLayer.setVisible(isDefault);
                            patchState(
                                store,
                                addEntity(
                                    {
                                        id,
                                        name,
                                        value: baseLayer,
                                    },
                                    backgroundLayerEntityConfig
                                )
                            );
                        })
                        .catch(e => {
                            console.error(
                                `Error loading background layer ${name}:`,
                                e
                            );
                        })
                )
            );
            if (!store.backgroundLayersEntities().length) {
                errorService.showError(
                    'Layer Loading Error',
                    'No background layers could be loaded'
                );
                console.error('No background layers could be loaded');
            }
            if (
                store.selectedBackgroundLayer() === undefined &&
                store.backgroundLayersEntities().length > 0
            ) {
                console.error(
                    'Wrong default layer, selecting the first available layer'
                );
                const { id, value } = store.backgroundLayersEntities()[0];
                value.setVisible(true);
                patchState(store, {
                    _selectedLayer: id,
                });
            }
        },
    }))
);
