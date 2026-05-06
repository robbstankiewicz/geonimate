import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Draggable } from '../../core/base/draggable.base';
import { CommonModule } from '@angular/common';
@Component({
    selector: 'lib-keyframe',
    imports: [
        CommonModule,
    ],
    templateUrl: './keyframe.html',
    styleUrl: './keyframe.scss',
    host: {
        '(click)': 'onHostClick($event)',
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Keyframe extends Draggable {
    color = input.required<string>();

    propertiesClick = output<MouseEvent>();

    onHostClick(event: MouseEvent) {
        event.stopPropagation();
        this.propertiesClick.emit(event);
    }
}
