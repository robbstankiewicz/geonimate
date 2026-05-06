import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
} from '@angular/core';
import { Rgb, toHex } from '@geonimate/shared-utils';
import { timelineStore } from '../../core/store/timeline.store';
import { TimelineService } from '../../core/services/timeline.service';
import { KeyframeId } from '@geonimate/shared-utils';
import { Keyframe } from '../keyframe/keyframe';
import { TrackKeyframeModel } from '../../core/models/track-keyframe';

@Component({
    selector: 'lib-track',
    templateUrl: './track.html',
    styleUrl: './track.scss',
    imports: [Keyframe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.padding]': 'hostPadding()',
        '[class.active]': 'active()',
    },
})
export class Track {
    color = input.required<Rgb>();
    stepsCount = input.required<number>();
    trackPaddingPx = input.required<number>();
    snappingOn = input.required<boolean>();
    keyframes = input.required<TrackKeyframeModel[]>();
    widthPx = input.required<number>();
    timeMs = input.required<number>();
    active = input(false);
    keyframeClick = output<{ event: MouseEvent; keyframeId: KeyframeId }>();
    private activeColor = computed(() =>
        this.active() ? 'var(--p-surface-800)' : 'var(--p-surface-900)'
    );
    protected store = inject(timelineStore);
    protected timelineService = inject(TimelineService);
    protected stackedKeyframesPx = computed(() => {
        const keyframes = this.keyframes();
        const keysMap = new Map<number, number>();
        for (const kf of keyframes) {
            const count = keysMap.get(kf.timeMs) ?? 0;
            keysMap.set(kf.timeMs, count + 1);
        }
        return Array.from(keysMap.entries())
            .filter(([, count]) => count > 1)
            .map(([time]) => `${(time / this.timeMs()) * this.widthPx()}`);
    });
    protected hexColor = computed(() => toHex(this.color()));
    protected hostPadding = computed(() => `0 ${this.trackPaddingPx()}px`);
    readonly background = computed(
        () =>
            `linear-gradient( 0deg, ${this.activeColor()}, ${this.activeColor()} 45%, transparent 45%, transparent 55%, ${this.activeColor()} 55%, ${this.activeColor()} 100%), repeating-linear-gradient( 90deg, var(--p-surface-600), var(--p-surface-600) 2px, transparent 2px, transparent ${(1 / this.stepsCount()) * 100
            }% )`
    );
}
