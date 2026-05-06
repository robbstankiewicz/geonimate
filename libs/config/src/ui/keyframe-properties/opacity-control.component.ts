import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';

@Component({
    selector: 'lib-opacity-control',
    standalone: true,
    imports: [FormsModule, SliderModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-slider
            [ngModel]="value()"
            [min]="0"
            [max]="100"
            (ngModelChange)="onValueChange()($event)">
        </p-slider>
        <span class="opacity-value">{{ value() }}</span>
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
                flex-grow: 1;
            }
            .opacity-value {
                width: 32px;
                text-align: right;
                font-size: 0.875rem;
                color: var(--p-text-muted-color);
            }
        `,
    ],
})
export class OpacityControlComponent {
    value = input<number>();
    isActive = input<boolean>(true);
    onValueChange = input.required<(val: number) => void>();
}
