import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createLayer, generateId, LayerId } from '@geonimate/shared-utils';
import { DateSettings } from './date-settings';

describe('DateSettings', () => {
    let fixture: ComponentFixture<DateSettings>;

    function dateLayer(overrides: Record<string, unknown> = {}) {
        const id = generateId<LayerId>();
        return {
            ...createLayer('date', id, 'Date layer', {
                r: 200,
                g: 0,
                b: 0,
            }),
            ...overrides,
        };
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DateSettings],
        }).compileComponents();

        fixture = TestBed.createComponent(DateSettings);
    });

    it('getValues serializes default Date to ISO string', async () => {
        const d = new Date('2024-03-10T08:00:00.000Z');
        fixture.componentRef.setInput('layer', dateLayer({ defaultDate: d }));
        await fixture.whenStable();

        const values = fixture.componentInstance.getValues();
        expect(values.defaultDate).toBe(d.toISOString());
    });
});
