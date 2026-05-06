import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'lib-date-control',
    standalone: true,
    imports: [FormsModule, DatePickerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-datepicker
            [ngModel]="dateValue()"
            (ngModelChange)="onModelChange($event)"
            dateFormat="yy-mm-dd"
            [showTime]="true"
            appendTo="body"
            class="w-full">
        </p-datepicker>
    `,
    styles: [
        `
            :host {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
            }
        `,
    ],
})
export class DateControlComponent {
    value = input<string>();
    isActive = input<boolean>(true);
    onValueChange = input.required<(val: string) => void>();

    dateValue = computed(() => {
        const val = this.value();
        if (!val) return;
        return this.value() ? new Date(val) : null;
    });

    onModelChange(newVal: Date) {
        const callback = this.onValueChange();
        if (newVal) callback(newVal.toISOString());
    }
}
