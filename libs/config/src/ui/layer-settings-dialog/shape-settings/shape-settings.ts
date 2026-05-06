import {
    Component,
    input,
    inject,
    ChangeDetectionStrategy,
    signal,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SettingsComponent } from '../settings-component.interface';
import { ShapeLayer } from '../../../models';
import { ImageFilePicker } from '../../components/image-file-picker';
import { Rgb } from '@geonimate/shared-utils';
import { APP_OPTIONS } from '@geonimate/shared-core';

@Component({
    selector: 'lib-shape-settings',
    imports: [
        FormsModule,
        ColorPickerModule,
        InputTextModule,
        InputNumberModule,
        ImageFilePicker,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span>Timeline color</span>
                <p-colorPicker
                    [ngModel]="timelineColor()"
                    (ngModelChange)="timelineColor.set($event)"
                    format="rgb"
                    [autoZIndex]="true"
                    appendTo="body">
                </p-colorPicker>
            </div>
            <div class="flex items-center justify-between">
                <span>Shape color</span>
                <p-colorPicker
                    [ngModel]="shapeColor()"
                    (ngModelChange)="shapeColor.set($event)"
                    format="rgb"
                    [autoZIndex]="true"
                    appendTo="body">
                </p-colorPicker>
            </div>
            <div class="flex items-center justify-between">
                <span>Font color</span>
                <p-colorPicker
                    [ngModel]="fontColor()"
                    (ngModelChange)="fontColor.set($event)"
                    format="rgb"
                    [autoZIndex]="true"
                    appendTo="body">
                </p-colorPicker>
            </div>
            <div class="flex flex-col gap-1">
                <span>Image</span>
                <lib-image-file-picker
                    [value]="image()"
                    (valueChange)="image.set($event)"
                    [maxSize]="2097152">
                </lib-image-file-picker>
            </div>
            <div class="flex flex-col gap-1">
                <label for="defaultText">Default Text</label>
                <input
                    id="defaultText"
                    pInputText
                    [(ngModel)]="defaultText"
                    class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
                <label for="fontSize">Font Size</label>
                <p-inputNumber
                    id="fontSize"
                    [(ngModel)]="fontSize"
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

        </div>
    `,
})
export class ShapeSettings implements SettingsComponent, OnInit {
    layer = input.required<ShapeLayer>();

    private readonly appOptions = inject(APP_OPTIONS);
    protected readonly fontSizeMin = this.appOptions.minFontSize ?? 1;
    protected readonly fontSizeMax = this.appOptions.maxFontSize ?? 100;

    timelineColor = signal<Rgb>({ r: 255, g: 0, b: 0 });
    shapeColor = signal<Rgb>({ r: 255, g: 0, b: 0 });
    fontColor = signal<Rgb>({ r: 255, g: 255, b: 255 });
    defaultText = signal<string>('');
    fontSize = signal<number>(16);
    image = signal<string>('');

    ngOnInit() {
        const layer = this.layer();
        this.timelineColor.set(layer.timelineColor);
        this.shapeColor.set(layer.shapeColor);
        this.fontColor.set(layer.fontColor);
        this.defaultText.set(layer.defaultText ?? '');
        this.fontSize.set(layer.fontSize ?? 16);
        this.image.set(layer.image ?? '');
    }

    getValues() {
        return {
            timelineColor: this.timelineColor(),
            shapeColor: this.shapeColor(),
            fontColor: this.fontColor(),
            defaultText: this.defaultText(),
            fontSize: this.fontSize(),
            image: this.image(),
        };
    }
}
