import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
    selector: 'lib-number-control',
    standalone: true,
    imports: [FormsModule, InputNumberModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-inputNumber
            [ngModel]="value()"
            (ngModelChange)="onValueChange()($event)"
            mode="decimal"
            [showButtons]="true"
            [inputSize]="6"
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
        `,
    ],
})
export class NumberControlComponent {
    value = input<number>();
    isActive = input<boolean>(true);
    onValueChange = input.required<(val: number) => void>();
}
