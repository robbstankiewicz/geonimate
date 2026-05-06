import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';
import { Draggable } from '../../core/base/draggable.base';

@Component({
    selector: 'lib-playhead',
    imports: [],
    templateUrl: './playhead.html',
    styleUrl: './playhead.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Playhead extends Draggable {
    constructor() {
        super();
    }
}
