import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Keyframe } from './keyframe';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { timelineStore } from '../../core/store/timeline.store';

describe('Keyframe', () => {
    let component: Keyframe;
    let fixture: ComponentFixture<Keyframe>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [Keyframe],
            providers: [timelineStore],
        }).compileComponents();
        fixture = TestBed.createComponent(Keyframe);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('color', '#000000');

        fixture.componentRef.setInput('trackWidthPx', 1000);
        fixture.componentRef.setInput('stepsCount', 10);
        fixture.componentRef.setInput('positionMs', 0);
        fixture.componentRef.setInput('snappingOn', false);
        fixture.componentRef.setInput('maxMs', 10000);

        fixture.detectChanges();
    });
    
    it('should emit propertiesClick on click', () => {
        jest.spyOn(component.propertiesClick, 'emit');
        fixture.nativeElement.dispatchEvent(new MouseEvent('click'));
        expect(component.propertiesClick.emit).toHaveBeenCalled();
    });
});
