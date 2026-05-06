import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
    selector: 'lib-vector2-control',
    standalone: true,
    imports: [FormsModule, InputNumberModule, InputGroupModule, InputGroupAddonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div style="display: flex; gap: .5rem; width: 100%; flex-direction: column;">
            <p-inputgroup>
                <p-inputgroup-addon>x</p-inputgroup-addon>
                <p-inputNumber
                    [ngModel]="value()?.[0]"
                    (ngModelChange)="onXChange($event)"
                    mode="decimal"
                    [minFractionDigits]="0"
                    [maxFractionDigits]="3"
                    [useGrouping]="false"
                    style="w-full"
                    class="vector-input">
                </p-inputNumber>
            </p-inputgroup>
            <p-inputgroup>
                <p-inputgroup-addon>y</p-inputgroup-addon>
                <p-inputNumber
                    [ngModel]="value()?.[1]"
                    (ngModelChange)="onYChange($event)"
                    mode="decimal"
                    [minFractionDigits]="0"
                    [maxFractionDigits]="3"
                    [useGrouping]="false"
                    style="w-full"
                    class="vector-input">
                </p-inputNumber>
            </p-inputgroup>
        </div>
    `,
    styles: [
        `
            :host {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
        `,
    ],
})
export class Vector2ControlComponent {
    value = input<[number, number]>();
    isActive = input<boolean>(true);
    onValueChange = input.required<(val: [number, number]) => void>();

    // get xValue() {
    //     return this.value() ? this.value()![0] : 0;
    // }
    //
    // get yValue() {
    //     return this.value() ? this.value()![1] : 0;
    // }
    //
    onXChange(newX: number) {
        this.onValueChange()([newX || 0, this.value()?.[1] || 0]);
    }

    onYChange(newY: number) {
        this.onValueChange()([this.value()?.[0] || 0, newY || 0]);
    }
}
