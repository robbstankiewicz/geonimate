import { Component, effect, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { settingsStore } from '../store/settings.store';

@Component({
    selector: 'lib-settings-dialog',
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputNumberModule,
        SelectModule,
        CheckboxModule,
        ReactiveFormsModule,
    ],
    templateUrl: './settings-dialog.component.html',
    styles: [
        `
            .settings-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                padding: 1rem 0;
            }
            .field {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .checkbox-row {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 0.5rem;
            }
            label {
                font-weight: 500;
                color: var(--text-color);
            }
            p-inputNumber,
            p-select {
                width: 100%;
            }
            .checkbox-label {
                font-weight: 500;
                color: var(--text-color);
            }
            ::ng-deep {
                p-inputNumber .p-inputnumber,
                p-select .p-select {
                    width: 100%;
                }
            }
        `,
    ],
})
export class SettingsDialogComponent {
    protected readonly store = inject(settingsStore);
    protected form = new FormGroup({
        timeMs: new FormControl(this.store.timeMs(), { nonNullable: true }),
        fps: new FormControl(this.store.fps(), { nonNullable: true }),
        fontFamily: new FormControl(this.store.fontFamily(), {
            nonNullable: true,
        }),
        fontSize: new FormControl(this.store.fontSize(), { nonNullable: true }),
        scaleTextWithMap: new FormControl(this.store.scaleTextWithMap(), {
            nonNullable: true,
        }),
        backgroundLayer: new FormControl(this.store.backgroundLayer(), {
            nonNullable: true,
        }),
    });
    visible = model.required<boolean>();

    fontOptions = this.store.fontOptions();
    backgroundOptions = this.store.getBackgroundLayerOptions();

    constructor() {
        effect(() => {
            // Patch from importing
            const store = this.store.values();
            console.log(store)
            this.form.setValue(store, { emitEvent: true });
        });
    }

    onCancel() {
        this.form.reset(this.store.values(), { emitEvent: false });
        this.visible.set(false);
    }

    onSave() {
        const {
            timeMs,
            fps,
            fontFamily,
            fontSize,
            scaleTextWithMap,
            backgroundLayer,
        } = this.form.getRawValue();
        this.store.updateMaxTimeMs(timeMs);
        this.store.updateFps(fps);
        this.store.updateFontFamily(fontFamily);
        this.store.updateFontSize(fontSize);
        this.store.updateScaleTextWithMap(scaleTextWithMap);
        this.store.updateBackgroundLayer(backgroundLayer);
        this.visible.set(false);
    }
}
