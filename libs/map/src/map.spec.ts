import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map';
import { mapStore } from './core/store/map.store';

describe('MapComponent', () => {
    let component: MapComponent;
    let fixture: ComponentFixture<MapComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapComponent],
        })
            .overrideComponent(MapComponent, {
                remove: { providers: [mapStore] },
                add: {
                    providers: [
                        {
                            provide: mapStore,
                            useValue: {
                                setMapElement: jest.fn(),
                                detachMapFromView: jest.fn(),
                                map: jest.fn(),
                                selectedLayer: jest.fn(),
                                selectLayer: jest.fn(),
                                layersEntities: jest.fn().mockReturnValue([]),
                                updateAnimatedProperty: jest.fn(),
                            },
                        },
                    ],
                },
            })
            .compileComponents();
        fixture = TestBed.createComponent(MapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
