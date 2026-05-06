import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { Rgb } from '@geonimate/shared-utils';

const FALLBACK: Rgb = { r: 128, g: 128, b: 128 };

@Component({
    selector: 'lib-rgb-control',
    standalone: true,
    imports: [FormsModule, ColorPickerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-colorPicker
            [ngModel]="display()"
            (ngModelChange)="onPick($event)"
            format="rgb"
            [autoZIndex]="true"
            appendTo="body">
        </p-colorPicker>
    `,
    styles: [
        `
            :host {
                display: flex;
                align-items: center;
                width: 100%;
                justify-content: flex-end;
            }
        `,
    ],
})
export class RgbControlComponent {
    value = input<Rgb | null | undefined>();
    isActive = input<boolean>(true);
    onValueChange = input.required<(val: Rgb) => void>();

    display = computed(() => this.value() ?? FALLBACK);

    onPick(v: Rgb) {
        this.onValueChange()(v);
    }
}
