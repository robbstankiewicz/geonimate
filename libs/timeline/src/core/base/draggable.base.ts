import {
    computed,
    Directive,
    effect,
    inject,
    input,
    model,
    output,
    OnInit,
    untracked,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, merge } from 'rxjs';
import { CdkDrag, DragRef, Point } from '@angular/cdk/drag-drop';

@Directive({
    hostDirectives: [
        {
            directive: CdkDrag,
        },
    ],
})
export abstract class Draggable implements OnInit {
    protected cdkDrag = inject(CdkDrag);
    trackWidthPx = input.required<number>();
    stepsCount = input.required<number>();
    positionMs = model.required<number>();
    snappingOn = input.required<boolean>();
    maxMs = input.required<number>();
    snapPointsMs = input<number[]>([]);
    draggable = input<boolean>(true);

    dragStarted = output<{ altKey: boolean }>();
    dragEnded = output<void>();

    snapThresholdPx = input<number>(10);
    currentX = 0;
    isDragging = toSignal(
        merge(
            this.cdkDrag.started.pipe(map(() => true)),
            this.cdkDrag.ended.pipe(map(() => false))
        ),
        { initialValue: false }
    );

    constrainFn = () => {
        let cachedX = 0;
        let cachedInitialPosX = 0;
        let snapPointsMs = this.snapPointsMs();
        return (
            userPointerPosition: Point,
            _dragRef: DragRef<CdkDrag>,
            initialPosition: DOMRect
        ) => {
            if (cachedInitialPosX !== initialPosition.x) {
                cachedX = this.currentX;
                snapPointsMs = this.snapPointsMs();
            }
            cachedInitialPosX = initialPosition.x;

            let relativeX = cachedX + userPointerPosition.x - initialPosition.x;
            let absoluteX = userPointerPosition.x;

            if (relativeX < 0) {
                absoluteX -= relativeX;
                relativeX = 0;
            } else if (relativeX > this.trackWidthPx()) {
                absoluteX -= relativeX - this.trackWidthPx();
                relativeX = this.trackWidthPx();
            }

            if (this.snappingOn()) {
                let snappedMs: number | null = null;
                const threshold = this.snapThresholdPx();
                for (const pointMs of snapPointsMs) {
                    const pointPx =
                        (pointMs / this.maxMs()) * this.trackWidthPx();
                    if (Math.abs(pointPx - relativeX) < threshold) {
                        snappedMs = pointMs;
                        break;
                    }
                }

                if (snappedMs !== null) {
                    const snappedX =
                        (snappedMs / this.maxMs()) * this.trackWidthPx();
                    const deltaX = snappedX - relativeX;
                    absoluteX += deltaX;
                    relativeX = snappedX;
                } else {
                    const stepPx = this.trackWidthPx() / this.stepsCount();
                    const stepIndex = Math.round(relativeX / stepPx);
                    const snappedX = stepIndex * stepPx;
                    if (Math.abs(snappedX - relativeX) < threshold) {
                        const deltaX = snappedX - relativeX;
                        absoluteX += deltaX;
                        relativeX = snappedX;
                    }
                }
            }

            this.currentX = relativeX;
            this.positionMs.set(
                (relativeX / this.trackWidthPx()) * this.maxMs()
            );
            return {
                x: absoluteX,
                y: 0,
            };
        };
    };

    constructor() {
        effect(() => {
            const newPositionMs = this.positionMs();
            if (this.isDragging()) {
                return;
            }
            untracked(() => {
                this.currentX =
                    (newPositionMs / this.maxMs()) * this.trackWidthPx();
                this.cdkDrag.setFreeDragPosition({ x: this.currentX, y: 0 });
            });
        });
        effect(() => {
            const newMaxTimeMs = this.maxMs();
            const newWidth = this.trackWidthPx();
            untracked(() => {
                this.currentX = (this.positionMs() / newMaxTimeMs) * newWidth;
                this.cdkDrag.setFreeDragPosition({ x: this.currentX, y: 0 });
            });
        });
        effect(() => {
            if (!this.draggable()) {
                this.cdkDrag.disabled = true;
            } else {
                this.cdkDrag.disabled = false;
            }
        });

        this.cdkDrag.started.pipe(takeUntilDestroyed()).subscribe(event => {
            this.dragStarted.emit({
                altKey: (event.event as MouseEvent).altKey,
            });
            event.event.stopPropagation();
        });
        this.cdkDrag.ended.pipe(takeUntilDestroyed()).subscribe(event => {
            event.event.stopPropagation();
            this.dragEnded.emit();
        });
    }

    ngOnInit(): void {
        this.cdkDrag.lockAxis = 'x';
        this.cdkDrag.constrainPosition = this.constrainFn();
    }
}
