import { Component } from '@angular/core';
import { Draggable } from './draggable.base';
import { ComponentFixture, TestBed } from '@angular/core/testing';
@Component({})
class DraggableComponent extends Draggable {}

describe('DraggableBase', () => {
    let component: DraggableComponent;
    let fixture: ComponentFixture<DraggableComponent>;
    beforeEach(() => {
        fixture = TestBed.createComponent(DraggableComponent);
        fixture.componentRef.setInput('trackWidthPx', 10000);
        fixture.componentRef.setInput('stepsCount', 50);
        fixture.componentRef.setInput('positionMs', 0);
        fixture.componentRef.setInput('snappingOn', false);
        fixture.componentRef.setInput('maxMs', 10000);
        fixture.componentRef.setInput('snapPointsMs', []);
        fixture.componentRef.setInput('snapThresholdPx', 20);
        component = fixture.componentInstance;
    });
    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.detectChanges();
    });
    it('should snap to grid', () => {
        fixture.componentRef.setInput('snappingOn', true);
        fixture.detectChanges();
        const snap = component.constrainFn();
        const userPointerPosition = { x: 210, y: 0 };
        const initialPosition = new DOMRect(0, 0, 10, 10);
        const dragRef: any = null;
        const result = snap(userPointerPosition, dragRef, initialPosition);
        expect(result.x).toBe(200);
    });
    it('should NOT snap if snappingOn is false', () => {
        fixture.componentRef.setInput('snappingOn', false);
        fixture.componentRef.setInput('snapPointsMs', [500]);
        fixture.detectChanges();

        const snap = component.constrainFn();
        const initialPosition = new DOMRect(0, 0, 10, 10);
        const dragRef: any = null;

        const userPointerPosition = { x: 505, y: 0 };
        const result = snap(userPointerPosition, dragRef, initialPosition);
        expect(result.x).toBe(505);
    })
    it('should change X on position input change', () => {
        fixture.componentRef.setInput('positionMs', 1000);
        fixture.detectChanges();
        expect(component['cdkDrag'].getFreeDragPosition().x).toBe(1000);
        fixture.componentRef.setInput('positionMs', 2000);
        fixture.detectChanges();
        expect(component['cdkDrag'].getFreeDragPosition().x).toBe(2000);
    });
    it('should NOT change X on position input change when dragging', () => {
        expect(component.isDragging()).toBe(false);
        component['cdkDrag'].started.emit({} as any);
        fixture.componentRef.setInput('positionMs', 1000);
        expect(component.isDragging()).toBe(true);
        expect(component['cdkDrag'].getFreeDragPosition().x).toBe(0);
        component['cdkDrag'].ended.emit({} as any);
        expect(component.isDragging()).toBe(false);
        fixture.componentRef.setInput('positionMs', 1000);
        fixture.detectChanges();
        expect(component['cdkDrag'].getFreeDragPosition().x).toBe(1000);
    });

    it('should snap to custom snap points within threshold', () => {
        fixture.componentRef.setInput('snappingOn', true);
        fixture.componentRef.setInput('snapPointsMs', [500]);
        fixture.componentRef.setInput('snapThresholdPx', 20);
        fixture.detectChanges();

        const snap = component.constrainFn();
        const initialPosition = new DOMRect(0, 0, 10, 10);
        const dragRef: any = null;

        const userPointerPosition = { x: 505, y: 0 };
        const result = snap(userPointerPosition, dragRef, initialPosition);
        expect(result.x).toBe(500);
    });

    it('should NOT snap to custom snap points outside threshold', () => {
        fixture.componentRef.setInput('snappingOn', true);
        fixture.componentRef.setInput('snapPointsMs', [500]);
        fixture.componentRef.setInput('snapThresholdPx', 10);
        fixture.detectChanges();

        const snap = component.constrainFn();
        const initialPosition = new DOMRect(0, 0, 10, 10);
        const dragRef: any = null;

        const userPointerPosition = { x: 515, y: 0 };
        const result = snap(userPointerPosition, dragRef, initialPosition);
        expect(result.x).toBe(515);
    });

    ;
});
