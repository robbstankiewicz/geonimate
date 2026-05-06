import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayerListItem } from './layer-list-item';
import { createLayer, generateId, LayerId } from '@geonimate/shared-utils';

describe('LayerListItem', () => {
    let fixture: ComponentFixture<LayerListItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LayerListItem, DragDropModule],
        }).compileComponents();

        fixture = TestBed.createComponent(LayerListItem);
    });

    function setLayer(
        type: 'shape' | 'camera',
        overrides: Record<string, unknown> = {}
    ) {
        const id = generateId<LayerId>();
        const layer = {
            ...createLayer(type, id, 'Layer', { r: 200, g: 0, b: 0 }),
            ...overrides,
        };
        fixture.componentRef.setInput('layer', layer);
        fixture.detectChanges();
    }

    it('should emit toggled display when visibility is clicked', () => {
        setLayer('shape', { display: true });
        const spy = jest.fn();
        fixture.componentInstance.layerChange.subscribe(spy);

        const btn = fixture.nativeElement.querySelector(
            '.visibility-button'
        ) as HTMLButtonElement;
        expect(btn).toBeTruthy();
        btn.click();
        expect(spy).toHaveBeenCalledWith({ display: false });
    });

    it('should show pi-eye when visible and pi-eye-slash when hidden', () => {
        setLayer('shape', { display: true });
        expect(
            fixture.nativeElement.querySelector('.visibility-button .pi-eye')
        ).toBeTruthy();

        setLayer('shape', { display: false });
        expect(
            fixture.nativeElement.querySelector(
                '.visibility-button .pi-eye-slash'
            )
        ).toBeTruthy();
    });

    it('should not render visibility control for camera layer', () => {
        setLayer('camera');
        expect(
            fixture.nativeElement.querySelector('.visibility-button')
        ).toBeNull();
    });

    it('should emit toggled cameraLocked when camera lock is clicked', () => {
        setLayer('camera', { cameraLocked: false });
        const spy = jest.fn();
        fixture.componentInstance.layerChange.subscribe(spy);

        const btn = fixture.nativeElement.querySelector(
            '.camera-lock-button'
        ) as HTMLButtonElement;
        expect(btn).toBeTruthy();
        btn.click();
        expect(spy).toHaveBeenCalledWith({ cameraLocked: true });
    });

    it('should show pi-lock when camera keyframes locked and pi-lock-open when unlocked', () => {
        setLayer('camera', { cameraLocked: true });
        expect(
            fixture.nativeElement.querySelector('.camera-lock-button .pi-lock')
        ).toBeTruthy();

        setLayer('camera', { cameraLocked: false });
        expect(
            fixture.nativeElement.querySelector(
                '.camera-lock-button .pi-lock-open'
            )
        ).toBeTruthy();
    });
});
