import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    OnInit,
    signal,
    viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from '@geonimate/map';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import {
    ManagerService,
    StatePersistenceService,
} from '@geonimate/shared-manager';
import { LayerId, StaticPosition } from '@geonimate/shared-utils';
import { timelineStore, Timescale } from '@geonimate/timeline';
import { APP_OPTIONS } from '@geonimate/shared-core';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    fromEvent,
    map,
    merge,
    Observable,
    startWith,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DEMO_REGISTRY } from '@geonimate/demos';

function resolveDemoFileUrl(file: string): string {
    if (
        file.startsWith('http://') ||
        file.startsWith('https://') ||
        file.startsWith('blob:') ||
        file.startsWith('data:')
    ) {
        return file;
    }
    return new URL(file, document.baseURI).href;
}

@Component({
    selector: 'lib-player-app',
    templateUrl: './player-app.component.html',
    styleUrl: './player-app.component.scss',
    imports: [CommonModule, MapComponent, ButtonModule, ToastModule, Timescale],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerAppComponent implements OnInit {
    private replayFileInput =
        viewChild<ElementRef<HTMLInputElement>>('replayFileInput');
    private dockMeasure = viewChild<ElementRef>('bottomDockMeasure');
    private route = inject(ActivatedRoute);
    private demos = inject(DEMO_REGISTRY);

    protected readonly appOpts = inject(APP_OPTIONS);
    protected timelineStore = inject(timelineStore);
    protected manager = inject(ManagerService);
    protected persistence = inject(StatePersistenceService);

    protected toolbarPinned = signal(true);
    protected toolbarHovered = signal(false);
    timelineWidthChange$!: Observable<number>;

    protected holdingSnapKey$ = merge(
        fromEvent<KeyboardEvent>(document, 'keydown').pipe(
            filter(event => event.key === 'Shift'),
            map(() => true)
        ),
        fromEvent<KeyboardEvent>(document, 'keyup').pipe(
            filter(event => event.key === 'Shift'),
            map(() => false)
        )
    );

    constructor() {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed())
            .subscribe(params => {
                const id = params.get('demo');
                if (!id) {
                    return;
                }
                const meta = this.demos.find(d => d.id === id);
                if (!meta) {
                    return;
                }
                this.persistence.applyFromUrl(resolveDemoFileUrl(meta.file));
            });
    }

    onPositionChange(event: { layerId: LayerId; position: StaticPosition }) {
        this.manager.updateStaticPosition(event.layerId, event.position);
    }

    onImportReplayClick() {
        this.replayFileInput()?.nativeElement.click();
    }

    onReplayFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.persistence.importFromFile(file);
        }
        input.value = '';
    }

    protected onBottomDockEnter(): void {
        if (!this.toolbarPinned()) {
            this.toolbarHovered.set(true);
        }
    }

    protected onBottomDockLeave(): void {
        if (!this.toolbarPinned()) {
            this.toolbarHovered.set(false);
        }
    }
    protected toggleToolbarPinned(): void {
        this.toolbarPinned.update(v => !v);
    }
    getTimelineWidth(): number {
        const el = this.dockMeasure()?.nativeElement;
        if (!el) {
            return 0;
        }
        return el.offsetWidth - this.appOpts.trackPaddingPx * 2
    }
    ngOnInit(): void {
        this.timelineWidthChange$ = fromEvent(window, 'resize').pipe(
            debounceTime(100),
            map(() => this.getTimelineWidth()),
            startWith(this.getTimelineWidth()),
            distinctUntilChanged()
        );
    }
}
