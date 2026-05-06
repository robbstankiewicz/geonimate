import {
    ChangeDetectionStrategy,
    Component,
    Type,
    computed,
    inject,
    signal,
    viewChild,
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { ShapeSettings } from './shape-settings/shape-settings';
import { PointSettings } from './point-settings/point-settings';
import { TextSettings } from './text-settings/text-settings';
import { NumberSettings } from './number-settings/number-settings';
import { DateSettings } from './date-settings/date-settings';
import { SettingsComponent } from './settings-component.interface';
import { Layer } from '../../models';

export type LayerSettingsDialogResult =
    | { action: 'save'; changes: Partial<Layer> }
    | { action: 'remove' };

@Component({
    selector: 'lib-layer-settings-dialog',
    imports: [CommonModule, ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div
            style="width: 280px; display: flex; flex-direction: column; gap: 12px;">
            <ng-container
                #outlet
                *ngComponentOutlet="
                    activeComponent();
                    inputs: { layer: layer() }
                " />
            <div
                style="display: flex; gap: 8px; justify-content: space-between; align-items: center;">
                @if (layer().type !== 'camera') {
                    <p-button
                        label="Remove"
                        severity="danger"
                        (onClick)="onRemove()">
                    </p-button>
                } @else {
                    <span></span>
                }
                <div style="display: flex; gap: 8px;">
                    <p-button
                        label="Cancel"
                        severity="secondary"
                        (onClick)="onCancel()">
                    </p-button>
                    <p-button label="Save" (onClick)="onSave()"> </p-button>
                </div>
            </div>
        </div>
    `,
})
export class LayerSettingsDialog {
    private config = inject(DynamicDialogConfig);
    private ref = inject(DynamicDialogRef);
    protected layer = signal<Layer>(this.config.data.layer);
    protected activeComponent = computed(
        () => this.componentMap[this.layer().type]
    );
    protected outletRef =
    viewChild<NgComponentOutlet<SettingsComponent>>(NgComponentOutlet);

    private componentMap: Record<string, Type<SettingsComponent>> = {
        shape: ShapeSettings,
        point: PointSettings,
        text: TextSettings,
        number: NumberSettings,
        date: DateSettings,
    };

    onSave() {
        const component = this.outletRef()?.componentInstance;
        if (component) {
            this.ref.close({
                action: 'save',
                changes: component.getValues(),
            } satisfies LayerSettingsDialogResult);
        } else {
            this.ref.close(null);
        }
    }

    onRemove() {
        this.ref.close({ action: 'remove' } satisfies LayerSettingsDialogResult);
    }

    onCancel() {
        this.ref.close(null);
    }
}
