import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'lib-timeline-controls',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="timeline-controls">
            <p-button
                [icon]="isPlaying() ? 'pi pi-pause' : 'pi pi-play'"
                (click)="playToggle.emit()"
                [text]="true"
                >
            </p-button>
            <p-button
                icon="pi pi-search-plus"
                (click)="scaleUp.emit()"
                [text]="true">
            </p-button>
            <p-button
                icon="pi pi-search-minus"
                (click)="scaleDown.emit()"
                [text]="true">
            </p-button>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                position: absolute;
                bottom: 1rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
            }
            .timeline-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                background: var(--p-content-background);
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
        `,
    ],
})
export class TimelineControlsComponent {
    isPlaying = input.required<boolean>();
    playToggle = output<void>();
    scaleUp = output<void>();
    scaleDown = output<void>();
}
