import {
    Component,
    input,
    inject,
    OnInit,
    ChangeDetectionStrategy,
    signal,
    DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NumberLayer } from '../../../models';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SettingsComponent } from '../settings-component.interface';
import { STATIC_TEXT_ALIGN_OPTIONS } from '../text-align-options';
import { APP_OPTIONS } from '@geonimate/shared-core';

@Component({
    selector: 'lib-number-settings',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ColorPickerModule,
        InputNumberModule,
        SelectModule,
        SelectButtonModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-3" [formGroup]="form">
            <div class="flex items-center justify-between">
                <span>Timeline color</span>
                <p-colorPicker
                    formControlName="timelineColor"
                    format="rgb"
                    [autoZIndex]="true"
                    appendTo="body">
                </p-colorPicker>
            </div>
            <div class="flex items-center justify-between">
                <span>Font color</span>
                <p-colorPicker
                    formControlName="fontColor"
                    format="rgb"
                    [autoZIndex]="true"
                    appendTo="body">
                </p-colorPicker>
            </div>
            <div class="flex flex-col gap-1">
                <label for="defaultNumber">Default Number</label>
                <p-inputNumber
                    id="defaultNumber"
                    formControlName="defaultNumber"
                    class="w-full">
                </p-inputNumber>
            </div>
            <div class="flex flex-col gap-1">
                <label for="decimals">Decimals</label>
                <p-inputNumber
                    id="decimals"
                    formControlName="decimals"
                    [min]="0"
                    [max]="10"
                    [showButtons]="true"
                    buttonLayout="horizontal"
                    spinnerMode="horizontal"
                    inputStyleClass="w-16"
                    decrementButtonClass="p-button-secondary"
                    incrementButtonClass="p-button-secondary"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus">
                </p-inputNumber>
            </div>
            <div class="flex flex-col gap-1">
                <label for="fontSize">Font Size</label>
                <p-inputNumber
                    id="fontSize"
                    formControlName="fontSize"
                    [min]="fontSizeMin"
                    [max]="fontSizeMax"
                    [showButtons]="true"
                    buttonLayout="horizontal"
                    spinnerMode="horizontal"
                    inputStyleClass="w-16"
                    decrementButtonClass="p-button-secondary"
                    incrementButtonClass="p-button-secondary"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus">
                </p-inputNumber>
            </div>
            <div class="flex flex-col gap-1">
                <label for="placement">Placement</label>
                <p-select
                    id="placement"
                    formControlName="placement"
                    [options]="['static', 'map']"
                    appendTo="body"
                    class="w-full">
                </p-select>
            </div>
            @if (placementIsStatic()) {
                <div class="flex flex-col gap-1">
                    <span >Text alignment</span>
                    <p-selectbutton
                        formControlName="textAlign"
                        [options]="textAlignOptions"
                        optionLabel="label"
                        optionValue="value"
                        [fluid]="true"
                        [allowEmpty]="false"
                        >
                        <ng-template #item let-item>
                            <i [class]="item.icon"></i>
                        </ng-template>
                    </p-selectbutton>
                </div>
            }
        </div>
    `,
})
export class NumberSettings implements OnInit, SettingsComponent {
    layer = input.required<NumberLayer>();

    private readonly appOptions = inject(APP_OPTIONS);
    protected readonly fontSizeMin = this.appOptions.minFontSize ?? 1;
    protected readonly fontSizeMax = this.appOptions.maxFontSize ?? 100;

    form!: FormGroup;
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);

    placementIsStatic = signal(false);

    protected textAlignOptions = STATIC_TEXT_ALIGN_OPTIONS;

    ngOnInit() {
        const {
            timelineColor,
            fontColor,
            defaultNumber,
            fontSize,
            placement,
            decimals,
            textAlign,
        } = this.layer();
        this.form = this.fb.group({
            timelineColor: [timelineColor],
            fontColor: [fontColor],
            defaultNumber: [defaultNumber],
            fontSize: [fontSize],
            placement: [placement],
            decimals: [decimals],
            textAlign: [textAlign ?? 'center'],
        });
        this.placementIsStatic.set(placement === 'static');
        this.form
            .get('placement')
            ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((p) => this.placementIsStatic.set(p === 'static'));
    }

    getValues() {
        return this.form.value;
    }
}
