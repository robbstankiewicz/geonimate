import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SliderModule } from 'primeng/slider';

@Component({
    selector: 'lib-zoom-control',
    standalone: true,
    imports: [FormsModule, InputNumberModule, SliderModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-slider
            [ngModel]="value()"
            [min]="0"
            [max]="28"
            [step]="0.1"
            (ngModelChange)="onModelChange($event)"
        >
        </p-slider>
        <p-inputNumber
            [ngModel]="value()"
            (ngModelChange)="onModelChange($event)"
            mode="decimal"
            [min]="0"
            [max]="28"
            [minFractionDigits]="0"
            [maxFractionDigits]="2"
            [showButtons]="true"
            [inputSize]="1"
        >
        </p-inputNumber>
    `,
    styles: [
        `
            :host {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
            }
            p-slider {
                flex: 1;
            }
        `,
    ],
})
export class ZoomControlComponent {
    value = input<number>();
    isActive = input<boolean>(true);
    onValueChange = input<(val: number) => void>();

    onModelChange(newVal: number) {
        const callback = this.onValueChange();
        if (callback) callback(newVal);
    }
}
