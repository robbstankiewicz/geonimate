import {
    Component,
    input,
    output,
    computed,
    ChangeDetectionStrategy,
    ElementRef,
    inject,
    signal,
    effect,
    untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { MapLayer } from '../../core/store/map.store';
import {
    DateLayer,
    formatDate,
    formatNumber,
    LayerId,
    NumberLayer,
    StaticPosition,
    TextLayer,
} from '@geonimate/shared-utils';
import { settingsStore } from '@geonimate/settings';

@Component({
    selector: 'lib-static-element',
    imports: [CommonModule, DragDropModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.left]': 'leftStyle()',
        '[style.right]': 'rightStyle()',
        '[style.top]': 'topStyle()',
        '[style.bottom]': 'bottomStyle()',
    },
    template: `
        <div
            class="static-element"
            cdkDrag
            cdkDragBoundary=".static-overlay-container"
            (cdkDragEnded)="onDragEnd($event)"
            [style.color]="textColor()"
            [style.font-family]="fontFamily()"
            [style.font-size.px]="textFontSize()"
            [style.text-align]="textAlign()"
            [style.opacity]="textOpacity()"
            [style.display]="textDisplay()">
            {{ displayText() }}
        </div>
    `,
    styles: [
        `
            :host {
                position: absolute;
            }
            .static-element {
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                cursor: move;
                pointer-events: auto;
                padding: 4px 8px;
                border-radius: 4px;
                user-select: none;
                display: inline-block;
                white-space: normal;
            }
            .static-element:hover {
                background: rgba(0, 0, 0, 0.3);
            }
            .static-element.cdk-drag-dragging {
                z-index: 100;
                background: rgba(0, 0, 0, 0.5);
            }
        `,
    ],
})
export class StaticElementComponent {
    mapLayer = input.required<MapLayer<TextLayer | NumberLayer | DateLayer>>();
    container = input.required<HTMLElement>();
    dragEnd = output<{ layerId: LayerId; position: StaticPosition }>();
    private elementRef = inject(ElementRef);
    private settings = inject(settingsStore);

    private config = computed(() => this.mapLayer().config);
    private props = computed(() => this.mapLayer().animatedProperties);

    private elementSize = signal<{ width: number; height: number }>({
        width: 0,
        height: 0,
    });

    private staticPosition = computed(() => {
        const container = this.container();
        const containerWidth = container.offsetWidth;

        return (
            this.props().staticPosition ?? {
                anchorX: 'left',
                anchorY: 'bottom',
                offsetX: containerWidth / 2,
                offsetY: 90,
            }
        );
    });

    constructor() {
        effect(() => {
            this.displayText();
            this.textFontSize();
            this.textAlign();
            untracked(() => {
                requestAnimationFrame(() => {
                    this.elementSize.set({
                        width: this.elementRef.nativeElement.offsetWidth,
                        height: this.elementRef.nativeElement.offsetHeight,
                    });
                });
            });
        });
    }

    leftStyle = computed(() => {
        const pos = this.staticPosition();
        const size = this.elementSize();
        const fx = this.anchorFractionX();
        if (pos?.anchorX !== 'left') return null;
        return `${pos.offsetX - size.width * fx}px`;
    });

    rightStyle = computed(() => {
        const pos = this.staticPosition();
        const size = this.elementSize();
        const fx = this.anchorFractionX();
        if (pos?.anchorX !== 'right') return null;
        return `${pos.offsetX - size.width * (1 - fx)}px`;
    });

    topStyle = computed(() => {
        const pos = this.staticPosition();
        const size = this.elementSize();
        if (pos?.anchorY !== 'top') return null;
        return `${pos.offsetY - size.height / 2}px`;
    });

    bottomStyle = computed(() => {
        const pos = this.staticPosition();
        const size = this.elementSize();
        if (pos?.anchorY !== 'bottom') return null;
        return `${pos.offsetY - size.height / 2}px`;
    });

    textColor = computed(() => {
        const cfg = this.config();
        const p = this.props();
        const c =
            cfg.type === 'text' ||
            cfg.type === 'number' ||
            cfg.type === 'date'
                ? p.fontColor ?? cfg.fontColor
                : { r: 255, g: 255, b: 255 };
        return `rgb(${c.r}, ${c.g}, ${c.b})`;
    });

    fontFamily = computed(() => {
        return this.settings.fontFamily();
    });

    textFontSize = computed(() => {
        return this.config().fontSize ?? this.settings.fontSize();
    });

    textAlign = computed(() => {
        return this.config().textAlign ?? 'center';
    });

    private anchorFractionX = computed(() => {
        const ta = this.textAlign();
        if (ta === 'left') return 0;
        if (ta === 'right') return 1;
        return 0.5;
    });

    textOpacity = computed(() => {
        const opacity = this.props()['opacity'];
        return opacity !== undefined ? opacity / 100 : 1;
    });

    textDisplay = computed(() => {
        return this.props()['display'] === false ? 'none' : 'block';
    });

    displayText = computed(() => {
        const config = this.config();
        const props = this.props();

        if (config.type === 'text') {
            return props['label'] || config.defaultText || '';
        }
        if (config.type === 'number') {
            const numValue = props['number'] ?? config.defaultNumber ?? 0;
            const decimals = config.decimals ?? 0;
            return formatNumber(Number(numValue), decimals);
        }
        if (config.type === 'date') {
            const dateValue = props.date || config.defaultDate;

            const format = config.format || 'YYYY-MM-DD';
            return dateValue ? formatDate(dateValue, format) : '';
        }
        return '';
    });

    onDragEnd(event: CdkDragEnd) {
        const dropPoint = event.dropPoint;
        if (!dropPoint) return;

        const container = this.container();
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const sourceElement = event.source.getRootElement() as HTMLElement;
        const elementRect = sourceElement.getBoundingClientRect();

        const fx = this.anchorFractionX();
        const elementAnchorX = elementRect.left + elementRect.width * fx;
        const elementAnchorY = elementRect.top + elementRect.height / 2;
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;

        const anchorX: 'left' | 'right' =
            elementAnchorX < containerCenterX ? 'left' : 'right';
        const anchorY: 'top' | 'bottom' =
            elementAnchorY < containerCenterY ? 'top' : 'bottom';

        let offsetX: number;
        let offsetY: number;

        if (anchorX === 'left') {
            offsetX = elementAnchorX - containerRect.left;
        } else {
            offsetX = containerRect.right - elementAnchorX;
        }

        if (anchorY === 'top') {
            offsetY = elementAnchorY - containerRect.top;
        } else {
            offsetY = containerRect.bottom - elementAnchorY;
        }

        offsetX = Math.max(0, Math.min(containerRect.width, offsetX));
        offsetY = Math.max(0, Math.min(containerRect.height, offsetY));

        event.source._dragRef.setFreeDragPosition({ x: 0, y: 0 });

        const newPosition: StaticPosition = {
            anchorX,
            anchorY,
            offsetX,
            offsetY,
        };

        this.dragEnd.emit({
            layerId: this.mapLayer().id,
            position: newPosition,
        });
    }
}
