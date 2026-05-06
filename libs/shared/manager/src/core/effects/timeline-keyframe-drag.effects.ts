import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeyframeId } from '@geonimate/shared-utils';
import { TimelineService } from '@geonimate/timeline';
import { ManagerService } from '../services/manager.service';

@Injectable()
export class TimelineKeyframeDragEffects {
    private timeline = inject(TimelineService);
    private manager = inject(ManagerService);

    constructor() {
        this.timeline.keyframeDragStarted$
            .pipe(takeUntilDestroyed())
            .subscribe(({ keyframeId, altKey }) => {
                if (altKey) {
                    this.manager.copyKeyframeProperty(keyframeId);
                } else {
                    this.manager.splitKeyframeIfNeeded(keyframeId);
                }
            });

        this.timeline.keyframeDragEnded$
            .pipe(takeUntilDestroyed())
            .subscribe((id: KeyframeId) =>
                this.manager.mergeKeyframeIfNeeded(id)
            );
    }
}
