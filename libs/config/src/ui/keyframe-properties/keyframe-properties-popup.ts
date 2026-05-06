import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
    viewChild,
    Type,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../core/services/config.service';
import { configStore, resolveKeyframePropertyDefaultValue } from '../../core/store/config.store';
import { PROPERTY_REGISTRY } from '../../models/property-metadata';
import { KeyframeId, LAYER_TYPE_METADATA, PropertyType, PropertyValueType } from '@geonimate/shared-utils';
import { Popover, PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';

interface PropertyRow {
    id: PropertyType;
    label: string;
    isActive: boolean;
    value: unknown;
    controlComponent: Type<unknown> | null;
}

@Component({
    selector: 'lib-keyframe-properties-popup',
    templateUrl: './keyframe-properties-popup.html',
    styleUrl: './keyframe-properties-popup.scss',
    imports: [CommonModule, PopoverModule, ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyframePropertiesPopup {
    keyframeId = signal<KeyframeId | null>(null);
    popover = viewChild(Popover);
    private configService = inject(ConfigService);

    toggle(event: { event: MouseEvent; keyframeId: KeyframeId }) {
        const popover = this.popover();
        if (popover?.overlayVisible) {
            popover.hide();
        } else {
            this.keyframeId.set(event.keyframeId);
            popover?.show(event.event);
        }
    }

    protected config = inject(configStore);

    activeKeyframeState = computed(() => {
        const id = this.keyframeId();
        if (!id) return null;
        return this.config.keyframeStatesEntityMap()[id] || null;
    });

    propertyRows = computed(()=> {
        const state = this.activeKeyframeState();
        if (!state) return [];

        const layerTypeProperties =
            LAYER_TYPE_METADATA[state.layerType]['keyframeProperties'] || [];

        return layerTypeProperties.map((propId) => {
            const propData = state.properties[propId];
            const isActive = propData?.active ?? false;
            const layer = this.config.layersEntityMap()[state.layerId];
            const fallback = resolveKeyframePropertyDefaultValue(
                layer,
                propId
            );
            const raw = propData?.value;
            const value = raw ?? fallback

            return {
                id: propId,
                label: PROPERTY_REGISTRY[propId].label,
                isActive,
                value,
                controlComponent: PROPERTY_REGISTRY[propId]?.controlComponent,
            };
        });
    });

    toggleActive(propertyId: PropertyType) {
        const id = this.keyframeId();
        if (!id) return;
        this.config.toggleKeyframePropertyActive(id, propertyId);
    }

    onValueChange = (
        propertyId: PropertyType,
        newVal: PropertyValueType[PropertyType]
    ) => {
        const id = this.keyframeId();
        if (!id) return;
        this.config.updateKeyframeProperty(id, propertyId, newVal);
    };

    protected deleteKeyframe() {
        const id = this.keyframeId();
        if (!id) {
            return;
        }
        this.configService.requestRemoveKeyframeById(id);
        this.keyframeId.set(null);
        this.popover()?.hide();
    }

    protected moveHere() {
        const id = this.keyframeId();
        if (!id) {
            return;
        }
        this.configService.requestMovePlayheadToKeyframe(id);
    }
}
