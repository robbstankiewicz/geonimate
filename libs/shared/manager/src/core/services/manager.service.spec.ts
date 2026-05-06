import { TestBed } from '@angular/core/testing';
import { ManagerService } from './manager.service';
import { MapService, mapStore } from '@geonimate/map';
import { TimelineService, timelineStore } from '@geonimate/timeline';
import { ConfigService, configStore } from '@geonimate/config';
import { KeyframeState } from '@geonimate/timeline';
import { InferStoreType, KeyframeId, LayerId } from '@geonimate/shared-utils';
import OlPolygon from 'ol/geom/Polygon';
import {
    backgroundLayersMock,
    errorServiceMock,
} from '@geonimate/shared-core/testing';
import { APP_OPTIONS } from '@geonimate/shared-core';
import { useGeographic } from 'ol/proj';
import { settingsStore } from '@geonimate/settings';
import { provideManagerIntegrationEffects } from '../manager-integration-bootstrap';
import { ConfigToMapEffects } from '../effects/config-to-map.effects';
import { ConfigToTimelineEffects } from '../effects/config-to-timeline.effects';
import { MapToConfigTimelineEffects } from '../effects/map-to-config-timeline.effects';
import { SettingsToTimelineMapEffects } from '../effects/settings-to-timeline-map.effects';
import { TimelineKeyframeDragEffects } from '../effects/timeline-keyframe-drag.effects';
import { MapPlayheadPropertyEffects } from '../effects/map-playhead-property.effects';

