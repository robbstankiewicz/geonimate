import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { provideManager } from '@geonimate/shared-manager';
import { MessageService } from 'primeng/api';
import { ErrorService } from '@geonimate/shared-core';
describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [
                provideManager(),
                MessageService,
                ErrorService,
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParamMap: of(convertToParamMap({})),
                    },
                },
            ],
        }).compileComponents();
    });
    it('should create', () => {
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();
        expect(fixture.componentInstance).toBeTruthy();
    });
});
