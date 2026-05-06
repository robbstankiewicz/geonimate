import { inject, Injectable, Signal } from '@angular/core';
import { configStore } from '../store/config.store';
import { KeyframeId, LayerId } from '@geonimate/shared-utils';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ConfigService {
    store = inject(configStore);
    layerMoved$ = this.store.layerMoved$;
    layerAdded$ = this.store.layerAdded$;
    layerSettingsChanged$ = this.store.layerSettingsChanged$;
    layerRemoved$ = this.store.layerRemoved$;
    activeLayerChanged$ = this.store.activeLayerChanged$;
    addKeyframe$ = new Subject<LayerId>();
    removeKeyframeById$ = new Subject<KeyframeId>();
    movePlayheadToKeyframe$ = new Subject<KeyframeId>();
    layersIds = this.store.layersIds as Signal<LayerId[]>;
    activeLayerId = this.store.activeLayerId;
    selectedPropertyMode = this.store.selectedPropertyMode;
    keyframeStatesEntityMap = this.store.keyframeStatesEntityMap;

    getKayframeState(id: KeyframeId) {
        return this.store.keyframeStatesEntityMap()[id];
    }

    addLayer = this.store.addLayer;
    removeLayer = this.store.removeLayer;
    setActiveLayer = this.store.setActiveLayer;
    addKeyframeState = this.store.addKeyframeState;
    updateKeyframeProperty = this.store.updateKeyframeProperty;
    toggleKeyframePropertyActive = this.store.toggleKeyframePropertyActive;
    removeKeyframeState = this.store.removeKeyframeState;
    setKeyframeProperties = this.store.setKeyframeProperties;

    addKeyframe(id: LayerId) {
        this.addKeyframe$.next(id);
    }

    requestRemoveKeyframeById(id: KeyframeId) {
        this.removeKeyframeById$.next(id);
    }

    requestMovePlayheadToKeyframe(id: KeyframeId) {
        this.movePlayheadToKeyframe$.next(id);
    }
}
