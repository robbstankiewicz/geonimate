import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayerListScroll } from './layer-list-scroll';
import { By } from '@angular/platform-browser';
@Component({
    template: `<div
            layerListScroll
            style="height: 120px; overflow: auto;"></div>
        <div layerListScroll style="height: 110px; overflow: auto;"></div>
        <div layerListScroll style="height: 100px; overflow: auto;"></div>`,
    imports: [LayerListScroll],
    providers: [
    ],
})
class ScrollComponent { }

describe('Layer List Scroll', () => {
    let fixture: ComponentFixture<ScrollComponent>;
    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [ScrollComponent],
        });
        fixture = TestBed.createComponent(ScrollComponent);
    });
    it('should add padding if height is different', () => {
        const elements = fixture.debugElement.queryAll(By.directive(LayerListScroll));
        const divs = elements.map(el => el.nativeElement as HTMLElement);

        Object.defineProperty(divs[0], 'offsetHeight', { get: () => 110, configurable: true });
        Object.defineProperty(divs[1], 'offsetHeight', { get: () => 120, configurable: true });
        Object.defineProperty(divs[2], 'offsetHeight', { get: () => 100, configurable: true });

        fixture.detectChanges();
        const basePadding = LayerListScroll.BASE_PADDING
        expect(divs[0].style.paddingBottom).toBe(`${basePadding + 10}px`);
        expect(divs[1].style.paddingBottom).toBe(`${basePadding + 20}px`);
        expect(divs[2].style.paddingBottom).toBe(`${basePadding}px`);
    });
});
