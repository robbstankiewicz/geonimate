import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
} from '@angular/core';
import { LayerId, KeyframeId} from '@geonimate/shared-utils';
import { Timescale } from './ui/timescale/timescale';
import { filter, fromEvent, map, merge } from 'rxjs';
import { CommonModule } from '@angular/common';
import { timelineStore } from './core/store/timeline.store';

import { Track } from './ui/track/track';
import { LayerListScroll } from '@geonimate/shared-utils';
import { TrackModel } from './core/models/track';

@Component({
    selector: 'lib-timeline',
    templateUrl: './timeline.html',
    styleUrl: './timeline.scss',
    imports: [Timescale, CommonModule, Track, LayerListScroll],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.width]': 'hostWidthPx() + "px"',
    },
})
export class Timeline {
    trackPaddingPx = input.required<number>();
    containerWidth = input.required<number>();
    snapKey = input<string>('Shift');
    activeTrackId = input<LayerId | null>(null);
    // keyframeStates = input<Record<string, KeyframeState>>({});
    keyframeClick = output<{ event: MouseEvent; keyframeId: KeyframeId }>();
    tracks = input.required<TrackModel[]>()

    protected store = inject(timelineStore);
    protected stepsCount = computed(
        () => (this.store.options.timeMs() / 1000) * this.store.options.fps()
    );
    protected hostWidthPx = computed(
        () => this.store.scale() * this.containerWidth()
    );
    protected childrenWidthPx = computed(
        () => this.hostWidthPx() - this.trackPaddingPx() * 2
    );
    protected holdingSnapKey$ = merge(
        fromEvent<KeyboardEvent>(document, 'keydown').pipe(
            filter(event => event.key === this.snapKey()),
            map(() => true)
        ),
        fromEvent<KeyboardEvent>(document, 'keyup').pipe(
            filter(event => event.key === this.snapKey()),
            map(() => false)
        )
    );
}
