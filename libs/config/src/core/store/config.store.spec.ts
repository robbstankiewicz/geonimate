import { configStore } from './config.store';
import { TestBed } from '@angular/core/testing';
import {
    generateId,
    InferStoreType,
    LayerId,
    KeyframeId,
} from '@geonimate/shared-utils';

describe('Config Store', () => {
    let store: InferStoreType<typeof configStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [configStore],
        });
        store = TestBed.inject(configStore);
        jest.useFakeTimers();
    });

    describe('Layer move', () => {
        let id1: LayerId;
        let id2: LayerId;
        let id3: LayerId;
        let id4: LayerId;
        beforeEach(() => {
            ({ id: id1 } = store.addLayer());
            ({ id: id2 } = store.addLayer());
            ({ id: id3 } = store.addLayer());
            ({ id: id4 } = store.addLayer());
        });
        it('should always keep first layer in position when adding new layers', () => {
            expect(store.layersIds()).toEqual([id1, id4, id3, id2]);
        });
        it('should not move layer to the first position', () => {
            expect(store.layersIds()).toEqual([id1, id4, id3, id2]);
            store.moveLayer(id3, 0);
            expect(store.layersIds()).toEqual([id1, id4, id3, id2]);
        });
        it('should not move layer from the first position', () => {
            expect(store.layersIds()).toEqual([id1, id4, id3, id2]);
            store.moveLayer(id1, 3);
            expect(store.layersIds()).toEqual([id1, id4, id3, id2]);
        });
        it('should move layer', async () => {
            expect(store.layersIds()).toEqual([id1, id4, id3, id2]);
            store.moveLayer(id4, 3);
            expect(store.layersIds()).toEqual([id1, id3, id2, id4]);
            // random id
            store.moveLayer(generateId<LayerId>(), 0);
            expect(store.layersIds()).toEqual([id1, id3, id2, id4]);
            store.moveLayer(id2, -100);
            expect(store.layersIds()).toEqual([id1, id3, id2, id4]);
            store.moveLayer(id2, 100);
            expect(store.layersIds()).toEqual([id1, id3, id4, id2]);
        });
    });

    describe('Layer remove', () => {
        it('should remove layer and its keyframe states', () => {
            const layer = store.addLayer();
            const kfId = generateId<KeyframeId>();
            store.addKeyframeState(kfId, layer.id, layer.type);

            store.removeLayer(layer.id);

            expect(store.layersEntityMap()[layer.id]).toBeUndefined();
            expect(store.keyframeStatesEntityMap()[kfId]).toBeUndefined();
            expect(store.layersIds().includes(layer.id)).toBe(false);
        });
    });
});
