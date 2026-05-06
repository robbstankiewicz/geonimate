import { Component, effect, input } from '@angular/core';
import { getUid, Map as OlMap, View } from 'ol';
import { Layer } from '@geonimate/shared-utils';
import Draw from 'ol/interaction/Draw';

@Component({
    selector: 'lib-controls',
    templateUrl: './controls.html',
    styleUrl: './controls.scss',
})
export class Controls {
    map = input.required<OlMap>();
    drawIteraction?: Draw;
    constructor() {
        // effect(() => {
        //     if (this.drawIteraction) {
        //         this.map().removeInteraction(this.drawIteraction);
        //     }
        //     const layer = this.currentLayer()!;
        //     const source = layer.value.getSource()!;
        //     this.drawIteraction = new Draw({
        //         type: 'Polygon',
        //         source
        //     })
        // })
    }
}
