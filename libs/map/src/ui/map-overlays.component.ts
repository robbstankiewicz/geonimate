import {
    Component,
    inject,
    computed,
    ChangeDetectionStrategy,
    output,
    ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { mapStore, MapLayer } from '../core/store/map.store';
import { StaticElementComponent } from './static-element/static-element.component';
import {
    DateLayer,
    LayerId,
    NumberLayer,
    StaticPosition,
    TextLayer,
} from '@geonimate/shared-utils';

@Component({
    selector: 'lib-map-overlays',
    standalone: true,
    imports: [CommonModule, StaticElementComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="static-overlay-container">
            @for (mapLayer of staticLayers(); track mapLayer.id) {
                <lib-static-element
                    [mapLayer]="mapLayer"
                    (dragEnd)="onDragEnd($event)"
                    [container]="elementRef.nativeElement">
                </lib-static-element>
            }
        </div>
    `,
    styles: [
        `
            :host {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
            }
            .static-overlay-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
        `,
    ],
})
export class MapOverlaysComponent {
    store = inject(mapStore);
    positionChange = output<{ layerId: LayerId; position: StaticPosition }>();
    elementRef = inject(ElementRef);
    staticLayers = computed(() => {
        return this.store
            .layersEntities()
            .filter(
                (
                    mapLayer
                ): mapLayer is MapLayer<
                    TextLayer | NumberLayer | DateLayer
                > => {
                    const config = mapLayer.config;
                    return (
                        config.display &&
                        (config.type === 'text' ||
                            config.type === 'number' ||
                            config.type === 'date') &&
                        config.placement === 'static'
                    );
                }
            );
    });

    onDragEnd(event: { layerId: LayerId; position: StaticPosition }) {
        this.positionChange.emit(event);
    }
}
