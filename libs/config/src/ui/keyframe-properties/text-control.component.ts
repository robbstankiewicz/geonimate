import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'lib-text-control',
    standalone: true,
    imports: [FormsModule, InputTextModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <input
            pInputText
            [ngModel]="value()"
            (ngModelChange)="onModelChange($event)"
            class="w-full" />
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
export class TextControlComponent {
    value = input<string>();
    isActive = input<boolean>(true);
    onValueChange = input<(val: string) => void>();

    onModelChange(newVal: string) {
        const callback = this.onValueChange();
        if (callback) callback(newVal);
    }
}
