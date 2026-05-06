import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'lib-shape-control',
    standalone: true,
    template: `<div class="property-control empty-control"></div>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            .empty-control {
                height: 24px;
            }
        `,
    ],
})
export class ShapeControlComponent {
    value = input<unknown>();
    isActive = input<boolean>(true);
    onValueChange = input<(val: unknown) => void>();
}
