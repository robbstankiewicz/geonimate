import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    input,
    OnDestroy,
    OnInit,
    output,
    viewChild,
} from '@angular/core';
import { mapStore } from './core/store/map.store';
import { MapOverlaysComponent } from './ui/map-overlays.component';
import { LayerId, StaticPosition } from '@geonimate/shared-utils';

@Component({
    selector: 'lib-map',
    imports: [MapOverlaysComponent],
    templateUrl: './map.html',
    styleUrl: './map.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnDestroy {
    showControls = input(true);
    mapElement = viewChild.required<ElementRef<HTMLElement>>('map');
    store = inject(mapStore);
    positionChange = output<{ layerId: LayerId; position: StaticPosition }>();

    ngOnInit(): void {
        this.store.setMapElement(this.mapElement().nativeElement);
    }

    ngOnDestroy(): void {
        this.store.detachMapFromView();
    }
}
