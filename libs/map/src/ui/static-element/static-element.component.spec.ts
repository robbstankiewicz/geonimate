import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StaticElementComponent } from './static-element.component';
import { settingsStore } from '@geonimate/settings';
import {
    createLayer,
    generateId,
    LayerId,
    StaticPosition,
    TextLayer,
} from '@geonimate/shared-utils';
import { MapLayer } from '../../core/store/map.store';
import VectorLayer from 'ol/layer/Vector';



describe('StaticElementComponent', () => {
    let fixture: ComponentFixture<StaticElementComponent>;
    let nativeElement: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StaticElementComponent],
            providers: [
                {
                    provide: settingsStore,
                    useValue: {
                        fontFamily: () => 'sans-serif',
                        fontSize: () => 16,
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(StaticElementComponent);
        nativeElement = fixture.nativeElement as HTMLElement;

        const id = generateId<LayerId>();
        const rgb = { r: 10, g: 20, b: 30 };
        const base = createLayer('text', id, 'Static', rgb) as TextLayer;
        const staticPosition: StaticPosition = {
            anchorX: 'left',
            anchorY: 'bottom',
            offsetX: 380,
            offsetY: 90,
        };
        const mapLayer = {
            id,
            value: {} as InstanceType<typeof VectorLayer>,
            config: {
                ...base,
                textAlign: 'right',
                defaultText: 'Static',
            },
            animatedProperties: { staticPosition },
        } as MapLayer<TextLayer>;

        fixture.componentRef.setInput('mapLayer', mapLayer);
        fixture.componentRef.setInput(
            'container',
            document.createElement('div')
        );
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should apply text alignment from layer config', async () => {
        await fixture.whenStable();
        const inner = nativeElement.querySelector(
            '.static-element'
        ) as HTMLElement | null;
        expect(inner?.style.textAlign).toBe('right');
        expect(fixture.componentInstance.textAlign()).toBe('right');
    });

    it('should reflect textAlign in anchor-based leftStyle for left anchor', async () => {
        const id = generateId<LayerId>();
        const rgb = { r: 10, g: 20, b: 30 };
        const base = createLayer('text', id, 'Anchored', rgb) as TextLayer;
        const staticPosition: StaticPosition = {
            anchorX: 'left',
            anchorY: 'bottom',
            offsetX: 400,
            offsetY: 80,
        };

        const buildLayer = (align: 'center' | 'left'): MapLayer<TextLayer> =>
            ({
                id,
                value: {} as InstanceType<typeof VectorLayer>,
                config: {
                    ...base,
                    textAlign: align,
                    defaultText: 'Anchor test',
                },
                animatedProperties: { staticPosition },
            }) as MapLayer<TextLayer>;

        fixture.componentRef.setInput('mapLayer', buildLayer('center'));

        const inst = fixture.componentInstance as any;
        inst.elementSize.set({ width: 100, height: 24 });

        expect(fixture.componentInstance.leftStyle()).toBe('350px');

        fixture.componentRef.setInput('mapLayer', buildLayer('left'));
        expect(fixture.componentInstance.leftStyle()).toBe('400px');
    });
});
