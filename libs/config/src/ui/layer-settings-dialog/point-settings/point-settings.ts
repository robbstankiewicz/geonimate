import {
    Component,
    input,
    inject,
    OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PointLayer } from '../../../models';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SettingsComponent } from '../settings-component.interface';
import { ImageFilePicker } from '../../components/image-file-picker';
import { APP_OPTIONS } from '@geonimate/shared-core';

@Component({
    selector: 'lib-point-settings',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ColorPickerModule,
        InputTextModule,
        InputNumberModule,
        ImageFilePicker,
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
                <span>Dot color</span>
                <p-colorPicker
                    formControlName="dotColor"
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
                <label for="defaultText">Default Text</label>
                <input
                    id="defaultText"
                    pInputText
                    formControlName="defaultText"
                    class="w-full" />
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
                <span>Image</span>
                <lib-image-file-picker
                    [value]="form.value.image || ''"
                    (valueChange)="form.patchValue({ image: $event })"
                    [maxSize]="2097152">
                </lib-image-file-picker>
            </div>
        </div>
    `,
})
export class PointSettings implements OnInit, SettingsComponent {
    layer = input.required<PointLayer>();

    private readonly appOptions = inject(APP_OPTIONS);
    protected readonly fontSizeMin = this.appOptions.minFontSize ?? 1;
    protected readonly fontSizeMax = this.appOptions.maxFontSize ?? 100;

    form!: FormGroup;
    private fb = inject(FormBuilder);

    ngOnInit() {
        const {
            timelineColor,
            dotColor,
            fontColor,
            defaultText,
            fontSize,
            image,
        } = this.layer();
        this.form = this.fb.group({
            timelineColor: [timelineColor],
            dotColor: [dotColor],
            fontColor: [fontColor],
            defaultText: [defaultText],
            fontSize: [fontSize],
            image: [image],
        });
    }

    getValues() {
        return this.form.value;
    }
}
