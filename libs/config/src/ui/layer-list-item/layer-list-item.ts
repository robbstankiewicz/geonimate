import {
    Component,
    ElementRef,
    inject,
    input,
    OnInit,
    viewChild,
    DestroyRef,
    output,
    effect,
    ChangeDetectionStrategy,
    computed,
} from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { LAYER_TYPE_METADATA, Layer } from '../../models';
import { toHex } from '@geonimate/shared-utils';

@Component({
    selector: 'lib-layer-list-item',
    styleUrls: ['./layer-list-item.scss'],
    templateUrl: './layer-list-item.html',
    imports: [
        ReactiveFormsModule,
        InputTextModule,
        CommonModule,
        FormsModule,
        DragDropModule,
    ],
    hostDirectives: [CdkDrag],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerListItem implements OnInit {
    readonly formBuilder = inject(FormBuilder);
    readonly destroyRef = inject(DestroyRef);
    elementRef = inject(ElementRef);
    cdkDrag = inject(CdkDrag);

    layer = input.required<Layer>();
    isEditable = input<boolean>(true);

    layerChange = output<Partial<Layer>>();
    addKeyframe = output<void>();
    settingsClick = output<MouseEvent>();
    protected hexColor = computed(() => toHex(this.layer().timelineColor));
    protected isCameraKeyframeLocked = computed(() => {
        const l = this.layer();
        return l.type === 'camera' && l.cameraLocked === true;
    });
    private inputEl = viewChild.required<ElementRef>('input');

    protected form!: FormGroup;

    get nameControl(): FormControl {
        return this.form.get('name') as FormControl;
    }

    protected getIcon(): string {
        return LAYER_TYPE_METADATA[this.layer().type]?.icon ?? 'pi-question';
    }

    protected toggleDisplay() {
        const current = this.layer().display !== false;
        this.layerChange.emit({ display: !current });
    }

    protected toggleCameraLock() {
        const l = this.layer();
        if (l.type !== 'camera') {
            return;
        }
        const current = l.cameraLocked === true;
        this.layerChange.emit({ cameraLocked: !current });
    }

    protected nameFocus() {
        if (!this.isEditable()) return;
        this.cdkDrag.disabled = true;
        this.nameControl.enable();
        this.inputEl().nativeElement.focus();
    }

    protected nameBlur() {
        this.nameControl.disable();
        this.cdkDrag.disabled = false;
        let name = this.nameControl.value;
        name = name.trim();
        if (name === this.layer().name && name !== '') {
            return;
        }
        this.layerChange.emit({ name });
    }
    lockDrag() {
        this.cdkDrag.disabled = true;
    }
    unlockDrag() {
        this.cdkDrag.disabled = false;
    }
    constructor() {
        effect(() => {
            const layer = this.layer();
            if (this.form) {
                this.form.patchValue(layer, { emitEvent: false });
            }
            this.cdkDrag.disabled = !this.isEditable();
        });
    }
    ngOnInit(): void {
        this.cdkDrag.disabled = !this.isEditable();
        const layer = this.layer();
        this.form = this.formBuilder.nonNullable.group({
            name: [{ value: layer.name, disabled: true }],
        });

        if (!layer.name) {
            this.nameFocus();
        }
    }
}
