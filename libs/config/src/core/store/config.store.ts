import { computed } from '@angular/core';
import {
    patchState,
    signalStore,
    type,
    withComputed,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';

import {
    generateId,
    getRandomRgb,
    KeyframeId,
    LAYER_TYPE_METADATA,
    LayerId,
    LayerType,
    Layer,
    createLayer,
    PropertyType,
    PropertyValueType,
} from '@geonimate/shared-utils';
import { withTreeShakableDevTools } from '@geonimate/shared-core';
import {
    KeyframeState,
    AnimatableProperty,
    PropertyValues,
} from '../../models/keyframe-state.model';
import { PROPERTY_REGISTRY } from '../../models/property-metadata';
import {
    entityConfig,
    updateEntity,
    setEntity,
    setAllEntities,
    withEntities,
    removeEntity,
} from '@ngrx/signals/entities';
import { Subject } from 'rxjs';

export type PropertyMode = PropertyType | 'all';

interface ConfigState {
    activeLayerId: LayerId | null;
    selectedPropertyMode: PropertyMode;
}

const keyframeStateEntityConfig = entityConfig({
    collection: 'keyframeStates',
    entity: type<KeyframeState>(),
});

const layerEntityConfig = entityConfig({
    entity: type<Layer>(),
    collection: 'layers',
});

const changeDuplicate = (name: string, entities: Layer[]): string => {
    if (entities.find(l => l.name === name)) {
        name = `${name}*`;
        return changeDuplicate(name, entities);
    }
    return name;
};

function assignProperty<P extends PropertyType>(
    target: PropertyValues,
    source: Partial<PropertyValues>,
    key: P
): void {
    const prop = source[key];
    if (prop !== undefined) {
        target[key] = prop;
    }
}

export function resolveKeyframePropertyDefaultValue(
    layer: Layer,
    key: PropertyType
): PropertyValueType[PropertyType] | null {
    const meta = PROPERTY_REGISTRY[key];
    const mapping = meta.valueFromConfigKey;
    if (mapping) {
        const configKey = mapping[layer.type];
        if (configKey) {
            const raw = layer[configKey as keyof Layer];
            if (raw !== undefined && raw !== null) {
                return raw as PropertyValueType[PropertyType];
            }
        }
    }
    return meta.defaultValue;
}

function initProperty<P extends PropertyType>(
    target: PropertyValues,
    key: P,
    value: PropertyValueType[P] | null
): void {
    Object.assign(target, {
        [key]: { active: false, value },
    });
}

export const configStore = signalStore(
    withTreeShakableDevTools('Config Store'),
    withState<ConfigState>({
        activeLayerId: null,
        selectedPropertyMode: 'all',
    }),
    withEntities(layerEntityConfig),
    withEntities(keyframeStateEntityConfig),
    withProps(() => ({
        layerMoved$: new Subject<{ id: LayerId; toIndex: number }>(),
        layerAdded$: new Subject<Layer>(),
        layerSettingsChanged$: new Subject<{
            id: LayerId;
            settings: Partial<Layer>;
        }>(),
        activeLayerChanged$: new Subject<LayerId | null>(),
        addKeyframe$: new Subject<LayerId>(),
        layerRemoved$: new Subject<LayerId>(),
    })),
    withComputed(store => {
        const cameraLayer = computed(() =>
            store.layersEntities().find(l => l.type === 'camera')
        );
        return { cameraLayer };
    }),
    withMethods(store => {
        return {
            moveLayer(id: LayerId, toIndex: number) {
                const fromIndex = store.layersIds().indexOf(id);
                if (
                    toIndex <= 0 ||
                    fromIndex === 0 ||
                    fromIndex === -1 ||
                    toIndex === fromIndex
                )
                    return;
                const newLayersIds = store
                    .layersIds()
                    .toSpliced(fromIndex, 1)
                    .toSpliced(toIndex, 0, id);
                patchState(store, state => ({
                    ...state,
                    layersIds: newLayersIds,
                }));
                store.layerMoved$.next({ id, toIndex });
            },
            editLayer(id: LayerId, changes: Partial<Layer>) {
                if (changes.name !== undefined) {
                    let newName =
                        changes.name ||
                        `layer_${store.layersEntities().length - 1}`;
                    newName = changeDuplicate(newName, store.layersEntities());
                    changes.name = newName;
                }

                // todo change layer settings events
                // const settingsToEmit = { ...changes };
                // delete settingsToEmit.name;
                //
                // if (Object.keys(settingsToEmit).length > 0) {
                //     store.layerSettingsChanged$.next({
                //         id,
                //         settings: settingsToEmit,
                //     });
                // }

                patchState(
                    store,
                    updateEntity({ id, changes }, layerEntityConfig)
                );
                store.layerSettingsChanged$.next({
                    id,
                    settings: changes,
                });
            },
            addLayer(type: LayerType = 'shape') {
                const id = generateId<LayerId>();
                const name = '';
                const timelineColor = getRandomRgb();

                const layer = createLayer(type, id, name, timelineColor);

                patchState(store, state => {
                    const ids = state.layersIds.toSpliced(1, 0, id);
                    const entities = { ...state.layersEntityMap, [id]: layer };
                    return {
                        ...state,
                        layersIds: ids,
                        layersEntityMap: entities,
                    };
                });
                store.layerAdded$.next(layer);
                return layer;
            },
            removeLayer(id: LayerId) {
                const entity = store.layersEntityMap()[id];
                if (!entity || entity.type === 'camera') {
                    return;
                }
                const stateIds = store
                    .keyframeStatesEntities()
                    .filter(s => s.layerId === id)
                    .map(s => s.id);
                for (const stateId of stateIds) {
                    patchState(
                        store,
                        removeEntity(stateId, keyframeStateEntityConfig)
                    );
                }
                patchState(store, removeEntity(id, layerEntityConfig));
                const active = store.activeLayerId();
                if (active === id) {
                    patchState(store, { activeLayerId: null });
                    store.activeLayerChanged$.next(null);
                }
                store.layerRemoved$.next(id);
            },
            setActiveLayer(id: LayerId | null) {
                patchState(store, { activeLayerId: id });
                store.activeLayerChanged$.next(id);
            },
            setSelectedPropertyMode(mode: PropertyMode) {
                patchState(store, { selectedPropertyMode: mode });
            },
            addKeyframeState(
                id: KeyframeId,
                layerId: LayerId,
                layerType: LayerType,
                values: Partial<PropertyValues> = {}
            ) {
                const properties = {} as PropertyValues;
                const layer = store.layersEntityMap()[layerId];

                const propertyList =
                    LAYER_TYPE_METADATA[layerType]['keyframeProperties'];

                for (const prop of propertyList) {
                    initProperty(
                        properties,
                        prop,
                        resolveKeyframePropertyDefaultValue(layer, prop)
                    );
                }

                for (const key of Object.keys(values) as PropertyType[]) {
                    assignProperty(properties, values, key);
                }

                const state: KeyframeState = {
                    id,
                    layerId,
                    layerType,
                    properties,
                };

                patchState(store, setEntity(state, keyframeStateEntityConfig));
            },
            updateKeyframeState<T extends PropertyType>(
                id: KeyframeId,
                property: T,
                transform: (
                    prop: AnimatableProperty<PropertyValueType[T]>
                ) => AnimatableProperty<PropertyValueType[T]>
            ) {
                const state = store.keyframeStatesEntityMap()[id];
                if (!state) return;

                const prop = state.properties[property];
                if (!prop) return;

                const updatedProperties = {
                    ...state.properties,
                    [property]: transform(prop),
                };

                patchState(
                    store,
                    updateEntity(
                        { id, changes: { properties: updatedProperties } },
                        keyframeStateEntityConfig
                    )
                );
            },
            updateKeyframeProperty<T extends PropertyType>(
                id: KeyframeId,
                property: T,
                value: PropertyValueType[T]
            ) {
                const state = store.keyframeStatesEntityMap()[id];
                if (!state) return;

                const prop = state.properties[property];
                if (!prop) return;

                const updatedProperties: PropertyValues = {
                    ...state.properties,
                    [property]: {
                        ...prop,
                        active: true,
                        value,
                    } as AnimatableProperty<PropertyValueType[T]>,
                };

                patchState(
                    store,
                    updateEntity(
                        { id, changes: { properties: updatedProperties } },
                        keyframeStateEntityConfig
                    )
                );
            },
            toggleKeyframePropertyActive<T extends PropertyType>(
                id: KeyframeId,
                property: T
            ) {
                const state = store.keyframeStatesEntityMap()[id];
                if (!state) return;

                const prop = state.properties[property];
                if (!prop) return;

                const updatedProperties: PropertyValues = {
                    ...state.properties,
                    [property]: {
                        ...prop,
                        active: !prop.active,
                    } as AnimatableProperty<PropertyValueType[T]>,
                };

                patchState(
                    store,
                    updateEntity(
                        { id, changes: { properties: updatedProperties } },
                        keyframeStateEntityConfig
                    )
                );
            },
            removeKeyframeState(id: KeyframeId) {
                patchState(store, removeEntity(id, keyframeStateEntityConfig));
            },
            loadState(snapshot: {
                layers: Layer[];
                keyframeStates: KeyframeState[];
            }) {
                patchState(store, setAllEntities(snapshot.layers, layerEntityConfig));
                patchState(
                    store,
                    setAllEntities(snapshot.keyframeStates, keyframeStateEntityConfig)
                );
                patchState(store, { activeLayerId: null });
                store.activeLayerChanged$.next(null);
            },
            setKeyframeProperties(id: KeyframeId, properties: PropertyValues) {
                const state = store.keyframeStatesEntityMap()[id];
                if (!state) return;

                patchState(
                    store,
                    updateEntity(
                        { id, changes: { properties } },
                        keyframeStateEntityConfig
                    )
                );
            },
        };
    })
);
