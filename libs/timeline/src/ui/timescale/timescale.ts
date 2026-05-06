import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    model,
    output,
} from '@angular/core';
import { Playhead } from '../playhead/playhead';
import { CommonModule } from '@angular/common';
import { SCALE_CONFIG } from '../../core/providers/scale-config.provider';

type Tick = {
    label: number | null;
    positionLeftPct: number;
};

@Component({
    selector: 'lib-timescale',
    imports: [Playhead, CommonModule],
    templateUrl: './timescale.html',
    styleUrl: './timescale.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.paddingLeft]': 'trackPaddingPx() + "px"',
        '[style.paddingRight]': 'trackPaddingPx() + "px"',
    }
})
export class Timescale {
    trackPaddingPx = input.required<number>();
    fps = input.required<number>();
    timeMs = input.required<number>();
    widthPx = input.required<number>();
    snappingOn = input.required<boolean>();
    playheadPositionMs = model.required<number>();
    snapPointsMs = input<number[]>([]);
    timescaleClick = output<number>();
    stepsCount = computed(() => (this.timeMs() / 1000) * this.fps());
    private scaleConfig = inject(SCALE_CONFIG);

    onTimescaleClick(event: Event) {
        // event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (event as MouseEvent).clientX - rect.left ;
        const width = this.widthPx();
        const time = Math.max(0, Math.min(this.timeMs(), (x / width) * this.timeMs()));
        this.timescaleClick.emit(time);
    }

    ticks = computed<Tick[]>(() => {
        const frameMs = 1000 / this.fps();
        const maxT =
            Math.round(
                this.widthPx() / this.scaleConfig.minimumSpaceForTickPx
            );
        const ticks: Tick[] = [
            {
                label: 0,
                positionLeftPct: 0,
            },
            {
                label: this.timeMs() / 1000,
                positionLeftPct: 100,
            },
        ];

        if (maxT - 1 <= 0) return ticks;

        let bestDenominator = this.timeMs();
        const highestDenominator =
            this.scaleConfig.denominatorValuesMs[
            this.scaleConfig.denominatorValuesMs.length - 1
            ];
        for (let i = frameMs; i <= highestDenominator; i += frameMs) {
            if (
                this.timeMs() % i === 0 &&
                this.timeMs() / i < maxT + 1 &&
                this.scaleConfig.denominatorValuesMs.includes(i)
            ) {
                bestDenominator = i;
                break;
            }
        }

        const ticksBetween = Array.from(
            { length: this.stepsCount() - 1 },
            (_, i) => {
                const tickValue = (i + 1) * frameMs;
                return {
                    label:
                        tickValue % bestDenominator === 0
                            ? tickValue / 1000
                            : null,
                    positionLeftPct: ((i + 1) / this.stepsCount()) * 100,
                };
            }
        );
        ticks.splice(1, 0, ...ticksBetween);

        return ticks;
    });
}
