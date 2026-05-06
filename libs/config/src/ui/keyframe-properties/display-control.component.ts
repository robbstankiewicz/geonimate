import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'lib-display-control',
    standalone: true,
    imports: [FormsModule, CheckboxModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-checkbox
            [ngModel]="value()"
            [binary]="true"
            (ngModelChange)="onValueChange()($event)">
        </p-checkbox>
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
export class DisplayControlComponent {
    value = input<boolean>();
    isActive = input<boolean>(true);
    onValueChange = input.required<(val: boolean) => void>();
}
