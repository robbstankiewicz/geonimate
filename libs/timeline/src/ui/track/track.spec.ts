import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorService } from '@geonimate/shared-core';
import { Track } from './track';
import { timelineStore } from '../../core/store/timeline.store';
import { TimelineService } from '../../core/services/timeline.service';
import { By } from '@angular/platform-browser';

describe('track', () => {
    let fixture: ComponentFixture<Track>;
    let component: Track;
    beforeEach(async () => {
        const testbed = TestBed.configureTestingModule({
            providers: [
                timelineStore,
                TimelineService,
                {
                    provide: ErrorService,
                    useValue: {
                        showError: jest.fn(),
                        showWarning: jest.fn(),
                    },
                },
            ],
            imports: [Track],
        });
        fixture = testbed.createComponent(Track);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('color', { r: 0, g: 0, b: 0 });
        fixture.componentRef.setInput('stepsCount', 10);
        fixture.componentRef.setInput('trackPaddingPx', 5);
        fixture.componentRef.setInput('snappingOn', false);
        fixture.componentRef.setInput('keyframes', []);
        fixture.componentRef.setInput('widthPx', 2000);
        fixture.componentRef.setInput('timeMs', 1000);
        await fixture.whenStable();
    });
    it('should init', () => {
        expect(component).toBeDefined();
    });
    it('should calculate stacked keyframes', async () => {
        let keyframes = [
            { id: 'kf1', timeMs: 1000, draggable: true },
            { id: 'kf2', timeMs: 1000, draggable: true },
            { id: 'kf3', timeMs: 2000, draggable: true },
        ];
        fixture.componentRef.setInput('keyframes', keyframes);
        await fixture.whenStable();
        expect(fixture.debugElement.queryAll(By.css('.stacked'))).toHaveLength(
            1
        );
        keyframes = [
            { id: 'kf1', timeMs: 1000, draggable: true },
            { id: 'kf2', timeMs: 1000, draggable: true },
            { id: 'kf3', timeMs: 2000, draggable: true },
            { id: 'kf4', timeMs: 2000, draggable: true },
        ];
        fixture.componentRef.setInput('keyframes', keyframes);
        await fixture.whenStable();
        expect(fixture.debugElement.queryAll(By.css('.stacked'))).toHaveLength(
            2
        );
    });
});
