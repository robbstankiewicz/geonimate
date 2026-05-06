import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
    template: `
        <p-button
            [icon]="isPlaying() ? 'pi pi-pause' : 'pi pi-play'"
            [text]="true">
        </p-button>
    `,
    selector: 'lib-play-button',
    styleUrl: './play-button.scss',
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayButton {
    isPlaying = input(false);
}
