import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timescale } from './timescale';
import { SCALE_CONFIG } from '../../core/providers/scale-config.provider';
describe('Timescale', () => {
    let component: Timescale;
    let fixture: ComponentFixture<Timescale>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Timescale],
            providers: [
                {
                    provide: SCALE_CONFIG,
                    useValue: {
                        minimumSpaceForTickPx: 1000,
                        denominatorValuesMs: [1000, 2000, 2500, 5000],
                    },
                },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(Timescale);
        fixture.componentRef.setInput('fps', 1);
        fixture.componentRef.setInput('timeMs', 10000);
        fixture.componentRef.setInput('trackPaddingPx', 0);
        fixture.componentRef.setInput('widthPx', 10000);
        fixture.componentRef.setInput('snappingOn', true);
        fixture.componentRef.setInput('playheadPositionMs', 0);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should calculate ticks', () => {
        expect(component.stepsCount()).toBe(10);
        expect(component.ticks().length).toBe(11);
        // 10 seconds, 10fps = 1 tick per second
        expect(component.ticks()[component.ticks().length - 1].label).toBe(10);
    });
    it('should limit ticks based on width', () => {
        // hide half of the ticks - 900px is not enough for 10 ticks with 1000px minimum space
        fixture.componentRef.setInput('widthPx', 9000);
        expect(component.ticks().filter(t => t.label !== null).length).toBe(6);
        for (let i = 0; i < component.ticks().length; i++) {
            if (i & 1) {
                expect(component.ticks()[i].label).toBeNull();
            } else {
                expect(component.ticks()[i].label).toBe(i);
        }
        }
        fixture.componentRef.setInput('widthPx', 2000);
        expect(component.ticks().filter(t => t.label !== null).length).toBe(3);
        // only first and last tick
        fixture.componentRef.setInput('widthPx', 100);
        expect(component.ticks().filter(t => t.label !== null).length).toBe(2);
    });
});
