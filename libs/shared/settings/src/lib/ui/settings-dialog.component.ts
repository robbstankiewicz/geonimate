import { Component, effect, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

    visible = model.required<boolean>();

    editedTimeMs = this.store.timeMs();
    editedFps = this.store.fps();
    editedFontFamily = this.store.fontFamily();
    editedFontSize = this.store.fontSize();
    editedScaleTextWithMap = this.store.scaleTextWithMap();
    editedBackgroundLayer = this.store.backgroundLayer();

    fontOptions = this.store.fontOptions();
    backgroundOptions = this.store.getBackgroundLayerOptions();

    constructor() {
        effect(() => {
            const isVisible = this.visible();
            const timeMs = this.store.timeMs();
            const fps = this.store.fps();
            const fontFamily = this.store.fontFamily();
            const fontSize = this.store.fontSize();
            const scaleTextWithMap = this.store.scaleTextWithMap();
            const backgroundLayer = this.store.backgroundLayer();
            if (!isVisible) {
                this.editedTimeMs = timeMs;
                this.editedFps = fps;
                this.editedFontFamily = fontFamily;
                this.editedFontSize = fontSize;
                this.editedScaleTextWithMap = scaleTextWithMap;
                this.editedBackgroundLayer = backgroundLayer;
            }
        });
    }

    onCancel() {
        this.editedTimeMs = this.store.timeMs();
        this.editedFps = this.store.fps();
        this.editedFontFamily = this.store.fontFamily();
        this.editedFontSize = this.store.fontSize();
        this.editedScaleTextWithMap = this.store.scaleTextWithMap();
        this.editedBackgroundLayer = this.store.backgroundLayer();
        this.visible.set(false);
    }

    onSave() {
        this.store.updateMaxTimeMs(this.editedTimeMs);
        this.store.updateFps(this.editedFps);
        this.store.updateFontFamily(this.editedFontFamily);
        this.store.updateFontSize(this.editedFontSize);
        this.store.updateScaleTextWithMap(this.editedScaleTextWithMap);
        this.store.updateBackgroundLayer(this.editedBackgroundLayer);
        this.visible.set(false);
    }
}
