import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    Injector,
    OnInit,
    signal,
    viewChild,
} from '@angular/core';
import { Splitter, SplitterModule } from 'primeng/splitter';
import { InputGroupModule } from 'primeng/inputgroup';
import { MapComponent } from '@geonimate/map';
import { Timeline } from '@geonimate/timeline';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    fromEvent,
    interval,
    map,
    merge,
    Observable,
    switchMap,
    takeUntil,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { APP_OPTIONS } from '@geonimate/shared-core';
import { ToastModule } from 'primeng/toast';
import {
    Config,
    configStore,
    KeyframePropertiesPopup,
    LAYER_TYPE_METADATA,
    PROPERTY_REGISTRY,
} from '@geonimate/config';
import {
    ManagerService,
    StatePersistenceService,
} from '@geonimate/shared-manager';
import { SettingsDialogComponent } from '@geonimate/settings';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { LayerType, LayerId, StaticPosition } from '@geonimate/shared-utils';
import { DEMO_REGISTRY } from '@geonimate/demos';

const PROPERTY_MODE_OPTIONS = [
    { label: 'All properties', value: 'all' },
    ...Object.values(PROPERTY_REGISTRY)
        .filter(p => p.id !== 'center' && p.id !== 'zoom')
        .map(p => ({
            label: p.label,
            value: p.id,
        })),
];

const LAYER_TYPE_OPTIONS = Object.values(LAYER_TYPE_METADATA)
    .filter(l => l.type !== 'camera')
    .map(l => ({
        label: l.label,
        value: l.type,
        icon: 'pi ' + l.icon,
    }));

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
    selector: 'lib-design-app',
    templateUrl: './design-app.component.html',
    styleUrl: './design-app.component.scss',
    imports: [
        SplitterModule,
        MapComponent,
        Timeline,
        CommonModule,
        SettingsDialogComponent,
        ToastModule,
        Config,
        ButtonModule,
        SelectModule,
        FormsModule,
        KeyframePropertiesPopup,
        InputGroupModule,
    ],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignAppComponent implements OnInit {
    private splitter = viewChild<Splitter>('configSplitter');
    private timelineContainer = viewChild<ElementRef>('timelineContainer');
    private replayFileInput = viewChild<ElementRef<HTMLInputElement>>(
        'replayFileInput'
    );
    private injector = inject(Injector);
    private route = inject(ActivatedRoute);
    private demos = inject(DEMO_REGISTRY);

    protected manager = inject(ManagerService);
    protected persistence = inject(StatePersistenceService);
    protected config = inject(configStore);

    protected propertyModes = PROPERTY_MODE_OPTIONS;

    protected layerOptions = LAYER_TYPE_OPTIONS;

    protected selectedLayerType = signal<LayerType>('shape');
    protected showSettingsDialog = signal(false);

    appOptions = inject(APP_OPTIONS);
    timelineWidthChange$!: Observable<number>;

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

    onExportReplay() {
        this.persistence.downloadJson();
    }

    onImportReplayClick() {
        this.replayFileInput()?.nativeElement.click();
    }

    onReplayFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            void this.persistence.importFromFile(file);
        }
        input.value = '';
    }

    ngOnInit(): void {
        const splitter$ = toObservable(this.splitter, {
            injector: this.injector,
        }).pipe(filter(Boolean));

        const splitterResizeEvent$ = splitter$.pipe(
            switchMap(splitter =>
                splitter.onResizeStart.pipe(
                    switchMap(() =>
                        interval(150).pipe(takeUntil(splitter.onResizeEnd))
                    )
                )
            )
        );

        const resizeEvents = [
            splitterResizeEvent$,
            fromEvent(window, 'resize'),
            toObservable(this.timelineContainer, {
                injector: this.injector,
            }),
        ];

        this.timelineWidthChange$ = merge(...resizeEvents).pipe(
            debounceTime(100),
            map(() => this.timelineContainer()?.nativeElement.offsetWidth),
            distinctUntilChanged()
        );
    }
}