describe('ManagerService', () => {
    let mapService: MapService;
    let configService: ConfigService;
    let _timelineStore: InferStoreType<typeof timelineStore>;
    let _configStore: InferStoreType<typeof configStore>;
    let managerService: ManagerService;
    beforeEach(async () => {
        useGeographic();
        TestBed.configureTestingModule({
            providers: [
                provideManagerIntegrationEffects(),
                ConfigToMapEffects,
                ConfigToTimelineEffects,
                MapToConfigTimelineEffects,
                SettingsToTimelineMapEffects,
                TimelineKeyframeDragEffects,
                MapPlayheadPropertyEffects,
                ManagerService,
                ConfigService,
                TimelineService,
                MapService,
                errorServiceMock(),
                backgroundLayersMock(),
                mapStore,
                configStore,
                timelineStore,
                settingsStore,
                {
                    provide: APP_OPTIONS,
                    useValue: {
                        center: [11, 10],
                        zoom: 9,
                        fps: 30,
                        timeMs: 5000,
                    },
                },
            ],
        });
        managerService = TestBed.inject(ManagerService);
        mapService = TestBed.inject(MapService);
        configService = TestBed.inject(ConfigService);
        _timelineStore = TestBed.inject(timelineStore);
        _configStore = TestBed.inject(configStore);
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    describe('map drawing integration', () => {
        it('should correctly handle drawing at a new playhead position', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(1000);
            const geometry = new OlPolygon([
                [
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({ layerId: trackId, geometry });
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            expect(keyframes[0].timeMs).toBe(1000);
            expect(_timelineStore._currentTimestampIndex()).toBe(1);
        });
        it('should show shapes at 0ms if the first keyframe is later (e.g. 5000ms)', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(5000);
            const geometry = new OlPolygon([
                [
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({ layerId: trackId, geometry });
            _timelineStore.setPlayheadFreehand(0);
            const playheadData = managerService.resolvedPlayheadData();
            const trackData = playheadData.find(
                d => d.trackId === trackId
            );
            expect(trackData!.propertiesData['shape']!.from).not.toBeNull();
            expect(trackData!.propertiesData['shape']!.to).not.toBeNull();
            expect(trackData!.propertiesData['shape']!.t).toBe(1);
        });
        it('should update existing keyframe state when modifying at an existing keyframe', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(5000);
            const initialGeometry = new OlPolygon([
                [
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({
                layerId: trackId,
                geometry: initialGeometry,
            });
            const timelineService = TestBed.inject(TimelineService);
            const keyframe = timelineService.getKeyframeAtPlayhead(trackId);
            expect(keyframe).toBeTruthy();
            const modifiedGeometry = new OlPolygon([
                [
                    [2, 0],
                    [2, 2],
                    [0, 2],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({
                layerId: trackId,
                geometry: modifiedGeometry,
            });
            const updatedState =
                _configStore.keyframeStatesEntityMap()[keyframe!.id];
            expect(updatedState.properties['shape']!.value).toEqual([
                [2, 0],
                [2, 2],
                [0, 2],
                [0, 0],
            ]);
        });
        it('should always create config KeyframeState when adding a timeline keyframe', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(1000);
            configService.addKeyframe(trackId);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            const keyframeId = keyframes[0].id;
            const stateMap = _configStore.keyframeStatesEntityMap();
            expect(stateMap[keyframeId]).toBeDefined();
            expect(stateMap[keyframeId].properties.opacity!.value).toBe(100);
            expect(stateMap[keyframeId].properties.shape!.value).toBeNull();
        });
    });
    describe('Keyframe Inheritance and Active State', () => {
        it('should second keyframe inherit active state from first keyframe', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const keyframes1 = _timelineStore.keyframesEntities();
            expect(keyframes1.length).toBe(1);
            const kf1Id = keyframes1[0].id;
            _configStore.updateKeyframeProperty(kf1Id, 'opacity', 50);
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const keyframes2 = _timelineStore.keyframesEntities();
            expect(keyframes2.length).toBe(2);
            const kf2Id = keyframes2.find(
                (kf: KeyframeState) => kf.timeMs === 5000
            )!.id;
            const kf2State = _configStore.keyframeStatesEntityMap()[kf2Id];
            expect(kf2State.properties['opacity'].value).toBe(50);
            expect(kf2State.properties['opacity'].active).toBe(true);
            expect(kf2State.properties['shape'].active).toBe(false);
        });
        it('should inactive properties stay inactive when inheriting', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const keyframes1 = _timelineStore.keyframesEntities();
            const kf1Id = keyframes1[0].id;
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const keyframes2 = _timelineStore.keyframesEntities();
            const kf2Id = keyframes2.find(
                (kf: KeyframeState) => kf.timeMs === 5000
            )!.id;
            const kf2State = _configStore.keyframeStatesEntityMap()[kf2Id];
            expect(kf2State.properties['opacity']!.active).toBe(false);
            expect(kf2State.properties['shape']!.active).toBe(false);
            expect(kf2State.properties['label']!.active).toBe(false);
            expect(kf2State.properties['display']!.active).toBe(false);
        });
        it('should inbetween keyframe inherit active state from left keyframe', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const keyframes1 = _timelineStore.keyframesEntities();
            const kf1Id = keyframes1[0].id;
            _configStore.updateKeyframeProperty(kf1Id, 'opacity', 0);
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const keyframes2 = _timelineStore.keyframesEntities();
            const kf2Id = keyframes2.find(
                (kf: KeyframeState) => kf.timeMs === 10000
            )!;
            _configStore.updateKeyframeProperty(kf2Id.id, 'opacity', 100);
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const keyframes3 = _timelineStore.keyframesEntities();
            const kf3Id = keyframes3.find(
                (kf: KeyframeState) => kf.timeMs === 5000
            )!.id;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3Id];
            expect(kf3State.properties['opacity']!.value).toBe(50);
            expect(kf3State.properties['opacity']!.active).toBe(true);
        });
        it('should camera keyframe always have active center and zoom', async () => {
            const trackId = 'camera' as LayerId;
            _timelineStore.setPlayheadFreehand(0);
            const center = mapService.getCenter();
            const zoom = mapService.getZoom();
            configService.addKeyframe(trackId);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            const kfId = keyframes[0].id;
            const kfState = _configStore.keyframeStatesEntityMap()[kfId];
            expect(kfState.properties['center']!.active).toBe(true);
            expect(kfState.properties['zoom']!.active).toBe(true);
            expect(kfState.properties['center']!.value).toEqual(center);
            expect(kfState.properties['zoom']!.value).toBe(zoom);
        });
        it('should inherit text and position properties with correct active state', async () => {
            const layer = _configStore.addLayer('text');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const keyframes1 = _timelineStore.keyframesEntities();
            const kf1Id = keyframes1[0].id;
            _configStore.updateKeyframeProperty(kf1Id, 'label', 'Hello');
            _configStore.updateKeyframeProperty(kf1Id, 'mapPosition', [10, 20]);
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const keyframes2 = _timelineStore.keyframesEntities();
            const kf2Id = keyframes2.find(
                (kf: KeyframeState) => kf.timeMs === 5000
            )!.id;
            const kf2State = _configStore.keyframeStatesEntityMap()[kf2Id];
            expect(kf2State.properties['label']!.value).toBe('Hello');
            expect(kf2State.properties['label']!.active).toBe(true);
            expect(kf2State.properties['mapPosition']!.value).toEqual([10, 20]);
            expect(kf2State.properties['mapPosition']!.active).toBe(true);
            expect(kf2State.properties['opacity']!.active).toBe(false);
        });
    });
    describe('Keyframe Interpolation Setup', () => {
        it('should setup numeric property interpolation correctly', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(kf1.id, 'opacity', 0);
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(kf2.id, 'opacity', 100);
            expect(
                _configStore.keyframeStatesEntityMap()[kf1.id].properties[
                    'opacity'
                ]!.value
            ).toBe(0);
            expect(
                _configStore.keyframeStatesEntityMap()[kf2.id].properties[
                    'opacity'
                ]!.value
            ).toBe(100);
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['opacity']!.value).toBe(50);
            expect(kf3State.properties['opacity']!.active).toBe(true);
        });
        it('should setup coordinate property interpolation correctly', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(kf1.id, 'mapPosition', [0, 0]);
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(
                kf2.id,
                'mapPosition',
                [10, 20]
            );
            expect(
                _configStore.keyframeStatesEntityMap()[kf1.id].properties[
                    'mapPosition'
                ]!.value
            ).toEqual([0, 0]);
            expect(
                _configStore.keyframeStatesEntityMap()[kf2.id].properties[
                    'mapPosition'
                ]!.value
            ).toEqual([10, 20]);
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['mapPosition']!.value).toEqual([5, 10]);
            expect(kf3State.properties['mapPosition']!.active).toBe(true);
        });
        it('should handle shape interpolation setup', async () => {
            const layer = _configStore.addLayer('shape');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            const square1 = new OlPolygon([
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({
                layerId: trackId,
                geometry: square1,
            });
            const kf1 = _timelineStore.keyframesEntities()[0];
            _timelineStore.setPlayheadFreehand(10000);
            const square2 = new OlPolygon([
                [
                    [2, 2],
                    [3, 2],
                    [3, 3],
                    [2, 3],
                    [2, 2],
                ],
            ]);
            mapService.featureUpdated$.next({
                layerId: trackId,
                geometry: square2,
            });
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            const state1 = _configStore.keyframeStatesEntityMap()[kf1.id];
            const state2 = _configStore.keyframeStatesEntityMap()[kf2.id];
            expect(state1.properties['shape']!.value).toBeDefined();
            expect(state2.properties['shape']!.value).toBeDefined();
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            const interpolatedShape = kf3State.properties['shape']!.value as [
                number,
                number,
            ][];
            expect(interpolatedShape).toBeDefined();
            expect(interpolatedShape[0]).toEqual([1, 1]);
            expect(interpolatedShape[1]).toEqual([2, 1]);
            expect(interpolatedShape[2]).toEqual([2, 2]);
            expect(interpolatedShape[3]).toEqual([1, 2]);
        });
        it('should handle mixed active states in interpolation', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(kf1.id, 'opacity', 50);
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(kf2.id, 'opacity', 100);
            _timelineStore.setPlayhead(5000);
            const resolved = managerService
                .resolvedPlayheadData()
                .find(d => d.trackId === trackId);
            expect(resolved?.propertiesData['opacity']).toBeDefined();
        });
    });
    describe('date interpolation', () => {
        it('should handle year interpolation', async () => {
            const layer = _configStore.addLayer('date');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'date',
                '2023-12-31T00:00:00.000Z'
            );
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(
                kf2.id,
                'date',
                '2024-01-01T00:00:00.000Z'
            );
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['date']!.value).toBe(
                '2023-12-31T12:00:00.000Z'
            );
        });
        it('should handle month interpolation', async () => {
            const layer = _configStore.addLayer('date');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'date',
                '2024-01-31T00:00:00.000Z'
            );
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(
                kf2.id,
                'date',
                '2024-02-01T00:00:00.000Z'
            );
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['date']!.value).toBe(
                '2024-01-31T12:00:00.000Z'
            );
        });
        it('should handle second precision with interpolated values at multiple positions', async () => {
            const layer = _configStore.addLayer('date');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'date',
                '2024-01-01T00:00:00.000Z'
            );
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(
                kf2.id,
                'date',
                '2024-01-01T00:00:30.000Z'
            );
            _timelineStore.setPlayhead(2500);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 2500)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['date']!.value).toBe(
                '2024-01-01T00:00:07.500Z'
            );
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf4 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf4State = _configStore.keyframeStatesEntityMap()[kf4.id];
            expect(kf4State.properties['date']!.value).toBe(
                '2024-01-01T00:00:15.000Z'
            );
            _timelineStore.setPlayhead(7500);
            configService.addKeyframe(trackId);
            const kf5 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 7500)!;
            const kf5State = _configStore.keyframeStatesEntityMap()[kf5.id];
            expect(kf5State.properties['date']!.value).toBe(
                '2024-01-01T00:00:22.500Z'
            );
        });
        it('should animate 100 years over 10 seconds with verified interpolated dates', async () => {
            const layer = _configStore.addLayer('date');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'date',
                '1900-01-01T00:00:00.000Z'
            );
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(
                kf2.id,
                'date',
                '2000-01-01T00:00:00.000Z'
            );
            _timelineStore.setPlayhead(2500);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 2500)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['date'].value).toBe(
                '1925-01-01T00:00:00.000Z'
            );
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf4 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf4State = _configStore.keyframeStatesEntityMap()[kf4.id];
            expect(kf4State.properties['date'].value).toBe(
                '1950-01-01T00:00:00.000Z'
            );
            _timelineStore.setPlayhead(7500);
            configService.addKeyframe(trackId);
            const kf5 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 7500)!;
            const kf5State = _configStore.keyframeStatesEntityMap()[kf5.id];
            expect(kf5State.properties['date'].value).toBe(
                '1975-01-01T00:00:00.000Z'
            );
        });
    });
    describe('Boolean Properties (display)', () => {
        it('should use from value for display property (no interpolation)', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(kf1.id, 'display', true);
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(kf2.id, 'display', false);
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['display'].value).toBe(true);
            expect(kf3State.properties['display'].active).toBe(true);
        });
        it('should handle same display value on both keyframes', async () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(kf1.id, 'display', true);
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 10000)!;
            _configStore.updateKeyframeProperty(kf2.id, 'display', true);
            _timelineStore.setPlayhead(5000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore
                .keyframesEntities()
                .find((kf: KeyframeState) => kf.timeMs === 5000)!;
            const kf3State = _configStore.keyframeStatesEntityMap()[kf3.id];
            expect(kf3State.properties['display'].value).toBe(true);
        });
    });
    describe('Keyframe Splitting and Merging', () => {
        it('should merge keyframe properties when dropped on sibling at same timestamp', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'mapPosition',
                [10, 20]
            );
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore.keyframesEntities()[1];
            _configStore.updateKeyframeProperty(kf2.id, 'label', 'Hello');
            _timelineStore.moveKeyframe(kf2.id, 0);
            const keyframesBeforeMerge = _timelineStore.keyframesEntities();
            const keyframesAtZero = keyframesBeforeMerge.filter(
                (kf: KeyframeState) => kf.timeMs === 0
            );
            expect(keyframesAtZero.length).toBe(2);
            const kf2StateBefore =
                _configStore.keyframeStatesEntityMap()[kf2.id];
            expect(kf2StateBefore.properties['label']?.value).toBe('Hello');
            expect(kf2StateBefore.properties['label']?.active).toBe(true);
            _configStore.setSelectedPropertyMode('mapPosition');
            managerService.mergeKeyframeIfNeeded(kf2.id);
            const keyframesAfterMerge = _timelineStore.keyframesEntities();
            expect(keyframesAfterMerge.length).toBe(1);
            expect(keyframesAfterMerge[0].id).toBe(kf1.id);
            const mergedState = _configStore.keyframeStatesEntityMap()[kf1.id];
            expect(mergedState.properties['mapPosition']?.value).toEqual([
                10, 20,
            ]);
            expect(mergedState.properties['mapPosition']?.active).toBe(true);
            expect(mergedState.properties['label']?.value).toBe('Hello');
            expect(mergedState.properties['label']?.active).toBe(true);
        });
        it('should merge multiple sibling keyframes at same timestamp', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'mapPosition',
                [10, 20]
            );
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore.keyframesEntities()[1];
            _configStore.updateKeyframeProperty(kf2.id, 'label', 'Hello');
            _timelineStore.setPlayheadFreehand(10000);
            configService.addKeyframe(trackId);
            const kf3 = _timelineStore.keyframesEntities()[2];
            _configStore.updateKeyframeProperty(kf3.id, 'opacity', 75);
            expect(_timelineStore.keyframesEntities().length).toBe(3);
            _timelineStore.moveKeyframe(kf2.id, 0);
            _timelineStore.moveKeyframe(kf3.id, 0);
            expect(_timelineStore.keyframesEntities().length).toBe(3);
            _configStore.setSelectedPropertyMode('mapPosition');
            managerService.mergeKeyframeIfNeeded(kf3.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            expect(keyframes[0].id).toBe(kf1.id);
            const mergedState = _configStore.keyframeStatesEntityMap()[kf1.id];
            expect(mergedState.properties['mapPosition']?.value).toEqual([
                10, 20,
            ]);
            expect(mergedState.properties['mapPosition']?.active).toBe(true);
            expect(mergedState.properties['label']?.value).toBe('Hello');
            expect(mergedState.properties['label']?.active).toBe(true);
            expect(mergedState.properties['opacity']?.value).toBe(75);
            expect(mergedState.properties['opacity']?.active).toBe(true);
        });
        it('should NOT merge keyframes when dropped at different timestamp', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore.keyframesEntities()[1];
            expect(_timelineStore.keyframesEntities().length).toBe(2);
            managerService.mergeKeyframeIfNeeded(kf2.id);
            expect(_timelineStore.keyframesEntities().length).toBe(2);
        });
        it('should preserve dropped keyframe properties when merging with siblings', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'mapPosition',
                [10, 20]
            );
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore.keyframesEntities()[1];
            _configStore.updateKeyframeProperty(
                kf2.id,
                'mapPosition',
                [30, 40]
            );
            _configStore.updateKeyframeProperty(kf2.id, 'label', 'World');
            _timelineStore.moveKeyframe(kf2.id, 0);
            _configStore.setSelectedPropertyMode('mapPosition');
            managerService.mergeKeyframeIfNeeded(kf2.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            expect(keyframes[0].id).toBe(kf1.id);
            const mergedState = _configStore.keyframeStatesEntityMap()[kf1.id];
            expect(mergedState.properties['mapPosition']?.value).toEqual([
                30, 40,
            ]);
            expect(mergedState.properties['label']?.value).toBe('World');
        });
        it('should NOT split keyframe when mode property is inactive', async () => {
            const layer = _configStore.addLayer('shape');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(5000);
            const geometry = new OlPolygon([
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({
                layerId: trackId,
                geometry: geometry,
            });
            const kf1 = _timelineStore.keyframesEntities()[0];
            expect(
                _configStore.keyframeStatesEntityMap()[kf1.id].properties[
                    'shape'
                ]?.active
            ).toBe(true);
            expect(
                _configStore.keyframeStatesEntityMap()[kf1.id].properties[
                    'mapPosition'
                ]?.active ?? false
            ).toBe(false);
            _configStore.setSelectedPropertyMode('mapPosition');
            managerService.splitKeyframeIfNeeded(kf1.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            expect(keyframes[0].id).toBe(kf1.id);
        });
        it('should split keyframe when mode property is active and other properties exist', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'mapPosition',
                [10, 20]
            );
            _configStore.updateKeyframeProperty(kf1.id, 'label', 'Hello');
            expect(
                _configStore.keyframeStatesEntityMap()[kf1.id].properties[
                    'mapPosition'
                ]?.active
            ).toBe(true);
            expect(
                _configStore.keyframeStatesEntityMap()[kf1.id].properties[
                    'label'
                ]?.active
            ).toBe(true);
            _configStore.setSelectedPropertyMode('mapPosition');
            managerService.splitKeyframeIfNeeded(kf1.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(2);
            const keyframeIds = keyframes.map(kf => kf.id);
            expect(keyframeIds).toContain(kf1.id);
            const originalState =
                _configStore.keyframeStatesEntityMap()[kf1.id];
            expect(originalState.properties['mapPosition']?.active).toBe(true);
            expect(originalState.properties['label']?.active ?? false).toBe(
                false
            );
            const newKfId = keyframeIds.find(id => id !== kf1.id)!;
            const newState = _configStore.keyframeStatesEntityMap()[newKfId];
            expect(newState.properties['mapPosition']?.active ?? false).toBe(
                false
            );
            expect(newState.properties['label']?.active).toBe(true);
        });
        it('should NOT split keyframe when mode property is active but no other properties exist', async () => {
            const layer = _configStore.addLayer('shape');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(5000);
            const geometry = new OlPolygon([
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({
                layerId: trackId,
                geometry: geometry,
            });
            const kf1 = _timelineStore.keyframesEntities()[0];
            expect(
                _configStore.keyframeStatesEntityMap()[kf1.id].properties[
                    'shape'
                ]?.active
            ).toBe(true);
            _configStore.setSelectedPropertyMode('shape');
            managerService.splitKeyframeIfNeeded(kf1.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            expect(keyframes[0].id).toBe(kf1.id);
        });
        it('should NOT create empty keyframes when repeatedly splitting with inactive mode', async () => {
            const layer = _configStore.addLayer('shape');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(5000);
            const geometry = new OlPolygon([
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ]);
            mapService.featureUpdated$.next({
                layerId: trackId,
                geometry: geometry,
            });
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.setSelectedPropertyMode('mapPosition');
            managerService.splitKeyframeIfNeeded(kf1.id);
            managerService.splitKeyframeIfNeeded(kf1.id);
            managerService.splitKeyframeIfNeeded(kf1.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            expect(keyframes[0].id).toBe(kf1.id);
        });
        it('should preserve target keyframe properties when merging (target wins)', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'mapPosition',
                [10, 20]
            );
            _configStore.updateKeyframeProperty(kf1.id, 'opacity', 50);
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore.keyframesEntities()[1];
            _configStore.updateKeyframeProperty(
                kf2.id,
                'mapPosition',
                [30, 40]
            );
            _configStore.updateKeyframeProperty(kf2.id, 'label', 'Hello');
            _timelineStore.moveKeyframe(kf2.id, 0);
            _configStore.setSelectedPropertyMode('mapPosition');
            managerService.mergeKeyframeIfNeeded(kf2.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(1);
            expect(keyframes[0].id).toBe(kf1.id);
            const mergedState = _configStore.keyframeStatesEntityMap()[kf1.id];
            expect(mergedState.properties['mapPosition']?.value).toEqual([
                30, 40,
            ]);
            expect(mergedState.properties['opacity']?.value).toBe(50);
            expect(mergedState.properties['label'].value).toBe('Hello');
            expect(mergedState.properties['label'].active).toBe(true);
        });
        it('should NOT merge keyframes when in all mode', async () => {
            const layer = _configStore.addLayer('point');
            const trackId = layer.id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf1 = _timelineStore.keyframesEntities()[0];
            _configStore.updateKeyframeProperty(
                kf1.id,
                'mapPosition',
                [10, 20]
            );
            _timelineStore.setPlayheadFreehand(5000);
            configService.addKeyframe(trackId);
            const kf2 = _timelineStore.keyframesEntities()[1];
            _configStore.updateKeyframeProperty(kf2.id, 'label', 'Hello');
            _timelineStore.moveKeyframe(kf2.id, 0);
            _configStore.setSelectedPropertyMode('all');
            managerService.mergeKeyframeIfNeeded(kf2.id);
            const keyframes = _timelineStore.keyframesEntities();
            expect(keyframes.length).toBe(2);
        });
    });
    describe('requestMovePlayheadToKeyframe', () => {
        it('should set playhead to keyframe timeMs when keyframe exists', () => {
            const trackId = _configStore.addLayer('shape').id;
            _timelineStore.setPlayheadFreehand(0);
            configService.addKeyframe(trackId);
            const kf = _timelineStore.keyframesEntities()[0];
            _timelineStore.moveKeyframe(kf.id, 2500);
            expect(_timelineStore.playheadPositionMs()).toBe(0);
            configService.requestMovePlayheadToKeyframe(kf.id);
            expect(_timelineStore.playheadPositionMs()).toBe(2500);
        });
        it('should leave playhead unchanged when keyframe id is unknown', () => {
            _timelineStore.setPlayheadFreehand(1234);
            const before = _timelineStore.playheadPositionMs();
            configService.requestMovePlayheadToKeyframe(
                'unknown-kf-id' as KeyframeId
            );
            expect(_timelineStore.playheadPositionMs()).toBe(before);
        });
    });
});
