import { CdkDrag, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { configStore } from './core/store/config.store';
import { ButtonModule } from 'primeng/button';
import { LayerListItem } from './ui/layer-list-item/layer-list-item';
import {
    LayerSettingsDialog,
    LayerSettingsDialogResult,
} from './ui/layer-settings-dialog/layer-settings-dialog';
import { LayerId, LayerListScroll } from '@geonimate/shared-utils';
import { ConfigService } from './core/services/config.service';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { Layer } from './models';

@Component({
    selector: 'lib-config',
    templateUrl: './config.html',
    styleUrl: './config.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, LayerListItem, DragDropModule, DynamicDialogModule],
    hostDirectives: [LayerListScroll],
    providers: [DialogService],
})
export class Config {
    private store = inject(configStore);
    private configService = inject(ConfigService);
    private dialogService = inject(DialogService);
    protected layers = this.store.layersEntities;
    protected activeLayerId = this.store.activeLayerId;
    protected drop(event: CdkDragDrop<Layer[]>) {
        const { previousIndex, currentIndex } = event;
        const layer = this.layers()[previousIndex];
        this.store.moveLayer(layer.id, currentIndex);
    }
    protected selectLayer(id: LayerId) {
        this.store.setActiveLayer(id);
    }
    protected sortPredicate(index: number) {
        return Boolean(index)
    }
    protected openSettings(event: MouseEvent, layer: Layer) {
        const ref = this.dialogService.open(LayerSettingsDialog, {
            header: `${layer.name}`,
            data: { layer },
            width: '320px',
            closable: true,
            modal: true,
            dismissableMask: true,
            focusOnShow: true,
        });

        if (ref) {
            ref.onClose.subscribe(
                (result: LayerSettingsDialogResult | null | undefined) => {
                    if (!result) {
                        return;
                    }
                    if (result.action === 'remove') {
                        this.store.removeLayer(layer.id);
                        return;
                    }
                    this.store.editLayer(layer.id, result.changes);
                }
            );
        }
    }
    protected editLayer(id: LayerId, event: Partial<Layer>) {
        this.store.editLayer(id, event);
    }

    protected addLayer() {
        this.store.addLayer();
    }

    protected addKeyframe(id: LayerId) {
        this.configService.addKeyframe(id);
    }
}
