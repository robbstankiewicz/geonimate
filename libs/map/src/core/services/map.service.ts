import { inject, Injectable } from '@angular/core';
import { mapStore } from '../store/map.store';
import { LayerId, Layer, PropertyType, PropertyValueType } from '@geonimate/shared-utils';

type Ring = [number, number][];

@Injectable()
export class MapService {
    private store = inject(mapStore);
    backgroundLayers = this.store.backgroundLayersEntities;
    featureUpdated$ = this.store.featureUpdated$;
    setActiveBackgroundLayer = this.store.setActiveBackgroundLayer;
    setGlobalFontSize = this.store.setGlobalFontSize;
    setGlobalFontFamily = this.store.setGlobalFontFamily;
    setScaleTextWithMap = this.store.setScaleTextWithMap;
    addLayer(config: Layer) {
        this.store.addLayer(config);
    }
    removeLayer(layerId: LayerId) {
        this.store.removeLayer(layerId);
    }
    updateLayerConfig(layerId: LayerId, configUpdate: Partial<Layer>) {
        this.store.updateLayerConfig(layerId, configUpdate);
    }
    updateZIndexes(newLayerOrder: LayerId[]) {
        const reversed = [...newLayerOrder].reverse();
        reversed.forEach((id, index) => {
            this.store.updateZIndex(id, index);
        });
    }
    setActiveDrawingLayer(id: LayerId | null) {
        this.store.setActiveLayer(id);
    }
    updateAnimationFeature(layerId: LayerId, ring: Ring | null) {
        this.store.updateAnimationFeature(layerId, ring);
    }
    updatePointFeature(layerId: LayerId, pos: [number, number] | null) {
        this.store.updatePointFeature(layerId, pos);
    }
    updateLayerOpacity(layerId: LayerId, opacity: number) {
        this.store.updateLayerOpacity(layerId, opacity);
    }
    updateLayerDisplay(layerId: LayerId, display: boolean) {
        this.store.updateLayerDisplay(layerId, display);
    }
    updateAnimatedProperty<K extends PropertyType>(layerId: LayerId, property: K, value: PropertyValueType[K] | null) {
        this.store.updateAnimatedProperty(layerId, property, value);
    }
    setCenter(center: [number, number]) {
        this.store.setCenter(center);
    }
    setZoom(zoom: number) {
        this.store.setZoom(zoom);
    }
    rebuildLayers(layers: Layer[]) {
        this.store.rebuildLayers(layers);
    }
    clearAnimatedProperties() {
        this.store.clearAnimatedProperties();
    }
    getCenter(): [number, number] | null {
        const view = this.store.map()?.getView();
        return view ? (view.getCenter() as [number, number]) : null;
    }
    getZoom(): number | null {
        const view = this.store.map()?.getView();
        const zoom = view?.getZoom();
        return zoom !== undefined ? zoom : null;
    }
    getMapElement(): HTMLElement | null | undefined {
        return this.store.map()?.getTargetElement();
    }
    detachMapFromView() {
        this.store.detachMapFromView();
    }
}
